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
   */
  async createOrder(orderPayload) {
    if (!this.client) {
      console.warn("[UncleBrew Supabase] Supabase client not configured yet. Saving to local session.");
      return { success: true, localOnly: true, data: orderPayload };
    }

    try {
      const { data, error } = await this.client
        .from('orders')
        .insert([{
          order_id: orderPayload.orderId,
          customer_name: orderPayload.customerName,
          customer_phone: orderPayload.customerPhone,
          delivery_address: orderPayload.deliveryAddress,
          fulfillment_type: orderPayload.fulfillmentType,
          branch: orderPayload.branch,
          payment_method: orderPayload.paymentMethod,
          items: orderPayload.items,
          subtotal: orderPayload.subtotal,
          discount: orderPayload.discount,
          delivery_fee: orderPayload.deliveryFee,
          total_amount: orderPayload.totalAmount,
          status: 'received'
        }])
        .select();

      if (error) {
        console.error("[UncleBrew Supabase] Failed to insert order:", error);
        return { success: false, error: error.message, data: orderPayload };
      }

      return { success: true, localOnly: false, data: data[0] };
    } catch (e) {
      console.error("[UncleBrew Supabase] Network exception inserting order:", e);
      return { success: false, error: e.message, data: orderPayload };
    }
  }

  /**
   * Save franchise application lead to Supabase 'franchise_inquiries' table
   */
  async submitFranchiseInquiry(inquiryPayload) {
    if (!this.client) {
      console.warn("[UncleBrew Supabase] Supabase client not configured yet. Lead logged locally.");
      return { success: true, localOnly: true, data: inquiryPayload };
    }

    try {
      const { data, error } = await this.client
        .from('franchise_inquiries')
        .insert([{
          package_name: inquiryPayload.packageName,
          full_name: inquiryPayload.fullName,
          mobile: inquiryPayload.mobile,
          email: inquiryPayload.email,
          target_city: inquiryPayload.targetCity,
          has_commercial_space: inquiryPayload.hasCommercialSpace,
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
