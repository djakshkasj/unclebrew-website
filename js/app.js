/**
 * Uncle Brew - Main Application Logic
 * Integrates Menu, Cart, Modals, Checkout, Live Tracker, Leaflet Store Locator, and Loyalty Club
 */

class BrewCart {
  constructor() {
    this.items = this.loadCart();
    this.activeVoucher = null;
    this.orderType = "delivery"; // delivery, pickup, dinein
    this.deliveryFee = 49;
  }

  loadCart() {
    try {
      const data = localStorage.getItem("unclebrew_cart");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem("unclebrew_cart", JSON.stringify(this.items));
    } catch (e) {}
    this.renderCartUI();
  }

  addItem(product, qty = 1, customDetails = null) {
    const existingIndex = this.items.findIndex(i => 
      i.id === product.id && 
      JSON.stringify(i.customDetails) === JSON.stringify(customDetails)
    );

    if (existingIndex > -1) {
      this.items[existingIndex].qty += qty;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty,
        customDetails: customDetails
      });
    }

    this.saveCart();
    this.openDrawer();
  }

  updateQty(index, delta) {
    if (!this.items[index]) return;
    this.items[index].qty += delta;
    if (this.items[index].qty <= 0) {
      this.items.splice(index, 1);
    }
    this.saveCart();
    if (window.cafeAudio) window.cafeAudio.playChime('pop');
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.saveCart();
    if (window.cafeAudio) window.cafeAudio.playChime('pop');
  }

  clear() {
    this.items = [];
    this.activeVoucher = null;
    this.saveCart();
  }

  applyVoucher(code) {
    const cleanCode = (code || "").toUpperCase().trim();
    const voucher = UNCLE_BREW_DATA.promoVouchers[cleanCode];
    if (!voucher) {
      return { success: false, message: "Invalid voucher code." };
    }

    const subtotal = this.getSubtotal();
    if (voucher.minSpend && subtotal < voucher.minSpend) {
      return { success: false, message: `Minimum spend of ₱${voucher.minSpend} required.` };
    }

    this.activeVoucher = { code: cleanCode, ...voucher };
    this.renderCartUI();
    return { success: true, message: `Voucher "${cleanCode}" applied! ${voucher.description}` };
  }

  getSubtotal() {
    return this.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }

  getTotals() {
    const subtotal = this.getSubtotal();
    let discount = 0;
    let actualDeliveryFee = this.orderType === "delivery" ? this.deliveryFee : 0;

    if (this.activeVoucher) {
      if (this.activeVoucher.discountType === "fixed") {
        discount = this.activeVoucher.amount;
      } else if (this.activeVoucher.discountType === "percentage") {
        discount = (subtotal * this.activeVoucher.percentage) / 100;
      } else if (this.activeVoucher.discountType === "delivery") {
        discount = actualDeliveryFee;
      }
    }

    discount = Math.min(discount, subtotal + actualDeliveryFee);
    const total = Math.max(0, subtotal + actualDeliveryFee - discount);

    return {
      subtotal,
      deliveryFee: actualDeliveryFee,
      discount,
      total,
      itemCount: this.items.reduce((acc, i) => acc + i.qty, 0)
    };
  }

  openDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer) drawer.classList.remove("translate-x-full");
    if (overlay) overlay.classList.remove("hidden");
  }

  closeDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer) drawer.classList.add("translate-x-full");
    if (overlay) overlay.classList.add("hidden");
  }

  renderCartUI() {
    const totals = this.getTotals();

    // Badges
    const badgeEls = document.querySelectorAll(".cart-count-badge");
    badgeEls.forEach(b => {
      b.textContent = totals.itemCount;
      b.classList.toggle("hidden", totals.itemCount === 0);
    });

    // Item List
    const listEl = document.getElementById("cart-items-list");
    const emptyEl = document.getElementById("cart-empty-state");
    const footerEl = document.getElementById("cart-footer");

    if (totals.itemCount === 0) {
      if (listEl) listEl.innerHTML = "";
      if (emptyEl) emptyEl.classList.remove("hidden");
      if (footerEl) footerEl.classList.add("hidden");
      return;
    }

    if (emptyEl) emptyEl.classList.add("hidden");
    if (footerEl) footerEl.classList.remove("hidden");

    if (listEl) {
      listEl.innerHTML = this.items.map((item, idx) => `
        <div class="flex gap-4 p-4 rounded-2xl bg-white border border-[#E8DDCE] hover:border-[#C2782A] transition-all shadow-sm">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover border border-[#E8DDCE] flex-shrink-0">
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 class="text-sm font-bold text-[#2B160A] truncate">${item.name}</h4>
              <button onclick="window.brewCart.removeItem(${idx})" class="text-[#8E7A6E] hover:text-red-500 p-1 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
            ${item.customDetails ? `
              <div class="text-[11px] text-[#A35B1B] mt-1 leading-snug">
                <span>${item.customDetails.size || ''}</span>
                ${item.customDetails.sweetness ? ` • ${item.customDetails.sweetness} Sugar` : ''}
                ${item.customDetails.ice ? ` • ${item.customDetails.ice}` : ''}
                ${item.customDetails.toppings && item.customDetails.toppings.length ? ` • +${item.customDetails.toppings.join(', ')}` : ''}
              </div>
            ` : ''}
            <div class="flex items-center justify-between mt-3">
              <span class="text-sm font-extrabold text-[#C2782A]">₱${item.price * item.qty}</span>
              <div class="flex items-center gap-2 bg-[#FAF7F2] rounded-lg p-1 border border-[#E8DDCE]">
                <button onclick="window.brewCart.updateQty(${idx}, -1)" class="w-6 h-6 rounded flex items-center justify-center text-[#5E2F10] hover:bg-white font-bold transition-colors">-</button>
                <span class="text-xs font-bold text-[#2B160A] px-1">${item.qty}</span>
                <button onclick="window.brewCart.updateQty(${idx}, 1)" class="w-6 h-6 rounded flex items-center justify-center text-[#5E2F10] hover:bg-white font-bold transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>
      `).join("");
    }

    // Totals display
    const subtotalEl = document.getElementById("cart-subtotal");
    const deliveryEl = document.getElementById("cart-delivery-fee");
    const discountEl = document.getElementById("cart-discount");
    const discountRow = document.getElementById("cart-discount-row");
    const totalEl = document.getElementById("cart-grand-total");

    if (subtotalEl) subtotalEl.textContent = `₱${totals.subtotal}`;
    if (deliveryEl) deliveryEl.textContent = totals.deliveryFee > 0 ? `₱${totals.deliveryFee}` : "FREE";
    if (discountRow) discountRow.classList.toggle("hidden", totals.discount === 0);
    if (discountEl) discountEl.textContent = `-₱${totals.discount}`;
    if (totalEl) totalEl.textContent = `₱${totals.total}`;

    if (window.lucide) window.lucide.createIcons();
  }
}

