/**
 * Uncle Brew — Auth Guard, Unique Brewer Identity & Order History Module
 *
 * Responsibilities:
 *  1. Check Supabase session OR local verified Brewer session -> redirect to landing.html if unauthenticated
 *  2. Generate & persist a unique Brewer ID (e.g. UB-482910) for every user
 *  3. Render User Profile Chip & Dropdown in the navigation bar
 *  4. Provide "My Order History" modal connected to Supabase + local cache with 1-click Re-Order
 *  5. Auto-populate user identity into Checkout & Loyalty Stamps
 */

const _AUTH_URL = "https://ffrzekxmkaslpgudqemj.supabase.co";
const _AUTH_KEY = "sb_publishable_0cjPv3TRGj6S1RspcrAw8Q_lEWzwYKE";

class BrewAuth {
  constructor() {
    this.client = null;
    this.user = null;
    this.session = null;
    this._resolved = false;
    this._readyCallbacks = [];
  }

  // Generate a deterministic 6-digit Brewer ID from user ID or email
  static generateBrewerId(seedStr = "") {
    let hash = 0;
    const str = String(seedStr || Date.now());
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const num = (Math.abs(hash) % 900000) + 100000;
    return `UB-${num}`;
  }

  async init() {
    try {
      await this._waitForSupabaseSDK();
      // Reuse the existing Supabase client from window.uncleBrewSupabase to avoid duplicate GoTrueClient instances
      this.client = window.uncleBrewSupabase?.client || window.supabase.createClient(_AUTH_URL, _AUTH_KEY);
    } catch (e) {
      console.warn("[BrewAuth] Proceeding with local session support:", e);
    }

    // 1. Try restoring Supabase Auth session
    let sessionUser = null;
    if (this.client) {
      try {
        const { data: { session } } = await this.client.auth.getSession();
        if (session?.user) {
          this.session = session;
          sessionUser = session.user;
        }
      } catch (err) {
        console.warn("[BrewAuth] getSession warning:", err);
      }
    }

    // 2. Fallback to local Brewer session (for instant signup / offline / unconfirmed email)
    if (!sessionUser) {
      try {
        const raw = localStorage.getItem("unclebrew_user_session");
        if (raw) {
          sessionUser = JSON.parse(raw);
        }
      } catch (e) {}
    }

    // 3. If still no user session -> redirect to landing.html
    if (!sessionUser) {
      this._redirectToLanding();
      return;
    }

    this._setUser(sessionUser);

    // 4. Listen for Supabase auth state changes
    if (this.client) {
      this.client.auth.onAuthStateChange((event, newSession) => {
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("unclebrew_user_session");
          this._redirectToLanding();
          return;
        }
        if (newSession?.user) {
          this.session = newSession;
          this._setUser(newSession.user);
        }
      });
    }

