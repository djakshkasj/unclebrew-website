/**
 * Uncle Brew - Interactive Brew Studio (Drink Customizer)
 * Visual SVG/Canvas layered cup visualization with dynamic real-time updates
 */

class BrewStudio {
  constructor() {
    this.state = {
      base: UNCLE_BREW_DATA.customizerOptions.bases[0],
      milk: UNCLE_BREW_DATA.customizerOptions.milks[0],
      sweetness: 50,
      ice: "standard-ice",
      toppings: ["brown-sugar-pearls"],
      customName: "Uncle's Secret Recipe",
      size: "large" // 16oz or 22oz
    };

    this.init();
  }

  init() {
    this.renderSelectors();
    this.bindEvents();
    this.updatePreview();
  }

  renderSelectors() {
    const baseContainer = document.getElementById("studio-bases");
    const milkContainer = document.getElementById("studio-milks");
    const toppingsContainer = document.getElementById("studio-toppings");

    if (baseContainer) {
      baseContainer.innerHTML = UNCLE_BREW_DATA.customizerOptions.bases.map(b => `
        <button type="button" data-base="${b.id}" class="studio-option-btn p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group shadow-sm ${b.id === this.state.base.id ? 'border-[#C2782A] ring-2 ring-[#C2782A]/20 bg-[#FDF9F4]' : 'border-[#E8DDCE] bg-white hover:border-[#C2782A]'}">
          <div class="flex items-center gap-3">
            <span class="w-4 h-4 rounded-full border border-[#E8DDCE] inline-block shadow-inner flex-shrink-0" style="background-color: ${b.color};"></span>
            <span class="text-sm font-semibold text-[#2B160A] group-hover:text-[#C2782A]">${b.name}</span>
          </div>
          <span class="text-xs font-bold ${b.price > 0 ? 'text-[#C2782A]' : 'text-[#8E7A6E]'}">
            ${b.price > 0 ? '+₱' + b.price : 'Free'}
          </span>
        </button>
      `).join("");
    }

    if (milkContainer) {
      milkContainer.innerHTML = UNCLE_BREW_DATA.customizerOptions.milks.map(m => `
        <button type="button" data-milk="${m.id}" class="studio-option-btn p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group shadow-sm ${m.id === this.state.milk.id ? 'border-[#C2782A] ring-2 ring-[#C2782A]/20 bg-[#FDF9F4]' : 'border-[#E8DDCE] bg-white hover:border-[#C2782A]'}">
          <div class="flex items-center gap-3">
            <span class="w-4 h-4 rounded-full border border-[#E8DDCE] inline-block shadow-inner flex-shrink-0" style="background-color: ${m.color};"></span>
            <span class="text-sm font-semibold text-[#2B160A] group-hover:text-[#C2782A]">${m.name}</span>
          </div>
          <span class="text-xs font-bold ${m.price > 0 ? 'text-[#C2782A]' : 'text-[#8E7A6E]'}">
            ${m.price > 0 ? '+₱' + m.price : 'Free'}
          </span>
        </button>
      `).join("");
    }

    if (toppingsContainer) {
      toppingsContainer.innerHTML = UNCLE_BREW_DATA.customizerOptions.toppings.map(t => {
        const isChecked = this.state.toppings.includes(t.id);
        return `
          <label class="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${isChecked ? 'border-[#C2782A] ring-2 ring-[#C2782A]/20 bg-[#FDF9F4]' : 'border-[#E8DDCE] bg-white hover:border-[#C2782A]'}">
            <div class="flex items-center gap-3">
              <input type="checkbox" value="${t.id}" class="studio-topping-chk rounded border-[#E8DDCE] text-[#C2782A] focus:ring-[#C2782A]" ${isChecked ? 'checked' : ''}>
              <span class="text-sm font-semibold text-[#2B160A] group-hover:text-[#C2782A]">${t.name}</span>
            </div>
            <span class="text-xs font-bold text-[#C2782A]">+₱${t.price}</span>
          </label>
        `;
      }).join("");
    }
  }

