// Supabase Edge Function for the VibeShelf coursework demo.
// Handles order creation, private order tracking, mock payment, email delivery,
// and a 15-minute signed download URL for files in the private `ebooks` bucket.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type Payload = {
  action?: "create" | "track" | "pay";
  bookSlug?: string;
  customerName?: string;
  customerEmail?: string;
  orderId?: string;
};

const ORDER_ID_PATTERN = /^VIBE-[0-9]{6}-[0-9]{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function makeOrderId(): string {
  const day = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return `VIBE-${day}-${String(random).padStart(4, "0")}`;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function badRequest(message: string, status = 400): Response {
  return Response.json({ ok: false, message }, { status });
}

async function loadOrder(admin: any, orderId: string, email: string) {
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,book_id,customer_name,customer_email,total,status,email_status,created_at,paid_at")
    .eq("id", orderId)
    .ilike("customer_email", email)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return null;

  const { data: book, error: bookError } = await admin
    .from("books")
    .select("slug,title,file_path")
    .eq("id", order.book_id)
    .maybeSingle();

  if (bookError) throw bookError;
  if (!book) return null;
  return { order, book };
}

async function sendDownloadEmail(
  recipient: string,
  customerName: string,
  orderId: string,
  bookTitle: string,
  downloadUrl: string,
): Promise<"SENT" | "SENT_DEMO" | "FAILED"> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return "SENT_DEMO";

  const from = Deno.env.get("EMAIL_FROM") || "VibeShelf <orders@vibeshelf-ebook-shop.me>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `ดาวน์โหลด ${bookTitle} — ${orderId}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17362e">
          <h2>ชำระเงินจำลองสำเร็จ</h2>
          <p>สวัสดี ${escapeHtml(customerName)}</p>
          <p>คำสั่งซื้อ <strong>${escapeHtml(orderId)}</strong> พร้อมดาวน์โหลดแล้ว</p>
          <p><a href="${escapeHtml(downloadUrl)}" style="display:inline-block;padding:12px 18px;background:#2f6758;color:#fff;text-decoration:none;border-radius:8px">ดาวน์โหลด ${escapeHtml(bookTitle)}</a></p>
          <p>ลิงก์นี้มีอายุ 15 นาที และเป็นระบบ DEMO ONLY</p>
        </div>
      `,
    }),
  });

  return response.ok ? "SENT" : "FAILED";
}

export default {
  fetch: withSupabase({ auth: "publishable" }, async (request, context) => {
    try {
      if (request.method !== "POST") {
        return badRequest("รองรับเฉพาะคำขอ POST", 405);
      }

      const payload = (await request.json()) as Payload;
      const action = payload.action;
      const admin = context.supabaseAdmin;

      if (action === "create") {
        const bookSlug = clean(payload.bookSlug, 80);
        const customerName = clean(payload.customerName, 120);
        const customerEmail = clean(payload.customerEmail, 180).toLowerCase();

        if (!bookSlug || customerName.length < 2 || !EMAIL_PATTERN.test(customerEmail)) {
          return badRequest("กรุณากรอกหนังสือ ชื่อ และอีเมลให้ถูกต้อง");
        }

        const { data: book, error: bookError } = await admin
          .from("books")
          .select("id,slug,title,price")
          .eq("slug", bookSlug)
          .eq("active", true)
          .maybeSingle();

        if (bookError) throw bookError;
        if (!book) return badRequest("ไม่พบ E-book ที่เลือก", 404);

        let order: any = null;
        for (let attempt = 0; attempt < 5 && !order; attempt += 1) {
          const { data, error } = await admin
            .from("orders")
            .insert({
              id: makeOrderId(),
              book_id: book.id,
              customer_name: customerName,
              customer_email: customerEmail,
              total: book.price,
              status: "PENDING",
              email_status: "NOT_SENT",
            })
            .select("id,status,total,created_at")
            .single();

          if (!error) order = data;
          else if (error.code !== "23505") throw error;
        }

        if (!order) throw new Error("ไม่สามารถสร้างเลขคำสั่งซื้อได้");
        return Response.json({
          ok: true,
          order: {
            ...order,
            bookSlug: book.slug,
            bookTitle: book.title,
            customerName,
            maskedEmail: maskEmail(customerEmail),
          },
        });
      }

      const orderId = clean(payload.orderId, 30).toUpperCase();
      const customerEmail = clean(payload.customerEmail, 180).toLowerCase();
      if (!ORDER_ID_PATTERN.test(orderId) || !EMAIL_PATTERN.test(customerEmail)) {
        return badRequest("เลขคำสั่งซื้อหรืออีเมลไม่ถูกต้อง");
      }

      const record = await loadOrder(admin, orderId, customerEmail);
      if (!record) return badRequest("ไม่พบคำสั่งซื้อที่ตรงกับอีเมลนี้", 404);

      if (action === "track") {
        return Response.json({
          ok: true,
          order: {
            id: record.order.id,
            status: record.order.status,
            emailStatus: record.order.email_status,
            total: record.order.total,
            createdAt: record.order.created_at,
            paidAt: record.order.paid_at,
            bookSlug: record.book.slug,
            bookTitle: record.book.title,
            customerName: record.order.customer_name,
            maskedEmail: maskEmail(record.order.customer_email),
          },
        });
      }

      if (action === "pay") {
        const { data: signed, error: signedError } = await admin.storage
          .from("ebooks")
          .createSignedUrl(record.book.file_path, 15 * 60, { download: true });

        if (signedError || !signed?.signedUrl) throw signedError || new Error("สร้างลิงก์ดาวน์โหลดไม่สำเร็จ");

        const emailStatus = await sendDownloadEmail(
          record.order.customer_email,
          record.order.customer_name,
          record.order.id,
          record.book.title,
          signed.signedUrl,
        );
        const paidAt = record.order.paid_at || new Date().toISOString();

        const { error: updateError } = await admin
          .from("orders")
          .update({
            status: "PAID",
            paid_at: paidAt,
            email_status: emailStatus,
            email_sent_at: emailStatus === "SENT" ? new Date().toISOString() : null,
            download_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          })
          .eq("id", record.order.id);

        if (updateError) throw updateError;
        return Response.json({
          ok: true,
          order: {
            id: record.order.id,
            status: "PAID",
            emailStatus,
            bookTitle: record.book.title,
            customerName: record.order.customer_name,
            maskedEmail: maskEmail(record.order.customer_email),
            paidAt,
          },
          downloadUrl: signed.signedUrl,
          expiresInSeconds: 900,
        });
      }

      return badRequest("ไม่รู้จักคำสั่งที่ส่งมา");
    } catch (error) {
      console.error(error);
      return Response.json(
        { ok: false, message: "ระบบขัดข้อง กรุณาลองใหม่", detail: String(error) },
        { status: 500 },
      );
    }
  }),
};
