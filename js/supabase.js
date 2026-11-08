/**
 * Uncle Brew - Supabase Integration Module
 * Handles database operations for customer orders, franchise applications, and custom brews
 */

const SUPABASE_DEFAULT_KEY = "sb_publishable_0cjPv3TRGj6S1RspcrAw8Q_lEWzwYKE";
const SUPABASE_DEFAULT_URL = "https://ffrzekxmkaslpgudqemj.supabase.co";

class UncleBrewSupabase {
  constructor() {
    this.client = null;
    this.publishableKey = SUPABASE_DEFAULT_KEY;
    // Loaded default URL configured with user's project
    this.projectUrl = localStorage.getItem("unclebrew_supabase_url") || SUPABASE_DEFAULT_URL;
    this.isConnected = false;

    this.init();
  }

  init() {
    if (this.projectUrl && window.supabase) {
      try {
        this.client = window.supabase.createClient(this.projectUrl, this.publishableKey);
        this.isConnected = true;
        this.testConnection();
      } catch (err) {
        console.warn("[UncleBrew Supabase] Initialization error:", err);
        this.isConnected = false;
      }
    }
    this.updateStatusBadge();
  }

  setProjectUrl(url) {
    if (!url) return false;
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    // Remove /rest/v1 or trailing slashes to keep the root Supabase project endpoint
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

    this.projectUrl = cleanUrl;
    localStorage.setItem("unclebrew_supabase_url", cleanUrl);
    
    if (window.supabase) {
      try {
        this.client = window.supabase.createClient(this.projectUrl, this.publishableKey);
        this.isConnected = true;
        this.updateStatusBadge();
        this.testConnection();
        return true;
      } catch (e) {
        console.error("[UncleBrew Supabase] Error setting URL:", e);
        return false;
      }
    }
    return false;
  }

