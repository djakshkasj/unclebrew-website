/**
 * Uncle Brew - Member Ordering Portal Application Logic
 * Focused on: Available Products Catalog, Cart & Vouchers, Item Customizer, Checkout, and Live Order Tracker
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

  addItem(product, qty = 1, customDetails = null, openDrawerAfter = true) {
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
    if (openDrawerAfter) {
      this.openDrawer();
    }
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

    if (subtotal === 0) {
      return { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 };
    }

    if (this.activeVoucher) {
      if (this.activeVoucher.type === "fixed") {
        discount = this.activeVoucher.discount;
      } else if (this.activeVoucher.type === "percent") {
        discount = Math.round(subtotal * (this.activeVoucher.discount / 100));
      } else if (this.activeVoucher.type === "shipping") {
        actualDeliveryFee = 0;
      }
    }

    const total = Math.max(0, subtotal - discount + actualDeliveryFee);
    return { subtotal, discount, deliveryFee: actualDeliveryFee, total };
  }

  openDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer && overlay) {
      overlay.classList.remove("hidden");
      setTimeout(() => {
        drawer.classList.remove("translate-x-full");
      }, 10);
    }
  }

  closeDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer && overlay) {
      drawer.classList.add("translate-x-full");
      setTimeout(() => {
        overlay.classList.add("hidden");
      }, 300);
    }
  }

  renderCartUI() {
    const totalCount = this.items.reduce((acc, i) => acc + i.qty, 0);
    const badges = document.querySelectorAll(".cart-count-badge");
    badges.forEach(b => {
      b.textContent = totalCount;
      b.classList.toggle("hidden", totalCount === 0);
    });

    const listEl = document.getElementById("cart-items-list");
    const emptyEl = document.getElementById("cart-empty-state");
    const footerEl = document.getElementById("cart-footer");

    if (!listEl) return;

    if (this.items.length === 0) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.classList.remove("hidden");
      if (footerEl) footerEl.classList.add("hidden");
      return;
    }

    if (emptyEl) emptyEl.classList.add("hidden");
    if (footerEl) footerEl.classList.remove("hidden");

    const totals = this.getTotals();

    listEl.innerHTML = this.items.map((item, idx) => `
      <div class="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-[#E8DDCE] shadow-sm items-center">
        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-[#E8DDCE]">
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-bold text-[#24140B] text-xs truncate">${item.name}</h4>
            <button type="button" onclick="window.brewCart.removeItem(${idx})" class="text-[#8E7A6E] hover:text-red-600 transition-colors">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          ${item.customDetails ? `
            <p class="text-[11px] text-[#634F44] mt-0.5 leading-snug">
              ${item.customDetails.size || ''} • ${item.customDetails.sweetness || ''}
              ${item.customDetails.milk ? `• ${item.customDetails.milk}` : ''}
              ${item.customDetails.toppings && item.customDetails.toppings.length ? `<br><span class="text-[#C2782A] font-medium">+ ${item.customDetails.toppings.join(', ')}</span>` : ''}
            </p>
          ` : ''}
          <div class="flex items-center justify-between mt-2.5">
            <span class="text-xs font-extrabold text-[#C2782A]">₱${item.price * item.qty}</span>
            <div class="flex items-center gap-2 bg-[#FAF7F2] rounded-lg px-2 py-1 border border-[#E8DDCE]">
              <button type="button" onclick="window.brewCart.updateQty(${idx}, -1)" class="text-[#634F44] hover:text-[#24140B] text-xs font-bold px-1">-</button>
              <span class="text-xs font-bold text-[#24140B] w-4 text-center">${item.qty}</span>
              <button type="button" onclick="window.brewCart.updateQty(${idx}, 1)" class="text-[#634F44] hover:text-[#24140B] text-xs font-bold px-1">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

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

class UncleBrewApp {
  constructor() {
    this.cart = new BrewCart();
    window.brewCart = this.cart;
    this.activeCategory = "all";
    this.searchQuery = "";
    this.activeFilterTag = "all";
    this.init();
  }

  init() {
    this.renderCategoryPills();
    this.renderMenuItems();
    this.bindGlobalEvents();
    this.initBrewStudioCupPhysics();
    this.cart.renderCartUI();
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

  getFilteredMenu() {
    return UNCLE_BREW_DATA.menuItems.filter(item => {
      const matchesCat = this.activeCategory === "all" || item.category === this.activeCategory;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some(n => n.toLowerCase().includes(q)));

      let matchesTag = true;
      if (this.activeFilterTag === "bestseller") {
        matchesTag = (item.badge && (item.badge.includes("Seller") || item.badge.includes("Favorite") || item.badge.includes("Legend") || item.badge.includes("Pick"))) ||
                     (Array.isArray(item.tags) && item.tags.includes("bestseller"));
      } else if (this.activeFilterTag === "under99") {
        matchesTag = item.price < 100;
      } else if (this.activeFilterTag === "lowcal") {
        const calNum = parseInt(item.calories, 10);
        matchesTag = !isNaN(calNum) && calNum <= 200;
      }

      return matchesCat && matchesSearch && matchesTag;
    });
  }

  formatItemNotes(item) {
    if (Array.isArray(item.tastingNotes)) {
      return item.tastingNotes;
    }
    if (item.tastingNotes && typeof item.tastingNotes === "object") {
      const pills = [];
      if (item.tastingNotes.boldness) pills.push(`Bold ${item.tastingNotes.boldness}/5`);
      if (item.tastingNotes.sweetness) pills.push(`Sweet ${item.tastingNotes.sweetness}/5`);
      if (item.tastingNotes.aroma) pills.push(`Aroma ${item.tastingNotes.aroma}/5`);
      return pills;
    }
    if (Array.isArray(item.tags)) {
      return item.tags;
    }
    return [];
  }

  renderMenuItems() {
    const grid = document.getElementById("menu-items-grid");
    if (!grid) return;

    const filtered = this.getFilteredMenu();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-[#E8DDCE] p-8 shadow-sm">
          <div class="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#E8DDCE] flex items-center justify-center mx-auto mb-4 text-[#C2782A]">
            <i data-lucide="coffee" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-bold text-[#24140B]">No matching brews found</h3>
          <p class="text-sm text-[#634F44] mt-1">Try clearing your search filter or switching categories.</p>
          <button type="button" onclick="window.brewApp.resetFilters()" class="mt-4 px-5 py-2.5 rounded-xl bg-[#24140B] text-white text-xs font-bold hover:bg-[#3D2214]">
            Reset All Filters
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = filtered.map((item, idx) => `
      <div data-card-index="${idx}" class="scroll-card-item tilt-card group relative rounded-3xl bg-white border border-[#E8DDCE] hover:border-[#C2782A] overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl">
        <div class="tilt-glare"></div>
        <div>
          <div class="relative h-52 overflow-hidden bg-[#F5ECE1] cursor-pointer" onclick="window.brewApp.openItemModal('${item.id}')">
            <img 
              src="${item.image}" 
              alt="${item.name}" 
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-[#24140B]/65 via-transparent to-transparent"></div>
            
            ${item.badge ? `
              <span class="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#24140B]/90 text-[#FAF7F2] backdrop-blur-md shadow">
                ${item.badge}
              </span>
            ` : ''}

            <div class="absolute top-3.5 right-3.5 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#24140B] border border-[#E8DDCE] shadow-sm">
              <i data-lucide="star" class="w-3.5 h-3.5 text-[#C2782A] fill-[#C2782A]"></i>
              <span>${item.rating}</span>
            </div>

            <div class="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-[#FAF7F2] font-medium">
              <span>${item.calories}</span>
              <span>•</span>
              <span>${item.caffeine} caffeine</span>
            </div>
          </div>

          <div class="p-6">
            <h3 class="text-base font-bold text-[#24140B] group-hover:text-[#C2782A] transition-colors cursor-pointer" onclick="window.brewApp.openItemModal('${item.id}')">${item.name}</h3>
            <p class="text-xs text-[#634F44] mt-2 line-clamp-2 leading-relaxed">${item.description}</p>
            
            <div class="flex flex-wrap gap-1.5 mt-4">
              ${this.formatItemNotes(item).map(note => `
                <span class="text-[10px] px-2.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#634F44] border border-[#E8DDCE] font-medium group-hover:border-[#C2782A]/50 transition-colors">${note}</span>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="px-6 pb-6 pt-3 border-t border-[#F2E9DE] flex items-center justify-between gap-2">
          <div>
            <span class="text-[10px] text-[#8E7A6E] uppercase tracking-wider block font-semibold">Starts at</span>
            <span class="text-xl font-black text-[#24140B]">₱${item.price}</span>
          </div>

          <div class="flex items-center gap-2">
            <button 
              type="button"
              onclick="window.brewApp.quickAddItem('${item.id}', this)"
              title="1-Click Quick Add to Cart"
              class="magnetic-btn px-3 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#C2782A] text-[#24140B] hover:text-white border border-[#E8DDCE] hover:border-[#C2782A] font-bold text-xs flex items-center gap-1 transition-all active:scale-90"
            >
              <i data-lucide="zap" class="w-3.5 h-3.5 text-[#C2782A] group-hover:text-current"></i>
              <span>+1</span>
            </button>
            <button 
              type="button"
              onclick="window.brewApp.openItemModal('${item.id}')"
              class="magnetic-btn px-4 py-2.5 rounded-xl bg-[#24140B] hover:bg-[#3D2214] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#24140B]/15 active:scale-95 transition-all"
            >
              <i data-lucide="sliders" class="w-3.5 h-3.5 text-[#C2782A]"></i>
              <span>Customize</span>
            </button>
          </div>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
    if (window.motionSystem) window.motionSystem.refreshDynamicElements();
  }

  quickAddItem(itemId, btnEl) {
    const item = UNCLE_BREW_DATA.menuItems.find(m => m.id === itemId);
    if (!item) return;

    if (window.flyToCart && btnEl) {
      window.flyToCart(btnEl, '☕');
    }
    if (window.motionSystem && btnEl) {
      window.motionSystem.spawnFloatingToast(btnEl, `+1 ${item.name.split(' ')[0]} (₱${item.price})`);
    }

    const customProduct = {
      id: item.id + "-reg",
      name: item.name,
      price: item.regularPrice || item.price,
      image: item.image
    };
    const customDetails = {
      size: "16oz Regular",
      sweetness: "50% Sugar",
      ice: "Standard Ice",
      toppings: []
    };

    this.cart.addItem(customProduct, 1, customDetails, false);
    if (window.cafeAudio) window.cafeAudio.playChime('success');
  }

  openCustomizerModal(itemId) {
    this.openItemModal(itemId);
  }

  openItemModal(itemId) {
    const item = UNCLE_BREW_DATA.menuItems.find(m => m.id === itemId);
    if (!item) return;

    this.currentModalItem = item;
    const modal = document.getElementById("item-detail-modal");
    if (!modal) return;

    document.getElementById("modal-item-img").src = item.image;
    document.getElementById("modal-item-title").textContent = item.name;
    document.getElementById("modal-item-desc").textContent = item.description;
    document.getElementById("modal-item-cal").textContent = item.calories;
    document.getElementById("modal-item-caf").textContent = item.caffeine;
    document.getElementById("modal-item-badge").textContent = item.badge || "Signature Brew";

    const sizeRadios = document.querySelectorAll("input[name='modal-item-size']");
    sizeRadios.forEach(r => {
      if (r.value === "regular") r.checked = true;
    });

    this.updateModalPrice();
    modal.classList.remove("hidden");
  }

  updateModalPrice() {
    if (!this.currentModalItem) return;
    const sizeEl = document.querySelector("input[name='modal-item-size']:checked");
    const isLarge = sizeEl && sizeEl.value === "large";
    let basePrice = isLarge ? this.currentModalItem.largePrice : this.currentModalItem.regularPrice;

    const addonChecks = document.querySelectorAll(".modal-addon-chk:checked");
    addonChecks.forEach(chk => {
      basePrice += parseInt(chk.dataset.price || "0", 10);
    });

    const priceDisplay = document.getElementById("modal-total-price");
    if (priceDisplay) priceDisplay.textContent = `₱${basePrice}`;
  }

  confirmModalAddToCart() {
    if (!this.currentModalItem) return;
    const sizeEl = document.querySelector("input[name='modal-item-size']:checked");
    const isLarge = sizeEl && sizeEl.value === "large";
    const sweetnessEl = document.querySelector("input[name='modal-sweetness']:checked");
    const iceEl = document.querySelector("input[name='modal-ice']:checked");

    const addons = [];
    let finalPrice = isLarge ? this.currentModalItem.largePrice : this.currentModalItem.regularPrice;

    document.querySelectorAll(".modal-addon-chk:checked").forEach(chk => {
      addons.push(chk.value);
      finalPrice += parseInt(chk.dataset.price || "0", 10);
      chk.checked = false;
    });

    const customProduct = {
      id: this.currentModalItem.id + (isLarge ? "-lg" : "-reg"),
      name: this.currentModalItem.name,
      price: finalPrice,
      image: this.currentModalItem.image
    };

    const customDetails = {
      size: isLarge ? "22oz Large" : "16oz Regular",
      sweetness: sweetnessEl ? sweetnessEl.value : "50% Sugar",
      ice: iceEl ? iceEl.value : "Standard Ice",
      toppings: addons
    };

    const confirmBtn = document.getElementById("btn-confirm-modal-add");
    if (window.flyToCart && confirmBtn) window.flyToCart(confirmBtn, '☕');

    this.cart.addItem(customProduct, 1, customDetails);
    document.getElementById("item-detail-modal").classList.add("hidden");

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

  startOrderTracking(orderId) {
    const modal = document.getElementById("order-tracking-modal");
    if (!modal) return;

    document.getElementById("tracking-order-id").textContent = orderId;
    modal.classList.remove("hidden");

    const stages = [
      { step: 1, label: "Order Received by Branch", pct: 25 },
      { step: 2, label: "Grinding Atok Highland Beans & Pulling Shots", pct: 55 },
      { step: 3, label: "Sealing Cup & Quality Inspection", pct: 80 },
      { step: 4, label: "Ready for Pickup / Rider En Route!", pct: 100 }
    ];

    let idx = 0;
    const progressFill = document.getElementById("tracking-progress-fill");
    const statusText = document.getElementById("tracking-current-status");

    const updateStage = () => {
      if (idx >= stages.length) return;
      const current = stages[idx];
      if (progressFill) progressFill.style.width = `${current.pct}%`;
      if (statusText) statusText.textContent = current.label;

      document.querySelectorAll("[id^='tracking-step-icon-']").forEach((el, i) => {
        if (i <= idx) {
          el.className = "w-8 h-8 rounded-full bg-[#C2782A] text-white flex items-center justify-center font-bold shadow-md";
        } else {
          el.className = "w-8 h-8 rounded-full bg-[#FAF7F2] text-[#8E7A6E] border border-[#E8DDCE] flex items-center justify-center";
        }
      });

      idx++;
      if (idx < stages.length) {
        setTimeout(updateStage, 3500);
      }
    };

    updateStage();
  }

  initBrewStudioCupPhysics() {
    const card = document.querySelector("#brew-studio .sticky");
    if (card) {
      card.style.transformStyle = "preserve-3d";
      card.style.transition = "transform 0.15s ease-out";

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - (rect.width / 2);
        const y = e.clientY - rect.top - (rect.height / 2);
        const rotateX = -(y / rect.height) * 12;
        const rotateY = (x / rect.width) * 12;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    }

    const pearlsGroup = document.getElementById("svg-pearls-group");
    if (pearlsGroup) {
      pearlsGroup.style.cursor = "pointer";
      pearlsGroup.addEventListener("click", (e) => {
        const circle = e.target.closest("circle");
        if (!circle) return;
        circle.style.transition = "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)";
        circle.style.transformOrigin = "center";
        circle.style.transform = "scale(1.35) translateY(-6px)";
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
        setTimeout(() => { circle.style.transform = "scale(1) translateY(0)"; }, 260);
      });
    }
  }

  bindGlobalEvents() {
    // Category pill clicks
    const catContainer = document.getElementById("menu-category-pills");
    if (catContainer) {
      catContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".category-pill");
        if (!btn) return;
        this.activeCategory = btn.dataset.cat;
        this.renderCategoryPills();
        this.renderMenuItems();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    }

    // Search input
    const searchInput = document.getElementById("menu-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderMenuItems();
      });
    }

    // Filter tags
    document.querySelectorAll(".menu-filter-tag").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".menu-filter-tag").forEach(b => {
          b.className = "menu-filter-tag px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E8DDCE] text-[#5E2F10] bg-white hover:border-[#C2782A] transition-all shadow-sm";
        });
        btn.className = "menu-filter-tag px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#24140B] text-white bg-[#24140B] transition-all shadow-sm";
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
          msgEl.className = res.success ? "text-xs text-emerald-700 font-semibold mt-1" : "text-xs text-red-600 font-semibold mt-1";
        }
        if (res.success && window.cafeAudio) window.cafeAudio.playChime('success');
      });
    }

    // Modal Size & Addon changes
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

          if (window.brewAuth?.user) {
            const nameInput = document.getElementById("checkout-name");
            const emailInput = document.getElementById("checkout-email");
            if (nameInput && !nameInput.value) nameInput.value = window.brewAuth.displayName || "";
            if (emailInput && !emailInput.value) emailInput.value = window.brewAuth.userEmail || "";
          }
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
        
        const customerName = document.getElementById("checkout-name")?.value || window.brewAuth?.displayName || "Valued Customer";
        const customerPhone = document.getElementById("checkout-phone")?.value || "";
        const customerEmail = document.getElementById("checkout-email")?.value || window.brewAuth?.userEmail || "";
        const deliveryAddress = document.getElementById("checkout-address")?.value || "";
        const branch = document.getElementById("checkout-branch")?.value || "Cebu IT Park Flagship";
        const fulfillmentType = document.querySelector('input[name="order-fulfillment"]:checked')?.value || "delivery";
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || "gcash";

        const totals = this.cart.getTotals();
        const items = [...this.cart.items];

        document.getElementById("checkout-modal").classList.add("hidden");
        this.cart.clear();

        if (window.confetti) {
          window.confetti({ particleCount: 100, spread: 75, origin: { y: 0.5 } });
        }
        if (window.cafeAudio) window.cafeAudio.playChime('success');

        if (window.uncleBrewSupabase) {
          window.uncleBrewSupabase.createOrder({
            orderId,
            customerName,
            customerPhone,
            customerEmail,
            deliveryAddress,
            fulfillmentType,
            branch,
            paymentMethod,
            items,
            subtotal: totals.subtotal,
            discount: totals.discount,
            deliveryFee: totals.deliveryFee,
            totalAmount: totals.total
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

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById("btn-mobile-menu");
    const mobileDrawer = document.getElementById("mobile-menu-drawer");
    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener("click", () => {
        mobileDrawer.classList.toggle("hidden");
      });
      mobileDrawer.querySelectorAll("a, button").forEach(a => {
        a.addEventListener("click", () => mobileDrawer.classList.add("hidden"));
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.brewApp = new UncleBrewApp();
  if (typeof BrewStudio !== "undefined") {
    window.brewStudio = new BrewStudio();
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