// Global Application Controller
class UncleBrewApp {
  constructor() {
    this.cart = new BrewCart();
    window.brewCart = this.cart;
    this.activeCategory = "all";
    this.searchQuery = "";
    this.activeFilterTag = "all";
    this.selectedStore = UNCLE_BREW_DATA.branches[0];
    this.map = null;
    this.loyaltyStamps = parseInt(localStorage.getItem("unclebrew_stamps") || "4", 10);

    this.init();
  }

  init() {
    this.renderCategoryPills();
    this.renderMenuItems();
    this.renderLoyaltyClub();
    this.bindGlobalEvents();
    this.initStoreLocatorMap();
    this.initTheme();

    this.cart.renderCartUI();
  }

  initTheme() {
    // Default theme is the warm artisanal coffee palette with clean white space
  }

  toggleTheme() {
    // Coffee palette active
  }

  renderCategoryPills() {
    const container = document.getElementById("menu-category-pills");
    if (!container) return;

    container.innerHTML = UNCLE_BREW_DATA.categories.map(cat => `
      <button 
        type="button" 
        data-cat="${cat.id}" 
        class="category-pill whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 flex items-center gap-2 ${cat.id === this.activeCategory ? 'bg-[#2B160A] text-white border-[#2B160A] shadow-md shadow-[#2B160A]/20 font-bold' : 'border-[#E8DDCE] bg-white text-[#5E2F10] hover:text-[#C2782A] hover:border-[#C2782A] shadow-sm'}"
      >
        <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i>
        <span>${cat.name}</span>
      </button>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  renderMenuItems() {
    const grid = document.getElementById("menu-items-grid");
    if (!grid) return;

    let filtered = UNCLE_BREW_DATA.menuItems.filter(item => {
      const matchCat = this.activeCategory === "all" || item.category === this.activeCategory;
      const matchSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      let matchTag = true;
      if (this.activeFilterTag === "bestseller") matchTag = item.tags.includes("bestseller");
      else if (this.activeFilterTag === "under99") matchTag = item.price <= 99;
      else if (this.activeFilterTag === "lowcal") matchTag = parseInt(item.calories) < 200;

      return matchCat && matchSearch && matchTag;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-[#8E7A6E]">
          <i data-lucide="coffee" class="w-12 h-12 mx-auto mb-3 text-[#C49F82] opacity-70"></i>
          <h4 class="text-base font-bold text-[#2B160A]">No drinks match your filters</h4>
          <p class="text-xs text-[#634F44] mt-1">Try resetting the search or selecting another category.</p>
          <button onclick="window.brewApp.resetFilters()" class="mt-4 px-4 py-2 rounded-xl bg-[#2B160A] text-white text-xs font-semibold hover:bg-[#42220D]">Clear All Filters</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = filtered.map(item => `
      <div class="group relative bg-white border border-[#E8DDCE] hover:border-[#C2782A] rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-[#2B160A]/8 flex flex-col justify-between shadow-sm">
        <div>
          <!-- Thumbnail & Badge -->
          <div class="relative w-full h-52 rounded-2xl overflow-hidden mb-4 bg-[#F5ECE1]">
            <img src="${item.image}" alt="${item.name}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            ${item.badge ? `
              <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#C2782A] text-white shadow-md">
                ${item.badge}
              </span>
            ` : ''}
            <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#2B160A] flex items-center gap-1 border border-[#E8DDCE] shadow-sm">
              <i data-lucide="star" class="w-3 h-3 text-[#C2782A] fill-[#C2782A]"></i>
              <span>${item.rating}</span>
            </div>
          </div>

          <!-- Title & Meta -->
          <div class="mb-2">
            <h3 class="text-base font-bold text-[#2B160A] group-hover:text-[#C2782A] transition-colors">${item.name}</h3>
            <p class="text-xs text-[#634F44] mt-1.5 line-clamp-2 leading-relaxed">${item.description}</p>
          </div>

          <!-- Tasting notes -->
          <div class="flex items-center gap-3 py-2.5 border-t border-[#F2E9DE] text-[11px] text-[#8E7A6E] mb-4">
            <span class="flex items-center gap-1"><i data-lucide="flame" class="w-3 h-3 text-[#C2782A]"></i> ${item.calories}</span>
            <span class="flex items-center gap-1"><i data-lucide="zap" class="w-3 h-3 text-[#A35B1B]"></i> ${item.caffeine}</span>
          </div>
        </div>

        <!-- Action / Price -->
        <div class="pt-3 border-t border-[#F2E9DE] flex items-center justify-between">
          <div>
            <span class="text-[10px] text-[#8E7A6E] uppercase font-semibold block">Starting from</span>
            <div class="text-lg font-black text-[#C2782A]">₱${item.price}</div>
          </div>
          <button 
            onclick="window.brewApp.openCustomizerModal('${item.id}')"
            class="px-4 py-2.5 rounded-xl bg-[#2B160A] hover:bg-[#42220D] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#2B160A]/15 active:scale-95"
          >
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Add</span>
          </button>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  openCustomizerModal(itemId) {
    const item = UNCLE_BREW_DATA.menuItems.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById("item-detail-modal");
    if (!modal) return;

    modal.dataset.itemId = itemId;

    // Populate data
    document.getElementById("modal-item-img").src = item.image;
    document.getElementById("modal-item-title").textContent = item.name;
    document.getElementById("modal-item-desc").textContent = item.description;
    document.getElementById("modal-item-badge").textContent = item.badge || "Signature Brew";
    document.getElementById("modal-item-cal").textContent = item.calories;
    document.getElementById("modal-item-caf").textContent = item.caffeine;

    // Size selection reset
    const sizeRadios = document.querySelectorAll("input[name='modal-item-size']");
    sizeRadios.forEach(r => r.checked = r.value === "regular");

    // Base price
    this.updateModalPrice(item);

    modal.classList.remove("hidden");
    if (window.cafeAudio) window.cafeAudio.playChime('pop');
  }

  updateModalPrice(item) {
    if (!item) {
      const modal = document.getElementById("item-detail-modal");
      item = UNCLE_BREW_DATA.menuItems.find(i => i.id === modal.dataset.itemId);
    }
    if (!item) return;

    const isLarge = document.querySelector("input[name='modal-item-size'][value='large']")?.checked;
    let basePrice = isLarge ? item.largePrice : item.regularPrice;

    // Extra toppings
    const checkedAddons = document.querySelectorAll(".modal-addon-chk:checked");
    checkedAddons.forEach(chk => {
      basePrice += parseInt(chk.dataset.price || "0", 10);
    });

    const priceEl = document.getElementById("modal-total-price");
    if (priceEl) priceEl.textContent = `₱${basePrice}`;
  }

  confirmModalAddToCart() {
    const modal = document.getElementById("item-detail-modal");
    const itemId = modal.dataset.itemId;
    const item = UNCLE_BREW_DATA.menuItems.find(i => i.id === itemId);
    if (!item) return;

    const isLarge = document.querySelector("input[name='modal-item-size'][value='large']")?.checked;
    const sweetness = document.querySelector("input[name='modal-sweetness']:checked")?.value || "50%";
    const ice = document.querySelector("input[name='modal-ice']:checked")?.value || "Standard Ice";
    
    const toppings = Array.from(document.querySelectorAll(".modal-addon-chk:checked")).map(c => c.value);
    let finalPrice = isLarge ? item.largePrice : item.regularPrice;
    document.querySelectorAll(".modal-addon-chk:checked").forEach(chk => {
      finalPrice += parseInt(chk.dataset.price || "0", 10);
    });

    const customDetails = {
      size: isLarge ? "22oz (Large)" : "16oz (Regular)",
      sweetness: sweetness,
      ice: ice,
      toppings: toppings
    };

    const cartProduct = {
      ...item,
      price: finalPrice
    };

    this.cart.addItem(cartProduct, 1, customDetails);
    modal.classList.add("hidden");

    if (window.cafeAudio) window.cafeAudio.playChime('success');
  }

  resetFilters() {
    this.activeCategory = "all";
    this.searchQuery = "";
    this.activeFilterTag = "all";
    const searchInput = document.getElementById("menu-search-input");
    if (searchInput) searchInput.value = "";
    this.renderCategoryPills();
    this.renderMenuItems();
  }

  // Loyalty Stamp Card
  renderLoyaltyClub() {
    const grid = document.getElementById("loyalty-stamps-grid");
    if (!grid) return;

    const totalStamps = 10;
    let html = "";

    for (let i = 1; i <= totalStamps; i++) {
      const isStamped = i <= this.loyaltyStamps;
      const isFree = i === totalStamps;
      html += `
        <div class="relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 ${isStamped ? 'bg-[#FDF9F4] border-[#C2782A] text-[#A35B1B] shadow-sm' : 'bg-[#FAF7F2] border-[#E8DDCE] text-[#8E7A6E]'}">
          <div class="w-11 h-11 rounded-full flex items-center justify-center border ${isStamped ? 'border-[#C2782A] bg-[#C2782A] text-white font-black shadow-md' : 'border-[#E8DDCE] bg-white text-[#8E7A6E] shadow-inner'}">
            ${isStamped ? '<i data-lucide="coffee" class="w-5 h-5"></i>' : `<span class="text-xs font-bold">${i}</span>`}
          </div>
          <span class="text-[10px] font-bold mt-2 ${isFree ? 'text-[#C2782A] uppercase tracking-wider' : 'text-[#634F44]'}">
            ${isFree ? 'FREE BREW' : `Cup #${i}`}
          </span>
        </div>
      `;
    }

    grid.innerHTML = html;

    const countEl = document.getElementById("loyalty-count-display");
    if (countEl) countEl.textContent = `${this.loyaltyStamps} of 10 Collected`;

    const rewardBanner = document.getElementById("loyalty-reward-banner");
    if (rewardBanner) {
      rewardBanner.classList.toggle("hidden", this.loyaltyStamps < 10);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  punchStamp() {
    if (this.loyaltyStamps >= 10) {
      this.loyaltyStamps = 0; // Reset after claimed
    }
    this.loyaltyStamps++;
    localStorage.setItem("unclebrew_stamps", this.loyaltyStamps.toString());
    this.renderLoyaltyClub();

    if (window.cafeAudio) window.cafeAudio.playChime('stamp');

    if (this.loyaltyStamps === 10) {
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 } });
      }
      if (window.cafeAudio) window.cafeAudio.playChime('success');
    }
  }

  // Interactive Store Locator with Leaflet
  initStoreLocatorMap() {
    const mapEl = document.getElementById("stores-map");
    if (!mapEl || !window.L) return;

    // Centered at Cebu / Visayas by default
    this.map = window.L.map("stores-map", {
      scrollWheelZoom: false
    }).setView([10.3276, 123.9061], 13);

    // Dark-mode Map Tiles
    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
      maxZoom: 19
    }).addTo(this.map);

    // Custom Icon
    const coffeeIcon = window.L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="w-9 h-9 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-stone-900 font-bold">
          ☕
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    UNCLE_BREW_DATA.branches.forEach(branch => {
      const marker = window.L.marker(branch.coordinates, { icon: coffeeIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-2 text-stone-900 font-sans">
          <h4 class="font-bold text-sm text-stone-950">${branch.name}</h4>
          <p class="text-xs text-stone-600 mt-1">${branch.address}</p>
          <div class="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-700">
            <span>🕒 ${branch.hours}</span>
          </div>
          <button onclick="window.brewApp.selectStore('${branch.id}')" class="mt-2 w-full py-1.5 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs">
            Order Pickup Here
          </button>
        </div>
      `);
    });

    this.renderStoreList();
  }

  renderStoreList(filterRegion = "all") {
    const list = document.getElementById("store-locator-list");
    if (!list) return;

    let branches = UNCLE_BREW_DATA.branches;
    if (filterRegion !== "all") {
      branches = branches.filter(b => b.region.toLowerCase() === filterRegion.toLowerCase());
    }

    list.innerHTML = branches.map(b => `
      <div 
        data-store="${b.id}"
        class="p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${this.selectedStore.id === b.id ? 'border-[#C2782A] ring-2 ring-[#C2782A]/20 bg-[#FDF9F4]' : 'border-[#E8DDCE] bg-white hover:border-[#C2782A]'}"
        onclick="window.brewApp.focusStore('${b.id}')"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <h4 class="text-sm font-bold text-[#2B160A]">${b.name}</h4>
            <p class="text-xs text-[#634F44] mt-1 leading-relaxed">${b.address}</p>
          </div>
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            ${b.isFlagship ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C2782A]/15 text-[#A35B1B] border border-[#C2782A]/30 uppercase tracking-wider">Prime</span>` : ''}
            ${b.distanceKm ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2B160A] text-white">📍 ${b.distanceKm.toFixed(1)} km</span>` : ''}
          </div>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-3">
          ${b.amenities.map(a => `<span class="px-2.5 py-0.5 rounded-full text-[10px] bg-[#FAF7F2] text-[#5E2F10] border border-[#E8DDCE] font-medium">${a}</span>`).join("")}
        </div>
        <div class="flex items-center justify-between mt-3 text-xs border-t border-[#F2E9DE] pt-2.5">
          <span class="text-emerald-700 font-semibold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ${b.hours}</span>
          <span class="text-[#C2782A] font-bold">${b.phone}</span>
        </div>
      </div>
    `).join("");
  }

  focusStore(storeId) {
    const store = UNCLE_BREW_DATA.branches.find(b => b.id === storeId);
    if (!store || !this.map) return;
    this.selectedStore = store;
    this.map.flyTo(store.coordinates, 15, { duration: 1.2 });
    this.renderStoreList();
    if (window.cafeAudio) window.cafeAudio.playChime('pop');
  }

  selectStore(storeId) {
    const store = UNCLE_BREW_DATA.branches.find(b => b.id === storeId);
    if (store) {
      this.selectedStore = store;
      alert(`Pickup Store selected: ${store.name}`);
    }
  }

  // Live Order Simulator
  startOrderTracking(orderId) {
    const modal = document.getElementById("order-tracking-modal");
    if (!modal) return;

    modal.classList.remove("hidden");
    document.getElementById("tracking-order-id").textContent = orderId;

    const steps = [
      { id: "step-1", status: "Order Received", sub: "Order confirmed with store terminal" },
      { id: "step-2", status: "Barista Brewing", sub: "Grinding Benguet highland beans & pulling espresso" },
      { id: "step-3", status: "Thermal Sealed", sub: "Quality checked and ready for rider dispatch" },
      { id: "step-4", status: "Out for Delivery", sub: "Rider Kuya Jobert en route to your doorstep" }
    ];

    let currentStep = 1;
    const progressEl = document.getElementById("tracking-progress-fill");
    const statusTextEl = document.getElementById("tracking-current-status");

    const updateStepUI = (step) => {
      steps.forEach((s, idx) => {
        const stepNum = idx + 1;
        const iconEl = document.getElementById(`tracking-step-icon-${stepNum}`);
        if (iconEl) {
          if (stepNum <= step) {
            iconEl.classList.remove("bg-stone-800", "text-stone-500", "border-stone-700");
            iconEl.classList.add("bg-amber-500", "text-stone-950", "border-amber-400", "font-bold");
          } else {
            iconEl.classList.add("bg-stone-800", "text-stone-500", "border-stone-700");
            iconEl.classList.remove("bg-amber-500", "text-stone-950", "border-amber-400", "font-bold");
          }
        }
      });

      if (progressEl) progressEl.style.width = `${(step / 4) * 100}%`;
      if (statusTextEl) statusTextEl.textContent = steps[step - 1].status;
    };

    updateStepUI(currentStep);

    // Simulate real-time progress steps
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= 4) {
        updateStepUI(currentStep);
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      } else {
        clearInterval(interval);
      }
    }, 4500);
  }

  bindGlobalEvents() {
    // Categories click
    const catContainer = document.getElementById("menu-category-pills");
    if (catContainer) {
      catContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-cat]");
        if (!btn) return;
        this.activeCategory = btn.dataset.cat;
        this.renderCategoryPills();
        this.renderMenuItems();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    }

    // Search bar
    const searchInput = document.getElementById("menu-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderMenuItems();
      });
    }

    // Filter tags (Bestsellers, Under 99, Low Cal)
    const filterTags = document.querySelectorAll(".menu-filter-tag");
    filterTags.forEach(btn => {
      btn.addEventListener("click", () => {
        filterTags.forEach(b => b.classList.remove("border-amber-500", "text-amber-400", "bg-amber-950/30"));
        btn.classList.add("border-amber-500", "text-amber-400", "bg-amber-950/30");
        this.activeFilterTag = btn.dataset.tag;
        this.renderMenuItems();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    });

    // Cart open / close
    document.querySelectorAll(".btn-open-cart").forEach(b => {
      b.addEventListener("click", () => this.cart.openDrawer());
    });
    document.querySelectorAll(".btn-close-cart").forEach(b => {
      b.addEventListener("click", () => this.cart.closeDrawer());
    });
    const overlay = document.getElementById("cart-overlay");
    if (overlay) overlay.addEventListener("click", () => this.cart.closeDrawer());

    // Voucher apply
    const applyVoucherBtn = document.getElementById("btn-apply-voucher");
    if (applyVoucherBtn) {
      applyVoucherBtn.addEventListener("click", () => {
        const input = document.getElementById("cart-voucher-input");
        const res = this.cart.applyVoucher(input.value);
        const msgEl = document.getElementById("cart-voucher-message");
        if (msgEl) {
          msgEl.textContent = res.message;
          msgEl.className = res.success ? "text-xs text-emerald-400 mt-1" : "text-xs text-red-400 mt-1";
        }
        if (res.success && window.cafeAudio) window.cafeAudio.playChime('success');
      });
    }

    // Modal Size radio changes
    document.querySelectorAll("input[name='modal-item-size']").forEach(r => {
      r.addEventListener("change", () => this.updateModalPrice());
    });
    document.querySelectorAll(".modal-addon-chk").forEach(c => {
      c.addEventListener("change", () => this.updateModalPrice());
    });

    // Close Customizer Modal
    const closeModalBtn = document.getElementById("btn-close-item-modal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        document.getElementById("item-detail-modal").classList.add("hidden");
      });
    }

    // Modal Add To Cart Confirm
    const confirmAddBtn = document.getElementById("btn-confirm-modal-add");
    if (confirmAddBtn) {
      confirmAddBtn.addEventListener("click", () => {
        this.confirmModalAddToCart();
      });
    }

    // Checkout Modal Open
    const checkoutBtn = document.getElementById("btn-cart-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        this.cart.closeDrawer();
        const checkoutModal = document.getElementById("checkout-modal");
        if (checkoutModal) {
          checkoutModal.classList.remove("hidden");
          const grandTotal = this.cart.getTotals().total;
          const checkoutTotalEl = document.getElementById("checkout-summary-total");
          if (checkoutTotalEl) checkoutTotalEl.textContent = `₱${grandTotal}`;
        }
      });
    }

    // Checkout Close
    const closeCheckoutBtn = document.getElementById("btn-close-checkout");
    if (closeCheckoutBtn) {
      closeCheckoutBtn.addEventListener("click", () => {
        document.getElementById("checkout-modal").classList.add("hidden");
      });
    }

    // Checkout Submit Form
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const orderId = "UB-" + Math.floor(100000 + Math.random() * 900000);
        
        const customerName = document.getElementById("checkout-name")?.value || "Valued Customer";
        const customerPhone = document.getElementById("checkout-phone")?.value || "";
        const deliveryAddress = document.getElementById("checkout-address")?.value || "";
        const branch = document.getElementById("checkout-branch")?.value || "Cebu IT Park Flagship";
        const fulfillmentType = document.querySelector('input[name="order-fulfillment"]:checked')?.value || "delivery";
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || "gcash";

        const totals = this.cart.getTotals();
        const items = [...this.cart.items];

        document.getElementById("checkout-modal").classList.add("hidden");
        this.cart.clear();

        if (window.confetti) {
          window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        }
        if (window.cafeAudio) window.cafeAudio.playChime('success');

        // Persist order to Supabase
        if (window.uncleBrewSupabase) {
          window.uncleBrewSupabase.createOrder({
            orderId,
            customerName,
            customerPhone,
            deliveryAddress,
            fulfillmentType,
            branch,
            paymentMethod,
            items,
            subtotal: totals.subtotal,
            discount: totals.discount,
            deliveryFee: totals.deliveryFee,
            totalAmount: totals.total
          }).then(res => {
            if (res.success && !res.localOnly) {
              console.log("[UncleBrew] Order synchronized to Supabase Cloud:", res.data);
            }
          });
        }

        this.startOrderTracking(orderId);
      });
    }

    // Close tracking modal
    const closeTrackingBtn = document.getElementById("btn-close-tracking");
    if (closeTrackingBtn) {
      closeTrackingBtn.addEventListener("click", () => {
        document.getElementById("order-tracking-modal").classList.add("hidden");
      });
    }

    // Loyalty punch stamp demo button
    const punchBtn = document.getElementById("btn-punch-stamp");
    if (punchBtn) {
      punchBtn.addEventListener("click", () => this.punchStamp());
    }

    // Ambient audio toggle
    const audioBtn = document.getElementById("btn-toggle-ambient-audio");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        const isPlaying = window.cafeAudio.toggleAmbient();
        const icon = document.getElementById("ambient-audio-icon");
        const label = document.getElementById("ambient-audio-label");
        if (isPlaying) {
          audioBtn.classList.add("bg-amber-500", "text-stone-950", "border-amber-400");
          audioBtn.classList.remove("bg-stone-900/60", "text-stone-300");
          if (label) label.textContent = "Café Sound: ON";
        } else {
          audioBtn.classList.remove("bg-amber-500", "text-stone-950", "border-amber-400");
          audioBtn.classList.add("bg-stone-900/60", "text-stone-300");
          if (label) label.textContent = "Café Sound: OFF";
        }
      });
    }

    // Store locator region filters
    document.querySelectorAll(".store-region-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".store-region-btn").forEach(b => {
          b.classList.remove("bg-amber-500", "text-stone-950", "border-amber-500");
          b.classList.add("bg-stone-900/80", "text-stone-400", "border-stone-800");
        });
        btn.classList.add("bg-amber-500", "text-stone-950", "border-amber-500");
        btn.classList.remove("bg-stone-900/80", "text-stone-400", "border-stone-800");
        this.renderStoreList(btn.dataset.region);
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById("btn-toggle-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Mobile Hamburger Menu
    const mobileBtn = document.getElementById("btn-mobile-menu");
    const mobileDrawer = document.getElementById("mobile-menu-drawer");
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener("click", () => {
        mobileDrawer.classList.toggle("hidden");
      });
      mobileDrawer.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          mobileDrawer.classList.add("hidden");
        });
      });
    }

    // Supabase Status Badge & Modal
    const supaBadge = document.getElementById("supabase-status-badge");
    const supaModal = document.getElementById("supabase-config-modal");
    const supaClose = document.getElementById("btn-close-supabase-modal");
    const supaSave = document.getElementById("btn-save-supabase-url");
    const supaPing = document.getElementById("btn-test-supabase-ping");
    const supaUrlInput = document.getElementById("input-supabase-url");
    const supaMsg = document.getElementById("supabase-modal-msg");

    if (supaBadge && supaModal) {
      supaBadge.addEventListener("click", () => {
        if (supaUrlInput && window.uncleBrewSupabase) {
          supaUrlInput.value = window.uncleBrewSupabase.projectUrl || "";
        }
        if (supaMsg) supaMsg.classList.add("hidden");
        supaModal.classList.remove("hidden");
      });
    }

    if (supaClose && supaModal) {
      supaClose.addEventListener("click", () => {
        supaModal.classList.add("hidden");
      });
    }

    if (supaSave && supaUrlInput) {
      supaSave.addEventListener("click", async () => {
        const url = supaUrlInput.value.trim();
        if (!url) {
          if (supaMsg) {
            supaMsg.className = "p-3 rounded-xl text-[11px] bg-red-950/80 border border-red-500/50 text-red-300";
            supaMsg.textContent = "Please enter your Supabase Project URL (e.g. https://your-ref.supabase.co)";
            supaMsg.classList.remove("hidden");
          }
          return;
        }

        const success = window.uncleBrewSupabase.setProjectUrl(url);
        if (success) {
          if (supaMsg) {
            supaMsg.className = "p-3 rounded-xl text-[11px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300";
            supaMsg.textContent = "✓ Connected to Supabase Project! Orders and inquiries will sync in real time.";
            supaMsg.classList.remove("hidden");
          }
          if (window.cafeAudio) window.cafeAudio.playChime('success');
        } else {
          if (supaMsg) {
            supaMsg.className = "p-3 rounded-xl text-[11px] bg-red-950/80 border border-red-500/50 text-red-300";
            supaMsg.textContent = "Failed to initialize Supabase client with this URL.";
            supaMsg.classList.remove("hidden");
          }
        }
      });
    }

    if (supaPing) {
      supaPing.addEventListener("click", async () => {
        if (!window.uncleBrewSupabase || !window.uncleBrewSupabase.projectUrl) {
          if (supaMsg) {
            supaMsg.className = "p-3 rounded-xl text-[11px] bg-amber-950/80 border border-amber-500/50 text-amber-300";
            supaMsg.textContent = "Please save your Project URL first before testing ping.";
            supaMsg.classList.remove("hidden");
          }
          return;
        }

        const ok = await window.uncleBrewSupabase.testConnection();
        if (supaMsg) {
          if (ok) {
            supaMsg.className = "p-3 rounded-xl text-[11px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300";
            supaMsg.textContent = "✓ Ping successful! Endpoint responded.";
          } else {
            supaMsg.className = "p-3 rounded-xl text-[11px] bg-amber-950/80 border border-amber-500/50 text-amber-300";
            supaMsg.textContent = "Endpoint reached. Make sure you ran supabase-schema.sql in your Supabase SQL editor.";
          }
          supaMsg.classList.remove("hidden");
        }
      });
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.brewApp = new UncleBrewApp();
  window.brewStudio = new BrewStudio();
  window.franchiseCalc = new FranchiseCalculator();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});
