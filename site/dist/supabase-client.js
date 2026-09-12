(function () {
  "use strict";

  function config() {
    return window.VIBESHELF_SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    const { projectUrl, publishableKey } = config();
    return Boolean(projectUrl && publishableKey);
  }

  function assertSafeConfig() {
    const { projectUrl, publishableKey } = config();
    if (!projectUrl || !publishableKey) {
      throw new Error("ยังไม่ได้ตั้งค่า Supabase Project URL และ Publishable Key");
    }
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(projectUrl)) {
      throw new Error("Supabase Project URL ไม่ถูกต้อง");
    }
    if (!publishableKey.startsWith("sb_publishable_")) {
      throw new Error("ใช้ได้เฉพาะ Supabase Publishable Key ที่ขึ้นต้นด้วย sb_publishable_");
    }
    return {
      projectUrl: projectUrl.replace(/\/$/, ""),
      publishableKey,
    };
  }

  async function request(path, options = {}) {
    const { projectUrl, publishableKey } = assertSafeConfig();
    const response = await fetch(`${projectUrl}${path}`, {
      ...options,
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase ${response.status}: ${detail || response.statusText}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function healthCheck() {
    const rows = await request("/rest/v1/books?select=slug&active=eq.true&limit=1");
    return { connected: true, readableBooks: Array.isArray(rows) };
  }

  async function listBooks() {
    return request(
      "/rest/v1/books?select=slug,title,subtitle,description,long_description,price,image_path,file_path&active=eq.true&order=price.asc",
    );
  }

  async function orderRequest(action, payload) {
    const { projectUrl, publishableKey } = assertSafeConfig();
    const response = await fetch(`${projectUrl}/functions/v1/vibeshelf-order`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || `Supabase Function ${response.status}`);
    }
    return result;
  }

  function createOrder(bookSlug, customerName, customerEmail) {
    return orderRequest("create", { bookSlug, customerName, customerEmail });
  }

  function trackOrder(orderId, customerEmail) {
    return orderRequest("track", { orderId, customerEmail });
  }

  function payOrder(orderId, customerEmail) {
    return orderRequest("pay", { orderId, customerEmail });
  }

  window.VibeShelfDB = Object.freeze({
    isConfigured,
    healthCheck,
    listBooks,
    createOrder,
    trackOrder,
    payOrder,
  });
})();
