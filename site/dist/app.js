(function () {
  "use strict";

  const CUSTOMER_STORE_KEY = "vibeshelf.customer.v1";

  const books = [
    {
      slug: "tarot-app",
      title: "Tarot App",
      subtitle: "ไพ่ทาโรต์ 3 กาล",
      description: "คู่มือสร้างแอปเปิดไพ่ 3 กาล พร้อมภาพและเสียง",
      longDescription:
        "คู่มือพัฒนา Desktop Application สำหรับสุ่มไพ่ Major Arcana 3 ใบในตำแหน่งอดีต ปัจจุบัน และอนาคต พร้อมภาพ ความหมายภาษาไทย และระบบเสียงประกอบ",
      price: 199,
      image: "./assets/tarot-app.png",
      file: "tarot-app-ebook.pdf",
      coverA: "#765846",
      coverB: "#2f4636",
      highlights: [
        "ออกแบบ UI แนว Mystical Dark / Warm Gold",
        "สุ่มไพ่ Major Arcana โดยไม่ซ้ำกัน",
        "ควบคุมเพลง เล่น พัก หยุด และระดับเสียง",
        "จัดการไฟล์ภาพหรือเพลงเสียโดยแอปไม่หยุดทำงาน",
      ],
    },
    {
      slug: "task-manager-pro",
      title: "Task Manager PRO",
      subtitle: "จัดการงานด้วย SQLite",
      description: "สร้างระบบจัดการงาน พร้อม Dashboard และฐานข้อมูล",
      longDescription:
        "คู่มือสร้างระบบจัดการงานครบวงจร มี Login, Priority, Category, Dashboard, Search, Trash, CSV, Reminder, Backup และ Dark/Light Theme",
      price: 249,
      image: "./assets/task-manager-pro.png",
      file: "task-manager-pro-ebook.pdf",
      coverA: "#527461",
      coverB: "#263f35",
      highlights: [
        "ออกแบบฐานข้อมูลผู้ใช้ หมวดหมู่ และงานด้วย SQLite",
        "สร้าง Dashboard และตัวกรองแบบ Real-time",
        "นำเข้าและส่งออก CSV พร้อมภาษาไทย",
        "สำรอง กู้คืน และ Build เป็นไฟล์ Windows EXE",
      ],
    },
    {
      slug: "media-player-pro",
      title: "Media Player PRO",
      subtitle: "เครื่องเล่นเพลงสมัยใหม่",
      description: "สร้างเครื่องเล่นเพลง พร้อม Playlist และระบบควบคุมเสียง",
      longDescription:
        "คู่มือสร้างเครื่องเล่นเพลง Desktop ด้วย Python และ PyQt6 รองรับ Playlist หลายไฟล์ การเล่น พัก หยุด กรอเพลง ปรับเสียง และป้องกันข้อผิดพลาด",
      price: 179,
      image: "./assets/media-player-pro.png",
      file: "media-player-pro-ebook.pdf",
      coverA: "#b06d4f",
      coverB: "#5b4637",
      highlights: [
        "เพิ่มเพลงหลายไฟล์เข้าสู่ Playlist",
        "ดับเบิลคลิกเพื่อเล่นและแสดง Now Playing",
        "Slider แสดงเวลาและลากข้ามท่อนเพลงได้",
        "ลบเพลง ล้างรายการ และควบคุมเสียง 0–100%",
      ],
    },
  ];

  const appState = {
    selectedSlug: "",
    trackingResult: null,
    trackingMessage: "",
    toastTimer: null,
    countdownTimer: null,
    orders: new Map(),
  };

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const nav = document.getElementById("site-nav");
  const menuButton = document.querySelector('[data-action="toggle-menu"]');

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function thaiDate(value) {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function getBook(slug) {
    return books.find((book) => book.slug === slug);
  }

  function findOrder(orderId) {
    return appState.orders.get(String(orderId).toUpperCase()) || null;
  }

  function rememberOrder(order) {
    appState.orders.set(order.id, order);
    return order;
  }

  function normalizeRemoteOrder(remote, options = {}) {
    const base = options.base || {};
    const expiresInSeconds = Number(options.expiresInSeconds || 0);
    return {
      ...base,
      id: remote.id,
      bookSlug: remote.bookSlug || base.bookSlug,
      name: remote.customerName || base.name || "",
      email: options.email || base.email || remote.maskedEmail || "",
      total: Number(remote.total ?? base.total ?? 0),
      status: remote.status || base.status || "PENDING",
      createdAt: remote.createdAt || remote.created_at || base.createdAt || new Date().toISOString(),
      paidAt: remote.paidAt || base.paidAt || null,
      emailStatus: String(remote.emailStatus || remote.email_status || base.emailStatus || "NOT_SENT").toUpperCase(),
      downloadUrl: options.downloadUrl || base.downloadUrl || null,
      downloadExpiresAt: expiresInSeconds
        ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
        : base.downloadExpiresAt || null,
    };
  }

  async function createOrder(book, name, email) {
    if (!window.VibeShelfDB?.isConfigured()) throw new Error("ยังไม่ได้เชื่อม Supabase");
    const result = await window.VibeShelfDB.createOrder(book.slug, name, email);
    return rememberOrder(normalizeRemoteOrder(result.order, { email }));
  }

  async function trackOrder(orderId, email) {
    if (!window.VibeShelfDB?.isConfigured()) throw new Error("ยังไม่ได้เชื่อม Supabase");
    const result = await window.VibeShelfDB.trackOrder(orderId, email);
    return rememberOrder(normalizeRemoteOrder(result.order, { email }));
  }

  async function payOrder(orderId) {
    const current = findOrder(orderId);
    if (!current?.email) throw new Error("ไม่พบอีเมลของคำสั่งซื้อ");
    const result = await window.VibeShelfDB.payOrder(orderId, current.email);
    return rememberOrder(
      normalizeRemoteOrder(result.order, {
        base: current,
        email: current.email,
        downloadUrl: result.downloadUrl,
        expiresInSeconds: result.expiresInSeconds,
      }),
    );
  }

  async function renewDownload(orderId) {
    return payOrder(orderId);
  }

  function showToast(message) {
    window.clearTimeout(appState.toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    appState.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function setSelectedBook(slug) {
    appState.selectedSlug = slug || "";
    document.getElementById("cart-count").textContent = slug ? "1" : "0";
  }

  function closeMenu() {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  function setActiveNav(route) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === route);
    });
  }

  function coverMarkup(book, detail = false) {
    return `
      <div class="book-cover${detail ? " detail-cover" : ""}" style="--cover-a:${book.coverA};--cover-b:${book.coverB}">
        <span class="cover-label">E-BOOK</span>
        <img src="${book.image}" alt="สัญลักษณ์ปก ${escapeHtml(book.title)}" />
        <span class="cover-title">${escapeHtml(book.title)}</span>
      </div>
    `;
  }

  function productCard(book) {
    return `
      <article class="product-card">
        ${coverMarkup(book)}
        <div class="product-body">
          <h3>${escapeHtml(book.title)}</h3>
          <p>${escapeHtml(book.description)}</p>
          <div class="product-meta">
            <span class="price">${money(book.price)}</span>
            <span class="format-note">ไฟล์ PDF</span>
          </div>
          <a class="button button-primary button-block" href="#/book/${book.slug}">
            ดูหนังสือ <span aria-hidden="true">→</span>
          </a>
        </div>
      </article>
    `;
  }

  function storeView() {
    setSelectedBook("");
    return `
       

      <section class="section-tight">
        <div class="page-shell">
          <div class="catalog-title">
            <h2>E-book แนะนำ</h2>
        
          </div>
          <div class="product-grid">
            ${books.map(productCard).join("")}
          </div>

          <div class="trust-strip" aria-label="ข้อมูลการส่งมอบ">
            <div class="trust-item"><span class="trust-icon" aria-hidden="true">↓</span> ดาวน์โหลดไฟล์ PDF</div>
            <div class="trust-item"><span class="trust-icon" aria-hidden="true">@</span> รับลิงก์ทางอีเมล</div>
            <div class="trust-item"><span class="trust-icon" aria-hidden="true">▯</span> อ่านได้ทุกอุปกรณ์</div>
          </div>
          <div class="demo-bar"><strong>DEMO ONLY</strong> · ระบบสั่งซื้อเพื่อการศึกษา ไม่มีการเรียกเก็บเงินจริง</div>
        </div>
      </section>
    `;
  }

  function bookView(book) {
    setSelectedBook(book.slug);
    return `
      <div class="page-shell">
        <header class="page-heading">
          <p class="breadcrumb"><a href="#/store">หน้าร้าน</a><span>/</span><span>${escapeHtml(book.title)}</span></p>
        </header>
        <section class="detail-grid section-tight">
          ${coverMarkup(book, true)}
          <article class="content-card">
            <p class="book-kicker">DIGITAL E-BOOK • PDF</p>
            <h1>${escapeHtml(book.title)}</h1>
            <p class="lead">${escapeHtml(book.longDescription)}</p>
            <h2 class="section-title">สิ่งที่จะได้เรียนรู้</h2>
            <ul class="feature-list">
              ${book.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <div class="purchase-box">
              <div class="purchase-row">
                <div>
                  <span class="muted">ราคา E-book</span>
                  <div class="price">${money(book.price)}</div>
                </div>
                <span class="pill">ส่งลิงก์ทางอีเมล</span>
              </div>
              <a class="button button-primary button-block" href="#/checkout/${book.slug}">ซื้อ E-book</a>
              <p class="secure-note">ระบบสาธิตจะสร้างคำสั่งซื้อสถานะ PENDING ก่อนเข้าสู่ Mock Payment โดยไม่มีการเก็บข้อมูลบัตรหรือรับเงินจริง</p>
            </div>
          </article>
        </section>
      </div>
    `;
  }

  function checkoutView(book) {
    setSelectedBook(book.slug);
    let customer = {};
    try {
      customer = JSON.parse(localStorage.getItem(CUSTOMER_STORE_KEY) || "{}");
    } catch {
      customer = {};
    }

    return `
      <div class="page-shell">
        <header class="page-heading">
          <p class="breadcrumb"><a href="#/store">หน้าร้าน</a><span>/</span><a href="#/book/${book.slug}">${escapeHtml(book.title)}</a><span>/</span><span>Checkout</span></p>
          <h1>ข้อมูลผู้สั่งซื้อ</h1>
          <p class="muted">กรอกข้อมูลให้ครบเพื่อนำไปสร้างคำสั่งซื้อและใช้ติดตามสถานะ</p>
        </header>
        <section class="checkout-grid section-tight">
          <form id="checkout-form" class="content-card form-stack" novalidate data-book-slug="${book.slug}">
            <div class="field">
              <label for="customer-name">ชื่อ-นามสกุล</label>
              <input id="customer-name" name="name" autocomplete="name" maxlength="120" value="${escapeHtml(customer.name || "")}" placeholder="เช่น วิชัย ใจดี" required />
              <p class="field-error" id="name-error"></p>
            </div>
            <div class="field">
              <label for="customer-email">อีเมล</label>
              <input id="customer-email" name="email" type="email" autocomplete="email" maxlength="180" value="${escapeHtml(customer.email || "")}" placeholder="name@example.com" required />
              <p class="field-error" id="email-error"></p>
            </div>
            <button class="button button-primary button-block" type="submit">ยืนยันคำสั่งซื้อ</button>
            <p class="secure-note">เมื่อยืนยัน ระบบจะสร้างเลขคำสั่งซื้อและบันทึกสถานะเริ่มต้นเป็น PENDING ใน Supabase</p>
          </form>

          <aside class="summary-card" aria-label="สรุปรายการ">
            <h2>สรุปรายการ</h2>
            <div class="summary-product">
              <img class="summary-thumb" src="${book.image}" alt="" />
              <div>
                <h3>${escapeHtml(book.title)}</h3>
                <p>${escapeHtml(book.subtitle)} × 1</p>
              </div>
            </div>
            <div class="summary-total"><span>ยอดรวม</span><strong>${money(book.price)}</strong></div>
            <p class="secure-note"><strong>DEMO ONLY</strong><br />ไม่มีค่าจัดส่งและไม่มีการตัดเงินจริง</p>
          </aside>
        </section>
      </div>
    `;
  }

  function orderFacts(order, book) {
    return `
      <dl class="order-facts">
        <div><dt>รายการ</dt><dd>${escapeHtml(book.title)} × 1</dd></div>
        <div><dt>ผู้สั่งซื้อ</dt><dd>${escapeHtml(order.name)}</dd></div>
        <div><dt>อีเมล</dt><dd>${escapeHtml(order.email)}</dd></div>
        <div><dt>วันที่สร้าง</dt><dd>${thaiDate(order.createdAt)}</dd></div>
        <div><dt>ยอดรวม</dt><dd>${money(order.total)}</dd></div>
      </dl>
    `;
  }

  function orderView(order) {
    const book = getBook(order.bookSlug);
    setSelectedBook(book?.slug || "");
    if (!book) return errorView("ไม่พบข้อมูลหนังสือของคำสั่งซื้อนี้");
    if (order.status === "PAID") return successView(order);

    return `
      <div class="page-shell">
        <header class="page-heading">
          <p class="breadcrumb"><a href="#/store">หน้าร้าน</a><span>/</span><span>คำสั่งซื้อ</span></p>
          <h1>คำสั่งซื้อของคุณ</h1>
        </header>
        <section class="status-grid section-tight">
          <article class="status-card status-main">
            <div class="demo-badge"><span aria-hidden="true">!</span> DEMO ONLY</div>
            <div>
              <span class="status-label pending">PENDING</span>
              <p class="muted">เลขคำสั่งซื้อ</p>
              <p class="order-number">${escapeHtml(order.id)}</p>
            </div>
            <div class="notice"><strong>ระบบจำลอง • ไม่รับชำระเงินจริง</strong><br />ปุ่มด้านล่างจะเปลี่ยนสถานะเป็น PAID เพื่อทดสอบ flow เท่านั้น</div>
            <button class="button button-warning button-block" type="button" data-action="mock-pay" data-order-id="${escapeHtml(order.id)}">จำลองชำระเงินสำเร็จ</button>
          </article>
          <aside class="summary-card">
            <h2>รายละเอียดคำสั่งซื้อ</h2>
            ${orderFacts(order, book)}
            <button class="button button-secondary button-block" type="button" data-action="copy-order" data-order-id="${escapeHtml(order.id)}">คัดลอกเลขคำสั่งซื้อ</button>
          </aside>
        </section>
      </div>
    `;
  }

  function successView(order) {
    const book = getBook(order.bookSlug);
    setSelectedBook(book?.slug || "");
    if (!book) return errorView("ไม่พบข้อมูลหนังสือของคำสั่งซื้อนี้");

    const emailTitle = order.emailStatus === "SENT" ? "ส่งอีเมลสำเร็จ" : order.emailStatus === "FAILED" ? "ส่งอีเมลไม่สำเร็จ" : "อีเมลโหมดจำลอง";
    const emailMessage = order.emailStatus === "SENT"
      ? `ส่งลิงก์ดาวน์โหลดไปยัง ${escapeHtml(order.email)}`
      : order.emailStatus === "FAILED"
        ? "ระบบยังส่งอีเมลไม่ได้ แต่สามารถดาวน์โหลดจากปุ่มด้านล่าง"
        : "ยังไม่ได้ตั้งค่าบริการอีเมล จึงไม่มีอีเมลส่งเข้า Gmail จริง";

    return `
      <div class="page-shell">
        <header class="page-heading">
          <p class="breadcrumb"><a href="#/store">หน้าร้าน</a><span>/</span><span>ผลการสั่งซื้อ</span></p>
          <h1>ชำระเงินจำลองสำเร็จ</h1>
        </header>
        <section class="status-grid section-tight">
          <article class="status-card status-main">
            <div class="demo-badge"><span aria-hidden="true">!</span> DEMO ONLY</div>
            <div class="success-panel">
              <div class="success-icon" aria-hidden="true">✓</div>
              <span class="status-label paid">PAID</span>
              <h2>${emailTitle}</h2>
              <p>${emailMessage}</p>
            </div>
            <p class="notice">ลิงก์ดาวน์โหลดมีอายุ 15 นาที • เหลือเวลา <span id="download-countdown" class="countdown" data-expires="${escapeHtml(order.downloadExpiresAt || "")}">กำลังคำนวณ…</span></p>
            <div class="action-row">
              <button class="button button-primary" type="button" data-action="download" data-order-id="${escapeHtml(order.id)}">ดาวน์โหลด E-book</button>
              <button class="button button-secondary" type="button" data-action="copy-order" data-order-id="${escapeHtml(order.id)}">คัดลอกเลขคำสั่งซื้อ</button>
            </div>
          </article>
          <aside class="summary-card">
            <h2>รายละเอียดคำสั่งซื้อ</h2>
            ${orderFacts(order, book)}
            <a class="button button-secondary button-block" href="#/track">ไปหน้าติดตามคำสั่งซื้อ</a>
          </aside>
        </section>
      </div>
    `;
  }

  function trackResultMarkup() {
    const order = appState.trackingResult;
    if (!order) {
      return `
        <div class="empty-state tracking-result">
          <div>
            <strong>${appState.trackingMessage ? escapeHtml(appState.trackingMessage) : "กรอกข้อมูลเพื่อดูสถานะ"}</strong>
            <p>ผลลัพธ์จะแสดงเฉพาะเมื่อเลขคำสั่งซื้อและอีเมลตรงกันทั้งสองช่อง</p>
          </div>
        </div>
      `;
    }

    const book = getBook(order.bookSlug);
    return `
      <article class="status-card status-main tracking-result">
        <span class="status-label ${order.status === "PAID" ? "paid" : "pending"}">${escapeHtml(order.status)}</span>
        <div>
          <p class="muted">เลขคำสั่งซื้อ</p>
          <p class="order-number">${escapeHtml(order.id)}</p>
        </div>
        ${book ? orderFacts(order, book) : ""}
        ${
          order.status === "PAID" && order.downloadUrl
            ? `<div class="action-row">
                <button class="button button-primary" type="button" data-action="download" data-order-id="${escapeHtml(order.id)}">ดาวน์โหลด E-book</button>
                <button class="button button-secondary" type="button" data-action="renew-link" data-order-id="${escapeHtml(order.id)}">ขอลิงก์ใหม่</button>
              </div>`
            : order.status === "PAID"
              ? `<button class="button button-primary button-block" type="button" data-action="renew-link" data-order-id="${escapeHtml(order.id)}">ขอลิงก์ดาวน์โหลดใหม่</button>`
              : `<a class="button button-warning button-block" href="#/order/${escapeHtml(order.id)}">ไปหน้า Mock Payment</a>`
        }
      </article>
    `;
  }

  function trackView() {
    setSelectedBook("");
    return `
      <div class="page-shell">
        <header class="page-heading">
          <p class="breadcrumb"><a href="#/store">หน้าร้าน</a><span>/</span><span>ติดตามคำสั่งซื้อ</span></p>
          <h1>ติดตามคำสั่งซื้อ</h1>
          <p class="muted">ใช้เลขคำสั่งซื้อและอีเมลเดียวกับที่ใช้ Checkout</p>
        </header>
        <section class="tracking-layout section-tight">
          <form id="tracking-form" class="track-card form-stack" novalidate>
            <div class="field">
              <label for="tracking-id">เลขคำสั่งซื้อ</label>
              <input id="tracking-id" name="orderId" autocomplete="off" maxlength="32" placeholder="เช่น VIBE-260912-1042" required />
              <p class="field-error" id="tracking-id-error"></p>
            </div>
            <div class="field">
              <label for="tracking-email">อีเมลที่ใช้สั่งซื้อ</label>
              <input id="tracking-email" name="email" type="email" autocomplete="email" maxlength="180" placeholder="name@example.com" required />
              <p class="field-error" id="tracking-email-error"></p>
            </div>
            <button class="button button-primary button-block" type="submit">ตรวจสอบสถานะ</button>
            <p class="privacy-note"><strong>ความเป็นส่วนตัว:</strong> ระบบจะไม่บอกว่าช่องใดถูกหรือผิด และไม่เปิดเผยข้อมูลคำสั่งซื้อเมื่อข้อมูลทั้งสองช่องไม่ตรงกัน</p>
          </form>
          <div id="tracking-result">${trackResultMarkup()}</div>
        </section>
      </div>
    `;
  }

  function guideView() {
    setSelectedBook("");
    const steps = [
      ["เลือก E-book", "เปิดรายละเอียดหนังสือและตรวจราคา ก่อนกดซื้อ E-book"],
      ["กรอก Checkout", "กรอกชื่อและอีเมล แล้วตรวจสรุปรายการก่อนยืนยัน"],
      ["รับเลขคำสั่งซื้อ", "ระบบสร้างเลขคำสั่งซื้อพร้อมสถานะเริ่มต้น PENDING"],
      ["ทดลอง Mock Payment", "กดจำลองชำระเงินสำเร็จในหน้าที่มีป้าย DEMO ONLY"],
      ["รับผล PAID", "ระบบเปลี่ยนสถานะเป็น PAID สร้างลิงก์ส่วนตัว และส่งอีเมลเมื่อเปิดใช้บริการอีเมล"],
      ["ติดตามภายหลัง", "ใช้เลขคำสั่งซื้อและอีเมลร่วมกันเพื่อดูสถานะอย่างเป็นส่วนตัว"],
    ];
    return `
      <div class="page-shell">
        <header class="page-heading">
          <p class="eyebrow">วิธีใช้งาน</p>
          <h1>สั่งซื้อแบบสาธิตใน 6 ขั้นตอน</h1>
          <p class="lead">เว็บไซต์นี้ไม่มีการตัดเงินจริง ทุกขั้นตอนจัดทำเพื่อทดสอบ flow ของระบบ E-book Shop</p>
        </header>
        <section class="section-tight">
          <div class="guide-grid">
            ${steps
              .map(
                ([title, description], index) => `
                  <article class="guide-step">
                    <span>${index + 1}</span>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
          <div class="demo-bar"><strong>DEMO ONLY:</strong> ไม่เชื่อม Payment Gateway ไม่เก็บข้อมูลบัตร และไม่ใช้ QR ธนาคารจริง</div>
        </section>
      </div>
    `;
  }

  function errorView(message) {
    setSelectedBook("");
    return `
      <div class="page-shell">
        <section class="generic-error">
          <h1>ไม่สามารถเปิดหน้านี้ได้</h1>
          <p>${escapeHtml(message)}</p>
          <a class="button button-primary" href="#/store">กลับหน้าร้าน</a>
        </section>
      </div>
    `;
  }

  function routeParts() {
    return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  }

  function render() {
    window.clearInterval(appState.countdownTimer);
    closeMenu();
    const [route = "store", param] = routeParts();
    setActiveNav(route);

    if (route === "store") app.innerHTML = storeView();
    else if (route === "book") {
      const book = getBook(param);
      app.innerHTML = book ? bookView(book) : errorView("ไม่พบ E-book ที่เลือก");
    } else if (route === "checkout") {
      const book = getBook(param);
      app.innerHTML = book ? checkoutView(book) : errorView("ไม่พบ E-book สำหรับ Checkout");
    } else if (route === "order") {
      const order = findOrder(param);
      app.innerHTML = order ? orderView(order) : errorView("ไม่พบคำสั่งซื้อจากเลขที่ระบุ");
    } else if (route === "success") {
      const order = findOrder(param);
      app.innerHTML = order && order.status === "PAID" ? successView(order) : errorView("ไม่พบผลการชำระเงินของคำสั่งซื้อนี้");
    } else if (route === "track") app.innerHTML = trackView();
    else if (route === "guide") app.innerHTML = guideView();
    else app.innerHTML = errorView("เส้นทางนี้ไม่มีอยู่ในระบบ");

    startCountdown();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function validateCheckout(form) {
    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    const nameError = name.length < 2 ? "กรุณากรอกชื่อ-นามสกุลอย่างน้อย 2 ตัวอักษร" : "";
    const emailError = !emailPattern.test(email) ? "กรุณากรอกอีเมลให้ถูกต้อง" : "";

    nameInput.setAttribute("aria-invalid", String(Boolean(nameError)));
    emailInput.setAttribute("aria-invalid", String(Boolean(emailError)));
    document.getElementById("name-error").textContent = nameError;
    document.getElementById("email-error").textContent = emailError;

    if (nameError) {
      nameInput.focus();
      valid = false;
    } else if (emailError) {
      emailInput.focus();
      valid = false;
    }

    return valid ? { name, email } : null;
  }

  async function handleCheckout(form) {
    const values = validateCheckout(form);
    if (!values) return;
    const book = getBook(form.dataset.bookSlug);
    if (!book) {
      showToast("ไม่พบข้อมูลหนังสือ กรุณากลับไปเลือกใหม่");
      return;
    }

    try {
      localStorage.setItem(CUSTOMER_STORE_KEY, JSON.stringify(values));
    } catch {
      // The order write below is the authoritative check.
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "กำลังสร้างคำสั่งซื้อ…";

    try {
      const order = await createOrder(book, values.name, values.email);
      location.hash = `#/order/${order.id}`;
    } catch (error) {
      console.error(error);
      if (submit.isConnected) {
        submit.disabled = false;
        submit.textContent = "ยืนยันคำสั่งซื้อ";
      }
      showToast(error.message || "สร้างคำสั่งซื้อไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }

  async function handleTracking(form) {
    const orderIdInput = form.elements.orderId;
    const emailInput = form.elements.email;
    const orderId = orderIdInput.value.trim().toUpperCase();
    const email = emailInput.value.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const idError = orderId ? "" : "กรุณากรอกเลขคำสั่งซื้อ";
    const emailError = emailPattern.test(email) ? "" : "กรุณากรอกอีเมลให้ถูกต้อง";
    document.getElementById("tracking-id-error").textContent = idError;
    document.getElementById("tracking-email-error").textContent = emailError;
    orderIdInput.setAttribute("aria-invalid", String(Boolean(idError)));
    emailInput.setAttribute("aria-invalid", String(Boolean(emailError)));
    if (idError || emailError) return;

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "กำลังตรวจสอบ…";
    try {
      appState.trackingResult = await trackOrder(orderId, email);
      appState.trackingMessage = "";
    } catch (error) {
      console.error(error);
      appState.trackingResult = null;
      appState.trackingMessage = error.message || "ไม่พบคำสั่งซื้อจากข้อมูลที่ระบุ";
    } finally {
      submit.disabled = false;
      submit.textContent = "ตรวจสอบสถานะ";
      document.getElementById("tracking-result").innerHTML = trackResultMarkup();
    }
  }

  function handleDownload(orderId) {
    const order = findOrder(orderId);
    if (!order || order.status !== "PAID") {
      showToast("ดาวน์โหลดได้หลังสถานะเป็น PAID เท่านั้น");
      return;
    }
    if (!order.downloadUrl || !order.downloadExpiresAt || Date.now() > Date.parse(order.downloadExpiresAt)) {
      showToast("ลิงก์ดาวน์โหลดหมดอายุแล้ว กรุณาขอลิงก์ใหม่จากหน้าติดตามคำสั่งซื้อ");
      return;
    }
    const link = document.createElement("a");
    link.href = order.downloadUrl;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("เริ่มดาวน์โหลด E-book แล้ว");
  }

  function startCountdown() {
    const element = document.getElementById("download-countdown");
    if (!element) return;
    const expiresAt = Date.parse(element.dataset.expires || "");

    const tick = () => {
      const remaining = expiresAt - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) {
        element.textContent = "หมดอายุแล้ว";
        window.clearInterval(appState.countdownTimer);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      element.textContent = `${minutes}:${String(seconds).padStart(2, "0")} นาที`;
    };

    tick();
    appState.countdownTimer = window.setInterval(tick, 1000);
  }

  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context || typeof context.registerTool !== "function") return;

    const register = (tool) => {
      try {
        Promise.resolve(context.registerTool(tool)).catch((error) =>
          console.warn(`WebMCP registration failed: ${tool.name}`, error),
        );
      } catch (error) {
        console.warn(`WebMCP registration failed: ${tool.name}`, error);
      }
    };

    register({
      name: "list_ebooks",
      title: "ดูรายการ E-book",
      description: "แสดง E-book ทั้งหมดที่มีในร้าน VibeShelf พร้อมราคาและคำอธิบายย่อ",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return books.map(({ slug, title, description, price }) => ({ slug, title, description, price }));
      },
    });

    register({
      name: "create_demo_order",
      title: "สร้างคำสั่งซื้อสาธิต",
      description: "สร้างคำสั่งซื้อ E-book แบบสาธิตในสถานะ PENDING และเปิดหน้าคำสั่งซื้อ ไม่มีการรับเงินจริง",
      inputSchema: {
        type: "object",
        properties: {
          bookSlug: { type: "string", enum: books.map((book) => book.slug) },
          name: { type: "string", minLength: 2, maxLength: 120 },
          email: { type: "string", format: "email", maxLength: 180 },
        },
        required: ["bookSlug", "name", "email"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const book = getBook(input?.bookSlug);
        const name = String(input?.name || "").trim();
        const email = String(input?.email || "").trim().toLowerCase();
        if (!book || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("ข้อมูลหนังสือ ชื่อ หรืออีเมลไม่ถูกต้อง");
        }
        const order = await createOrder(book, name, email);
        location.hash = `#/order/${order.id}`;
        return { orderId: order.id, status: order.status, total: order.total, demoOnly: true };
      },
    });

    register({
      name: "track_demo_order",
      title: "ติดตามคำสั่งซื้อสาธิต",
      description: "ตรวจสถานะคำสั่งซื้อเมื่อเลขคำสั่งซื้อและอีเมลตรงกันทั้งสองส่วน",
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string", minLength: 1, maxLength: 32 },
          email: { type: "string", format: "email", maxLength: 180 },
        },
        required: ["orderId", "email"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      async execute(input) {
        const orderId = String(input?.orderId || "").trim().toUpperCase();
        const email = String(input?.email || "").trim().toLowerCase();
        const order = await trackOrder(orderId, email);
        return {
          orderId: order.id,
          status: order.status,
          bookSlug: order.bookSlug,
          total: order.total,
          createdAt: order.createdAt,
          downloadAvailable:
            order.status === "PAID" &&
            Boolean(order.downloadExpiresAt) &&
            Date.now() < Date.parse(order.downloadExpiresAt),
        };
      },
    });
  }

  document.addEventListener("submit", (event) => {
    if (event.target.id === "checkout-form") {
      event.preventDefault();
      handleCheckout(event.target);
    } else if (event.target.id === "tracking-form") {
      event.preventDefault();
      handleTracking(event.target);
    }
  });

  document.addEventListener("click", async (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    const action = control.dataset.action;

    if (action === "toggle-menu") {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    } else if (action === "mock-pay") {
      control.disabled = true;
      control.textContent = "กำลังอัปเดตสถานะ…";
      try {
        const order = await payOrder(control.dataset.orderId);
        location.hash = `#/success/${order.id}`;
      } catch (error) {
        console.error(error);
        if (control.isConnected) {
          control.disabled = false;
          control.textContent = "จำลองชำระเงินสำเร็จ";
        }
        showToast(error.message || "อัปเดตสถานะไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    } else if (action === "copy-order") {
      try {
        await navigator.clipboard.writeText(control.dataset.orderId);
        showToast("คัดลอกเลขคำสั่งซื้อแล้ว");
      } catch {
        showToast(`เลขคำสั่งซื้อ: ${control.dataset.orderId}`);
      }
    } else if (action === "download") {
      handleDownload(control.dataset.orderId);
    } else if (action === "renew-link") {
      control.disabled = true;
      try {
        const order = await renewDownload(control.dataset.orderId);
        appState.trackingResult = order;
        document.getElementById("tracking-result").innerHTML = trackResultMarkup();
        showToast(order.emailStatus === "SENT" ? "สร้างลิงก์ใหม่และส่งอีเมลแล้ว" : "สร้างลิงก์ดาวน์โหลดใหม่แล้ว");
      } catch (error) {
        console.error(error);
        showToast("สร้างลิงก์ใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง");
      } finally {
        if (control.isConnected) control.disabled = false;
      }
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", () => {
    registerWebMcpTools();
    if (window.VibeShelfDB?.isConfigured()) {
      window.VibeShelfDB
        .healthCheck()
        .then(() => console.info("VibeShelf connected to Supabase"))
        .catch((error) => console.warn("VibeShelf Supabase connection failed", error));
    }
    if (!location.hash) location.hash = "#/store";
    else render();
  });
})();