    this._resolved = true;
    this._readyCallbacks.forEach(cb => cb(this.user));
  }

  _setUser(u) {
    const brewerId = u.brewer_id
      || u.user_metadata?.brewer_id
      || BrewAuth.generateBrewerId(u.id || u.email);

    this.user = {
      ...u,
      brewer_id: brewerId
    };

    // Persist session locally so reloads and unconfirmed email signups stay seamless
    try {
      localStorage.setItem("unclebrew_user_session", JSON.stringify({
        id: this.user.id,
        email: this.user.email,
        brewer_id: brewerId,
        user_metadata: {
          full_name: this.displayName,
          display_name: this.displayName,
          brewer_id: brewerId
        }
      }));
    } catch (e) {}

    if (window.uncleBrewSupabase) {
      window.uncleBrewSupabase.userId = this.user.id;
    }

    this._renderUserBadge();
    this._syncCheckoutFields();
  }

  onReady(cb) {
    if (this._resolved) { cb(this.user); return; }
    this._readyCallbacks.push(cb);
  }

  _waitForSupabaseSDK(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (window.supabase) { resolve(); return; }
      const start = Date.now();
      const poll = setInterval(() => {
        if (window.supabase) { clearInterval(poll); resolve(); return; }
        if (Date.now() - start > timeout) {
          clearInterval(poll);
          reject(new Error("Supabase SDK timeout"));
        }
      }, 60);
    });
  }

  _redirectToLanding() {
    if (!window.location.pathname.includes("landing.html")) {
      window.location.href = "landing.html";
    }
  }

  _syncCheckoutFields() {
    const nameInput = document.getElementById("checkout-name");
    const emailInput = document.getElementById("checkout-email");
    if (nameInput && !nameInput.value) nameInput.value = this.displayName;
    if (emailInput && !emailInput.value) emailInput.value = this.userEmail || "";

    const welcomeName = document.getElementById("welcome-member-name");
    const welcomeId = document.getElementById("welcome-member-id");
    if (welcomeName) welcomeName.textContent = `Welcome back, ${this.displayName}!`;
    if (welcomeId) welcomeId.textContent = this.brewerId;
  }

  // ── Render the User Avatar Chip & Unique Brewer ID in Nav Bar ─────────────
  _renderUserBadge() {
    if (!this.user) return;
    const container = document.getElementById("nav-user-chip");
    if (!container) return;

    const name = this.displayName;
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "UB";
    const email = this.user.email || "";
    const brewerId = this.brewerId;

    container.innerHTML = `
      <div class="relative">
        <button
          id="btn-user-menu"
          type="button"
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E8DDCE] hover:border-[#C2782A] transition-all shadow-sm text-xs font-semibold text-[#24140B]"
          aria-label="User account menu"
        >
          <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#C2782A] to-[#2B160A] flex items-center justify-center text-white text-[11px] font-black shadow">
            ${initials}
          </span>
          <div class="hidden sm:flex flex-col items-start leading-tight">
            <span class="max-w-[95px] truncate font-bold text-[#24140B] text-[11px]">${name}</span>
            <span class="text-[9px] font-mono font-extrabold text-[#C2782A]">${brewerId}</span>
          </div>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-[#8E7A6E]"></i>
        </button>

        <!-- Dropdown Menu -->
        <div
          id="user-dropdown"
          class="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#E8DDCE] shadow-2xl shadow-[#24140B]/15 py-2 hidden z-50"
        >
          <div class="px-4 py-3 border-b border-[#E8DDCE] bg-[#FAF7F2]/60">
            <div class="flex items-center justify-between gap-2 mb-1">
              <p class="text-xs font-black text-[#24140B] truncate">${name}</p>
              <span class="px-2 py-0.5 rounded-md bg-[#24140B] text-[#C2782A] font-mono text-[10px] font-bold">${brewerId}</span>
            </div>
            <p class="text-[11px] text-[#8E7A6E] truncate">${email}</p>
            <p class="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Orders linked to your ID
            </p>
          </div>

          <button
            id="btn-view-orders"
            type="button"
            class="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#4F2E1E] hover:bg-[#FAF7F2] hover:text-[#C2782A] transition-colors"
          >
            <span class="flex items-center gap-2.5">
              <i data-lucide="package" class="w-4 h-4 text-[#C2782A]"></i>
              My Connected Orders
            </span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-[#8E7A6E]"></i>
          </button>

          <a href="#menu" class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#4F2E1E] hover:bg-[#FAF7F2] hover:text-[#C2782A] transition-colors">
            <i data-lucide="coffee" class="w-4 h-4 text-[#C2782A]"></i>
            Available Products
          </a>

          <a href="#brew-studio" class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#4F2E1E] hover:bg-[#FAF7F2] hover:text-[#C2782A] transition-colors">
            <i data-lucide="sparkles" class="w-4 h-4 text-[#C2782A]"></i>
            Brew Studio
          </a>

          <a href="landing.html?preview=1" class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#4F2E1E] hover:bg-[#FAF7F2] hover:text-[#C2782A] transition-colors">
            <i data-lucide="home" class="w-4 h-4 text-[#C2782A]"></i>
            View Landing Page
          </a>

          <div class="border-t border-[#E8DDCE] mt-1.5 pt-1.5">
            <button
              id="btn-sign-out"
              type="button"
              class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <i data-lucide="log-out" class="w-4 h-4"></i>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    `;

    const btn = document.getElementById("btn-user-menu");
    const dropdown = document.getElementById("user-dropdown");

    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle("hidden");
    });

    document.addEventListener("click", () => dropdown?.classList.add("hidden"));

    document.getElementById("btn-sign-out")?.addEventListener("click", async () => {
      localStorage.removeItem("unclebrew_user_session");
      if (this.client) {
        try { await this.client.auth.signOut(); } catch (e) {}
      }
      window.location.href = "landing.html";
    });

    document.getElementById("btn-view-orders")?.addEventListener("click", () => {
      dropdown?.classList.add("hidden");
      this.openOrderHistoryModal();
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // ── Order History Modal (Connected to User's Unique ID) ──────────────────
  async openOrderHistoryModal() {
    let modal = document.getElementById("order-history-modal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "order-history-modal";
    modal.className = "fixed inset-0 z-[999] flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="absolute inset-0 bg-[#24140B]/50 backdrop-blur-sm" id="ohm-backdrop"></div>
      <div class="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E8DDCE] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-[#E8DDCE] bg-[#FAF7F2]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C2782A] to-[#2B160A] flex items-center justify-center">
              <i data-lucide="package" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-black text-[#24140B]">My Connected Orders</h3>
                <span class="px-2 py-0.5 rounded-md bg-[#24140B] text-[#C2782A] font-mono text-[10px] font-bold">${this.brewerId}</span>
              </div>
              <p class="text-[11px] text-[#8E7A6E]">Synced with your account (${this.userEmail || this.displayName})</p>
            </div>
          </div>
          <button id="btn-close-ohm" class="p-2 rounded-xl border border-[#E8DDCE] bg-white text-[#8E7A6E] hover:text-[#24140B] hover:border-[#C2782A] transition-all">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div id="ohm-body" class="flex-1 overflow-y-auto p-6 space-y-4">
          <div class="text-center py-12">
            <div class="inline-block w-8 h-8 border-2 border-[#E8DDCE] border-t-[#C2782A] rounded-full animate-spin"></div>
            <p class="text-xs text-[#8E7A6E] mt-3">Fetching orders linked to ${this.brewerId}...</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("ohm-backdrop")?.addEventListener("click", () => modal.remove());
    document.getElementById("btn-close-ohm")?.addEventListener("click", () => modal.remove());
    if (window.lucide) window.lucide.createIcons();

    // 1. Load local cached orders for this user
    let localOrders = [];
    try {
      const storageKey = `unclebrew_orders_${this.userId}`;
      localOrders = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (e) {}

    // 2. Query Supabase for orders matching this user_id or brewerId
    let remoteOrders = [];
    const supaClient = window.uncleBrewSupabase?.client || this.client;
    if (supaClient) {
      try {
        const { data, error } = await supaClient
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);

        if (!error && Array.isArray(data)) {
          remoteOrders = data.filter(row =>
            row.user_id === this.userId ||
            row.brewer_id === this.brewerId ||
            (row.customer_email && row.customer_email === this.userEmail) ||
            (row.customer_name && row.customer_name.includes(this.brewerId))
          );
        }
      } catch (e) {
        console.warn("[BrewAuth] Order fetch fallback to local cache:", e);
      }
    }

    // Merge and deduplicate by order_id
    const seen = new Set();
    const merged = [];
    [...remoteOrders, ...localOrders].forEach(o => {
      const key = o.order_id || o.id;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(o);
      }
    });

    const body = document.getElementById("ohm-body");
    if (!body) return;

    if (merged.length === 0) {
      body.innerHTML = `
        <div class="text-center py-14">
          <span class="text-5xl block mb-4">☕</span>
          <h4 class="text-sm font-bold text-[#24140B] mb-1">No orders linked to ${this.brewerId} yet!</h4>
          <p class="text-xs text-[#634F44] max-w-sm mx-auto">When you place an order at checkout, it is automatically tagged with your Brewer ID and saved here.</p>
          <button onclick="document.getElementById('order-history-modal').remove(); document.querySelector('#menu').scrollIntoView({behavior:'smooth'});"
            class="mt-6 px-6 py-2.5 rounded-xl bg-[#24140B] text-white text-xs font-bold hover:bg-[#3D2214] transition-all">
            Browse Menu & Order Now
          </button>
        </div>
      `;
      return;
    }

    const statusColors = {
      received: "bg-blue-50 text-blue-700 border-blue-200",
      preparing: "bg-amber-50 text-amber-700 border-amber-200",
      ready: "bg-purple-50 text-purple-700 border-purple-200",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-200"
    };

    body.innerHTML = merged.map((order, idx) => {
      const date = new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
      const time = new Date(order.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
      const items = Array.isArray(order.items) ? order.items : (typeof order.items === "string" ? JSON.parse(order.items || "[]") : []);
      const statusClass = statusColors[order.status] || "bg-emerald-50 text-emerald-700 border-emerald-200";

      return `
        <div class="p-4 rounded-2xl border border-[#E8DDCE] bg-[#FAF7F2] hover:border-[#C2782A] transition-all">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-xs font-mono font-bold text-[#C2782A]">#${order.order_id || String(order.id).slice(0, 8).toUpperCase()}</p>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E8DDCE] text-[#634F44]">${this.brewerId}</span>
              </div>
              <p class="text-[11px] text-[#8E7A6E] mt-0.5">${date} • ${time} • ${order.branch || "Cebu IT Park"}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${statusClass}">${order.status || "received"}</span>
          </div>
          <div class="space-y-1.5 mb-3 bg-white p-3 rounded-xl border border-[#E8DDCE]/70">
            ${items.map(item => `
              <div class="flex items-center justify-between text-xs">
                <span class="text-[#24140B] font-semibold">${item.qty || 1}× ${item.name}</span>
                <span class="text-[#C2782A] font-bold">₱${(item.price || 89) * (item.qty || 1)}</span>
              </div>
            `).join("")}
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-[#E8DDCE]">
            <span class="text-[11px] text-[#634F44] uppercase font-semibold">${order.fulfillment_type || "delivery"} • ${order.payment_method || "GCash"}</span>
            <div class="flex items-center gap-3">
              <span class="text-sm font-black text-[#24140B]">Total: ₱${order.total_amount}</span>
              <button
                type="button"
                data-reorder-idx="${idx}"
                class="btn-reorder px-3 py-1.5 rounded-xl bg-[#24140B] hover:bg-[#3D2214] text-white text-[11px] font-bold transition-all"
              >
                Re-order
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Bind 1-click Re-order buttons
    body.querySelectorAll(".btn-reorder").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.reorderIdx, 10);
        const order = merged[idx];
        if (!order || !window.brewCart) return;
        const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");
        items.forEach(item => {
          window.brewCart.addItem(item, item.qty || 1, item.customDetails || null);
        });
        modal.remove();
        window.brewCart.openDrawer();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  get userId() { return this.user?.id || null; }
  get brewerId() { return this.user?.brewer_id || "UB-100039"; }
  get userEmail() { return this.user?.email || null; }
  get displayName() {
    return this.user?.user_metadata?.full_name
      || this.user?.user_metadata?.display_name
      || this.user?.email?.split("@")[0]
      || "Brewer";
  }
}

const brewAuth = new BrewAuth();
window.brewAuth = brewAuth;

document.addEventListener("DOMContentLoaded", () => {
  brewAuth.init().catch(err => {
    console.error("[BrewAuth] Init failed:", err);
  });
});
