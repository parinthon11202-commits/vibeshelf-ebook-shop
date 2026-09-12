# VibeShelf E-book Shop

โปรเจกต์ร้าน E-book สำหรับใบงาน Vibe Coding E-book 2026 รองรับหน้าร้าน หนังสือ 3 รายการ Checkout คำสั่งซื้อสถานะ `PENDING` ระบบ Mock Payment สถานะ `PAID` การติดตามคำสั่งซื้อแบบตรวจเลขคำสั่งซื้อร่วมกับอีเมล และการส่งลิงก์ดาวน์โหลดทางอีเมล

## โครงสร้างสำคัญ

- `site/dist` เว็บไซต์ Static ที่ใช้ Deploy ไป Vercel
- `supabase/setup.sql` โครงสร้างตารางและ Storage bucket
- `supabase/functions/vibeshelf-order` Edge Function สำหรับคำสั่งซื้อ การชำระเงินจำลอง อีเมล และ Signed URL
- `mobile/VibeShelfWebView.aia` โปรเจกต์ MIT App Inventor
- `output/pdf` ไฟล์ E-book ทั้ง 3 รายการ
- `design` เอกสารและภาพออกแบบ UI

## ระบบภายนอก

- Supabase: เก็บหนังสือ คำสั่งซื้อ และไฟล์ PDF แบบ Private
- Resend: ส่งอีเมลหลังสถานะ `PAID`
- Vercel: Hosting สำหรับ Production URL

## Deploy เว็บไซต์บน Vercel

1. Import GitHub repository นี้ใน Vercel
2. ตั้งค่า Root Directory เป็น `site/dist`
3. เลือก Framework Preset เป็น `Other`
4. ไม่ต้องเพิ่ม Resend API key ใน Vercel เพราะเก็บเป็น Edge Function Secret ใน Supabase
5. Deploy และทดสอบ flow อีกครั้งบน Production URL

## ข้อควรระวัง

- ระบบชำระเงินเป็น `DEMO ONLY` ไม่มีการรับเงินจริง
- ห้าม commit Resend API key, Supabase Secret key, Service Role key หรือรหัสผ่านฐานข้อมูล
- `site/dist/supabase-config.js` มีเฉพาะ Supabase Project URL และ Publishable key สำหรับ browser