  bindEvents() {
    // Base selector
    const baseContainer = document.getElementById("studio-bases");
    if (baseContainer) {
      baseContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-base]");
        if (!btn) return;
        const baseId = btn.getAttribute("data-base");
        const found = UNCLE_BREW_DATA.customizerOptions.bases.find(b => b.id === baseId);
        if (found) {
          this.state.base = found;
          this.renderSelectors();
          this.updatePreview();
          if (window.cafeAudio) window.cafeAudio.playChime('pop');
        }
      });
    }

    // Milk selector
    const milkContainer = document.getElementById("studio-milks");
    if (milkContainer) {
      milkContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-milk]");
        if (!btn) return;
        const milkId = btn.getAttribute("data-milk");
        const found = UNCLE_BREW_DATA.customizerOptions.milks.find(m => m.id === milkId);
        if (found) {
          this.state.milk = found;
          this.renderSelectors();
          this.updatePreview();
          if (window.cafeAudio) window.cafeAudio.playChime('pop');
        }
      });
    }

    // Sweetness slider
    const sweetnessSlider = document.getElementById("studio-sweetness-range");
    if (sweetnessSlider) {
      sweetnessSlider.addEventListener("input", (e) => {
        this.state.sweetness = parseInt(e.target.value, 10);
        const label = document.getElementById("studio-sweetness-val");
        if (label) label.textContent = `${this.state.sweetness}% Sugar`;
        this.updatePreview();
      });
    }

    // Ice selector buttons
    const iceButtons = document.querySelectorAll(".studio-ice-btn");
    iceButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        iceButtons.forEach(b => {
          b.className = "studio-ice-btn p-2.5 rounded-xl text-xs border border-[#E8DDCE] bg-white text-[#634F44] hover:border-[#C2782A] font-semibold";
        });
        btn.className = "studio-ice-btn p-2.5 rounded-xl text-xs border border-[#C2782A] bg-[#FDF9F4] text-[#C2782A] font-bold";
        this.state.ice = btn.dataset.ice;
        this.updatePreview();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    });

    // Toppings checkboxes
    const toppingsContainer = document.getElementById("studio-toppings");
    if (toppingsContainer) {
      toppingsContainer.addEventListener("change", () => {
        const checked = Array.from(document.querySelectorAll(".studio-topping-chk:checked")).map(c => c.value);
        this.state.toppings = checked;
        this.renderSelectors();
        this.updatePreview();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    }

    // Size buttons
    const sizeBtns = document.querySelectorAll(".studio-size-btn");
    sizeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        sizeBtns.forEach(b => {
          b.className = "studio-size-btn p-3.5 rounded-2xl border border-[#E8DDCE] bg-white text-[#24140B] text-xs font-bold flex items-center justify-between transition-all";
        });
        btn.className = "studio-size-btn p-3.5 rounded-2xl border border-[#24140B] bg-[#24140B] text-white text-xs font-bold flex items-center justify-between shadow-md transition-all";
        this.state.size = btn.dataset.size;
        this.updatePreview();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    });

    // Add to cart button
    const addBtn = document.getElementById("btn-add-studio-drink");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.addToCart();
      });
    }
  }

  calculateStats() {
    let basePrice = this.state.size === "large" ? 99 : 79;
    let price = basePrice + this.state.base.price + this.state.milk.price;
    let calories = this.state.base.calories + this.state.milk.calories + (this.state.sweetness * 0.9);
    let caffeine = this.state.base.caffeine;

    this.state.toppings.forEach(tId => {
      const topping = UNCLE_BREW_DATA.customizerOptions.toppings.find(t => t.id === tId);
      if (topping) {
        price += topping.price;
        calories += topping.calories;
      }
    });

    return {
      price: Math.round(price),
      calories: Math.round(calories),
      caffeine
    };
  }

  updatePreview() {
    const stats = this.calculateStats();

    // Update Text Elements with Pop Motion
    const priceEl = document.getElementById("studio-live-price");
    const calEl = document.getElementById("studio-live-cal");
    const cafEl = document.getElementById("studio-live-caf");

    [priceEl, calEl, cafEl].forEach(el => {
      if (!el) return;
      el.classList.remove("stat-pop-active");
      void el.offsetWidth;
      el.classList.add("stat-pop-active");
    });

    if (priceEl) priceEl.textContent = `₱${stats.price}`;
    if (calEl) calEl.textContent = `~${stats.calories} kcal`;
    if (cafEl) cafEl.textContent = stats.caffeine;

    // Trigger Cup Splash Pulse
    const cupSvg = document.querySelector("#brew-studio svg");
    if (cupSvg) {
      cupSvg.classList.remove("cup-splash-active");
      void cupSvg.offsetWidth;
      cupSvg.classList.add("cup-splash-active");
    }

    // SVG Cup Layers Update
    const baseLayer = document.getElementById("svg-base-layer");
    const milkLayer = document.getElementById("svg-milk-layer");
    const iceGroup = document.getElementById("svg-ice-group");
    const pearlsGroup = document.getElementById("svg-pearls-group");
    const drizzleLayer = document.getElementById("svg-drizzle-layer");
    const foamLayer = document.getElementById("svg-foam-layer");

    // Dynamic Base Color & Liquid Fill Level (Regular vs Large)
    if (baseLayer) {
      const topY = this.state.size === "large" ? 58 : 74;
      const heightVal = 310 - topY;
      baseLayer.setAttribute("fill", this.state.base.color);
      baseLayer.setAttribute("y", String(topY));
      baseLayer.setAttribute("height", String(heightVal));
    }

    // Milk / Crema blend with dynamic thickness
    if (milkLayer) {
      const topY = this.state.size === "large" ? 58 : 74;
      const milkHeight = 75 + (this.state.sweetness * 0.28);
      milkLayer.setAttribute("y", String(topY));
      milkLayer.setAttribute("height", String(milkHeight));
      if (this.state.milk.id === "crema-cloud" || this.state.milk.id === "cream-cheese") {
        milkLayer.setAttribute("opacity", "0.95");
        milkLayer.setAttribute("fill", this.state.milk.color);
        if (foamLayer) foamLayer.classList.remove("hidden");
      } else {
        milkLayer.setAttribute("opacity", "0.75");
        milkLayer.setAttribute("fill", this.state.milk.color);
        if (foamLayer) foamLayer.classList.add("hidden");
      }
    }

    // Ice cubes visibility
    if (iceGroup) {
      if (this.state.ice === "no-ice") {
        iceGroup.style.display = "none";
      } else if (this.state.ice === "less-ice") {
        iceGroup.style.display = "block";
        iceGroup.style.opacity = "0.45";
      } else {
        iceGroup.style.display = "block";
        iceGroup.style.opacity = "0.85";
      }
    }

    // Pearls / Toppings visibility with Drop & Bounce Physics
    if (pearlsGroup) {
      if (this.state.toppings.includes("brown-sugar-pearls") || this.state.toppings.includes("crystal-agar") || this.state.toppings.includes("coffee-jelly")) {
        pearlsGroup.style.display = "block";
        pearlsGroup.classList.remove("pearl-drop-anim");
        void pearlsGroup.offsetWidth;
        pearlsGroup.classList.add("pearl-drop-anim");
        pearlsGroup.querySelectorAll("circle").forEach((c, idx) => {
          c.style.animationDelay = `${idx * 35}ms`;
        });
      } else {
        pearlsGroup.style.display = "none";
      }
    }

    // Drizzle
    if (drizzleLayer) {
      if (this.state.toppings.includes("caramel-drizzle")) {
        drizzleLayer.style.display = "block";
      } else {
        drizzleLayer.style.display = "none";
      }
    }
  }

  addToCart() {
    const stats = this.calculateStats();
    const customNameInput = document.getElementById("studio-drink-name");
    const drinkName = customNameInput && customNameInput.value.trim() ? customNameInput.value.trim() : "Custom Crafted Brew";

    const customItem = {
      id: "custom-" + Date.now(),
      name: drinkName,
      badge: "Crafted by You",
      category: "signature-iced",
      price: stats.price,
      regularPrice: stats.price,
      largePrice: stats.price,
      rating: 5.0,
      image: this.state.base.id === "matcha" 
        ? "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=700&q=80"
        : "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=80",
      customDetails: {
        base: this.state.base.name,
        milk: this.state.milk.name,
        sweetness: `${this.state.sweetness}%`,
        ice: this.state.ice.replace("-", " "),
        size: this.state.size === "large" ? "22oz (Large)" : "16oz (Regular)",
        toppings: this.state.toppings.map(tId => {
          const t = UNCLE_BREW_DATA.customizerOptions.toppings.find(item => item.id === tId);
          return t ? t.name : "";
        }).filter(Boolean)
      }
    };

    if (window.brewCart) {
      const addBtn = document.getElementById("btn-add-studio-drink");
      if (window.flyToCart && addBtn) window.flyToCart(addBtn, '🎨');

      window.brewCart.addItem(customItem, 1, customItem.customDetails);
      if (window.confetti) {
        window.confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#D97706', '#F59E0B', '#FBBF24', '#FAF7F2']
        });
      }
      if (window.cafeAudio) window.cafeAudio.playChime('success');
    }
  }
}