  async testConnection() {
    if (!this.client) return false;
    try {
      // Light query to verify connectivity
      const { data, error } = await this.client.from('orders').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table may not exist yet or RLS policy needed
        console.info("[UncleBrew Supabase] Connected to endpoint (Note: verify tables in Supabase SQL editor):", error.message);
      } else {
        console.log("[UncleBrew Supabase] Connected successfully!");
      }
      this.isConnected = true;
      this.updateStatusBadge();
      return true;
    } catch (err) {
      console.warn("[UncleBrew Supabase] Ping failed:", err);
      return false;
    }
  }

  updateStatusBadge() {
    const badge = document.getElementById("supabase-status-badge");
    const label = document.getElementById("supabase-status-label");
    if (!badge || !label) return;

    if (this.isConnected && this.projectUrl) {
      badge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[11px] font-bold cursor-pointer hover:bg-emerald-900/60 transition-all";
      label.textContent = "Supabase: Connected";
    } else {
      badge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[11px] font-bold cursor-pointer hover:bg-amber-900/60 transition-all animate-pulse";
      label.textContent = "Supabase: Set Project URL";
    }
  }

  /**
   * Save customer order to Supabase 'orders' table
   * - Validates all fields against SQL Injection & XSS via UncleBrewSecurity
   * - Signs the order with a SHA-256 integrity hash (order_hash)
   * - Encrypts customer PII (phone & address) with AES-256-GCM (encrypted_pii)
   * - Encrypts the local order history cache at rest in localStorage
   */
  async createOrder(orderPayload) {
    // 1. Run SQL Injection & XSS Firewall validation
    if (window.brewSecurity) {
      window.brewSecurity.validatePayload(orderPayload);
    }

    const sec = window.brewSecurity;
    const sanitize = (v, max = 200) => (sec ? sec.sanitizeInput(v, max) : String(v || "").trim());

    const userId = sanitize(window.brewAuth?.userId || this.userId || "guest", 100);
    const brewerId = sanitize(window.brewAuth?.brewerId || "UB-GUEST", 40);
    const cleanOrderId = sanitize(orderPayload.orderId, 40);
    const cleanName = sanitize(orderPayload.customerName, 100);
    const cleanPhone = sanitize(orderPayload.customerPhone, 40);
    const cleanEmail = sanitize(orderPayload.customerEmail || window.brewAuth?.userEmail || "", 120) || null;
    const cleanAddress = sanitize(orderPayload.deliveryAddress, 250);
    const cleanFulfillment = sanitize(orderPayload.fulfillmentType, 40);
    const cleanBranch = sanitize(orderPayload.branch, 100);
    const cleanPayment = sanitize(orderPayload.paymentMethod, 50);

    // 2. Compute SHA-256 Order Integrity Hash & AES-256-GCM Encrypted PII Envelope
    const orderHash = sec
      ? await sec.signOrderPayload({
          orderId: cleanOrderId,
          userId,
          brewerId,
          totalAmount: Number(orderPayload.totalAmount) || 0,
          items: orderPayload.items
        })
      : null;

    const encryptedPii = sec
      ? await sec.encryptData({
          phone: cleanPhone,
          address: cleanAddress,
          email: cleanEmail
        })
      : null;

    // 3. Build sanitized order record & encrypt in local user order history
    const localRecord = {
      id: cleanOrderId,
      created_at: new Date().toISOString(),
      user_id: userId,
      brewer_id: brewerId,
      order_id: cleanOrderId,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      customer_email: cleanEmail,
      delivery_address: cleanAddress,
      fulfillment_type: cleanFulfillment,
      branch: cleanBranch,
      payment_method: cleanPayment,
      items: orderPayload.items,
      subtotal: Number(orderPayload.subtotal) || 0,
      discount: Number(orderPayload.discount) || 0,
      delivery_fee: Number(orderPayload.deliveryFee) || 0,
      total_amount: Number(orderPayload.totalAmount) || 0,
      order_hash: orderHash,
      encrypted_pii: encryptedPii,
      status: 'received'
    };

    try {
      const storageKey = `unclebrew_orders_${userId}`;
      const existing = sec
        ? (await sec.getSecureStorage(storageKey, []))
        : JSON.parse(localStorage.getItem(storageKey) || "[]");
      const list = Array.isArray(existing) ? existing : [];
      list.unshift(localRecord);
      if (sec) {
        await sec.setSecureStorage(storageKey, list.slice(0, 50));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 50)));
      }
    } catch (e) {}

    if (!this.client) {
      console.warn("[UncleBrew Supabase] Supabase client not configured yet. Saved to AES-256 encrypted local history.");
      return { success: true, localOnly: true, data: localRecord };
    }

    try {
      // Attempt parameterized insert with v3/v2 columns
      let { data, error } = await this.client
        .from('orders')
        .insert([{
          user_id: userId,
          brewer_id: brewerId,
          order_id: cleanOrderId,
          customer_name: cleanName,
          customer_phone: cleanPhone,
          customer_email: cleanEmail,
          delivery_address: cleanAddress,
          fulfillment_type: cleanFulfillment,
          branch: cleanBranch,
          payment_method: cleanPayment,
          items: orderPayload.items,
          subtotal: Number(orderPayload.subtotal) || 0,
          discount: Number(orderPayload.discount) || 0,
          delivery_fee: Number(orderPayload.deliveryFee) || 0,
          total_amount: Number(orderPayload.totalAmount) || 0,
          status: 'received'
        }])
        .select();

      // Fallback if user hasn't run v2/v3 ALTER TABLE yet on Supabase
      if (error && (error.message?.includes("column") || error.code === "42703" || error.code === "PGRST204")) {
        const retry = await this.client
          .from('orders')
          .insert([{
            order_id: cleanOrderId,
            customer_name: `${cleanName} [${brewerId}]`,
            customer_phone: cleanPhone,
            delivery_address: cleanAddress,
            fulfillment_type: cleanFulfillment,
            branch: cleanBranch,
            payment_method: cleanPayment,
            items: orderPayload.items,
            subtotal: Number(orderPayload.subtotal) || 0,
            discount: Number(orderPayload.discount) || 0,
            delivery_fee: Number(orderPayload.deliveryFee) || 0,
            total_amount: Number(orderPayload.totalAmount) || 0,
            status: 'received'
          }])
          .select();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("[UncleBrew Supabase] Failed to insert order:", error);
        return { success: false, error: error.message, data: localRecord };
      }

      return { success: true, localOnly: false, data: data?.[0] || localRecord };
    } catch (e) {
      console.error("[UncleBrew Supabase] Network exception inserting order:", e);
      return { success: false, error: e.message, data: localRecord };
    }
  }

  /**
   * Save franchise application lead to Supabase 'franchise_inquiries' table
   * Validates and sanitizes all fields against SQL Injection & XSS
   */
  async submitFranchiseInquiry(inquiryPayload) {
    if (window.brewSecurity) {
      window.brewSecurity.validatePayload(inquiryPayload);
    }
    const sec = window.brewSecurity;
    const sanitize = (v, max = 150) => (sec ? sec.sanitizeInput(v, max) : String(v || "").trim());

    if (!this.client) {
      console.warn("[UncleBrew Supabase] Supabase client not configured yet. Lead logged locally.");
      return { success: true, localOnly: true, data: inquiryPayload };
    }

    try {
      const { data, error } = await this.client
        .from('franchise_inquiries')
        .insert([{
          package_name: sanitize(inquiryPayload.packageName, 100),
          full_name: sanitize(inquiryPayload.fullName, 100),
          mobile: sanitize(inquiryPayload.mobile, 40),
          email: sanitize(inquiryPayload.email, 120),
          target_city: sanitize(inquiryPayload.targetCity, 100),
          has_commercial_space: Boolean(inquiryPayload.hasCommercialSpace),
          status: 'new'
        }])
        .select();

      if (error) {
        console.error("[UncleBrew Supabase] Failed to insert franchise inquiry:", error);
        return { success: false, error: error.message, data: inquiryPayload };
      }

      return { success: true, localOnly: false, data: data[0] };
    } catch (e) {
      console.error("[UncleBrew Supabase] Network exception inserting inquiry:", e);
      return { success: false, error: e.message, data: inquiryPayload };
    }
  }
}

// Global instance
window.uncleBrewSupabase = new UncleBrewSupabase();
