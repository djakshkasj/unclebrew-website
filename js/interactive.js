/**
 * Uncle Brew - Advanced Interactive Experiences Module
 * 1. BaristaLab: Interactive bean grind, tamp, and espresso lever pull simulation
 * 2. BrewMoodQuiz: Dynamic flavor & craving matcher quiz with instant recommendation
 * 3. Cup3DParallax: 3D perspective mouse tilt & interactive liquid bubble poppers
 * 4. GeoStoreLocator: Real-time straight-line distance calculation to nearest store
 */

// ==========================================
// 1. BARISTA LAB: ESPRESSO EXTRACTION STATION
// ==========================================
class BaristaLab {
  constructor() {
    this.currentStep = 1; // 1: grind, 2: tamp, 3: pull, 4: complete
    this.isGrinding = false;
    this.isTamping = false;
    this.isExtracting = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    const grindBtn = document.getElementById("barista-grind-btn");
    const tampBtn = document.getElementById("barista-tamp-btn");
    const pullBtn = document.getElementById("barista-pull-btn");
    const resetBtn = document.getElementById("barista-reset-btn");
    const applyVoucherBtn = document.getElementById("barista-apply-voucher-btn");

    if (grindBtn) {
      grindBtn.addEventListener("click", () => this.handleGrind());
    }
    if (tampBtn) {
      tampBtn.addEventListener("click", () => this.handleTamp());
    }
    if (pullBtn) {
      pullBtn.addEventListener("click", () => this.handlePull());
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.reset());
    }
    if (applyVoucherBtn) {
      applyVoucherBtn.addEventListener("click", () => this.applyRewardVoucher());
    }
  }

  handleGrind() {
    if (this.currentStep !== 1 || this.isGrinding) return;
    this.isGrinding = true;

    if (window.cafeAudio) window.cafeAudio.playChime('grind');

    const fillMeter = document.getElementById("barista-grind-meter");
    const beansAnim = document.getElementById("barista-beans-anim");

    if (beansAnim) beansAnim.classList.add("animate-bounce");
    if (fillMeter) {
      fillMeter.style.width = "0%";
      setTimeout(() => { fillMeter.style.width = "100%"; }, 50);
    }

    setTimeout(() => {
      this.isGrinding = false;
      this.currentStep = 2;
      this.updateUI();
      if (window.cafeAudio) window.cafeAudio.playChime('pop');
    }, 1200);
  }

  handleTamp() {
    if (this.currentStep !== 2 || this.isTamping) return;
    this.isTamping = true;

    const tamper = document.getElementById("barista-tamper-tool");
    if (tamper) {
      tamper.classList.add("translate-y-8", "scale-95");
    }

    if (window.cafeAudio) window.cafeAudio.playChime('tamp');

    setTimeout(() => {
      if (tamper) tamper.classList.remove("translate-y-8", "scale-95");
      this.isTamping = false;
      this.currentStep = 3;
      this.updateUI();
      if (window.cafeAudio) window.cafeAudio.playChime('pop');
    }, 800);
  }

  handlePull() {
    if (this.currentStep !== 3 || this.isExtracting) return;
    this.isExtracting = true;

    const lever = document.getElementById("barista-lever");
    const stream = document.getElementById("barista-espresso-stream");
    const crema = document.getElementById("barista-crema-cup");

    if (lever) lever.classList.add("rotate-45");
    if (stream) stream.classList.remove("hidden");
    if (crema) crema.style.height = "0%";

    if (window.cafeAudio) window.cafeAudio.playChime('extraction');

    // Pouring duration
    setTimeout(() => {
      if (crema) crema.style.height = "85%";
    }, 300);

    setTimeout(() => {
      if (stream) stream.classList.add("hidden");
      if (lever) lever.classList.remove("rotate-45");
      this.isExtracting = false;
      this.currentStep = 4;
      this.updateUI();

      if (window.confetti) {
        window.confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C2782A', '#D4883B', '#FAF7F2', '#24140B']
        });
      }
      if (window.cafeAudio) window.cafeAudio.playChime('success');
    }, 2200);
  }

  reset() {
    this.currentStep = 1;
    const fillMeter = document.getElementById("barista-grind-meter");
    const crema = document.getElementById("barista-crema-cup");
    if (fillMeter) fillMeter.style.width = "0%";
    if (crema) crema.style.height = "0%";
    this.updateUI();
    if (window.cafeAudio) window.cafeAudio.playChime('pop');
  }

  applyRewardVoucher() {
    if (window.brewCart) {
      // Add voucher code UNCLE39 automatically
      const res = window.brewCart.applyVoucher("UNCLE39");
      // Add Spanish Latte
      const latte = UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-spanish-latte");
      if (latte) {
        window.brewCart.addItem(latte, 1, { size: "22oz (Large)", sweetness: "50%", ice: "Standard Ice" });
      }
      window.brewCart.openDrawer();
      if (window.cafeAudio) window.cafeAudio.playChime('success');
    }
  }

  updateUI() {
    const step1Box = document.getElementById("barista-step-1-box");
    const step2Box = document.getElementById("barista-step-2-box");
    const step3Box = document.getElementById("barista-step-3-box");
    const step4Box = document.getElementById("barista-step-4-box");

    const grindBtn = document.getElementById("barista-grind-btn");
    const tampBtn = document.getElementById("barista-tamp-btn");
    const pullBtn = document.getElementById("barista-pull-btn");

    if (step1Box) step1Box.classList.toggle("opacity-40", this.currentStep !== 1);
    if (step2Box) step2Box.classList.toggle("opacity-40", this.currentStep !== 2);
    if (step3Box) step3Box.classList.toggle("opacity-40", this.currentStep !== 3);
    if (step4Box) step4Box.classList.toggle("hidden", this.currentStep !== 4);

    if (grindBtn) grindBtn.disabled = this.currentStep !== 1;
    if (tampBtn) tampBtn.disabled = this.currentStep !== 2;
    if (pullBtn) pullBtn.disabled = this.currentStep !== 3;

    const statusBadge = document.getElementById("barista-status-badge");
    if (statusBadge) {
      if (this.currentStep === 1) statusBadge.textContent = "Step 1: Grind Fresh Highland Beans";
      else if (this.currentStep === 2) statusBadge.textContent = "Step 2: Tamp Portafilter Puck";
      else if (this.currentStep === 3) statusBadge.textContent = "Step 3: Pull 9-Bar Extraction Lever";
      else statusBadge.textContent = "Golden Shot Extracted! Crema Perfected ☕";
    }
  }
}

// ==========================================
// 2. BREW MOOD QUIZ: FLAVOR & CRAVING FINDER
// ==========================================
class BrewMoodQuiz {
  constructor() {
    this.step = 1;
    this.answers = {
      vibe: "energy",
      temp: "iced",
      milk: "dairy"
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderStep();
  }

  bindEvents() {
    // Option clicks inside quiz options container
    const quizContainer = document.getElementById("mood-quiz-options");
    if (quizContainer) {
      quizContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-quiz-choice]");
        if (!btn) return;

        const val = btn.dataset.quizChoice;
        if (this.step === 1) {
          this.answers.vibe = val;
          this.step = 2;
        } else if (this.step === 2) {
          this.answers.temp = val;
          this.step = 3;
        } else if (this.step === 3) {
          this.answers.milk = val;
          this.step = 4; // Results
        }

        if (window.cafeAudio) window.cafeAudio.playChime('chord');
        this.renderStep();
      });
    }

    // Retake quiz button
    const restartBtn = document.getElementById("btn-restart-quiz");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.step = 1;
        this.renderStep();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    }
  }

  getRecommendation() {
    const { vibe, temp, milk } = this.answers;

    if (vibe === "sweet" || milk === "cream-cheese") {
      return UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-cheesecake-redvelvet") || UNCLE_BREW_DATA.menuItems[0];
    }
    if (vibe === "frappe" || temp === "blended") {
      return UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-frappe-javachip") || UNCLE_BREW_DATA.menuItems[1];
    }
    if (vibe === "matcha" || milk === "oat") {
      return UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-matcha-espresso") || UNCLE_BREW_DATA.menuItems[2];
    }
    if (temp === "hot" && milk === "black") {
      return UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-americano-hot") || UNCLE_BREW_DATA.menuItems[3];
    }
    if (temp === "hot") {
      return UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-cafe-latte-hot") || UNCLE_BREW_DATA.menuItems[4];
    }

    // Default darling
    return UNCLE_BREW_DATA.menuItems.find(i => i.id === "ub-spanish-latte") || UNCLE_BREW_DATA.menuItems[0];
  }

  renderStep() {
    const questionEl = document.getElementById("mood-quiz-question");
    const progressEl = document.getElementById("mood-quiz-progress");
    const optionsContainer = document.getElementById("mood-quiz-options");
    const resultBox = document.getElementById("mood-quiz-result");

    if (this.step <= 3) {
      if (optionsContainer) optionsContainer.classList.remove("hidden");
      if (resultBox) resultBox.classList.add("hidden");
      if (progressEl) progressEl.style.width = `${(this.step / 3) * 100}%`;
    }

    if (this.step === 1) {
      if (questionEl) questionEl.textContent = "1. What is your current energy & craving?";
      if (optionsContainer) {
        optionsContainer.innerHTML = `
          <button type="button" data-quiz-choice="energy" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">⚡</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Need Fast Coffee Gasoline</h4>
            <p class="text-xs text-[#634F44] mt-1">Ready to power through study, BPO shift, or meetings.</p>
          </button>
          <button type="button" data-quiz-choice="chill" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🛋️</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Cozy, Smooth & Relaxed</h4>
            <p class="text-xs text-[#634F44] mt-1">Gentle warmth, balanced crema, unhurried afternoon.</p>
          </button>
          <button type="button" data-quiz-choice="matcha" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🎨</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Earthy, Zen & Creative</h4>
            <p class="text-xs text-[#634F44] mt-1">Uji green tea matcha or specialty artisan infusions.</p>
          </button>
          <button type="button" data-quiz-choice="sweet" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🍰</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Sweet Tooth Comfort</h4>
            <p class="text-xs text-[#634F44] mt-1">Caramel drizzle, chocolate chunks, or boba pearls.</p>
          </button>
        `;
      }
    } else if (this.step === 2) {
      if (questionEl) questionEl.textContent = "2. How would you like it served?";
      if (optionsContainer) {
        optionsContainer.innerHTML = `
          <button type="button" data-quiz-choice="iced" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🧊</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Iced & Cold-Brewed</h4>
            <p class="text-xs text-[#634F44] mt-1">Crisp, refreshing, chilled over slow-melting ice.</p>
          </button>
          <button type="button" data-quiz-choice="hot" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">☕</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Piping Hot Microfoam</h4>
            <p class="text-xs text-[#634F44] mt-1">Steamed silky milk with rich espresso crema crown.</p>
          </button>
          <button type="button" data-quiz-choice="blended" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🍧</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Ice Blended Frappe</h4>
            <p class="text-xs text-[#634F44] mt-1">Crushed frappe topped with whipped cream peak.</p>
          </button>
        `;
      }
    } else if (this.step === 3) {
      if (questionEl) questionEl.textContent = "3. Your preferred milk or style?";
      if (optionsContainer) {
        optionsContainer.innerHTML = `
          <button type="button" data-quiz-choice="dairy" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🥛</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Farm Whole Dairy</h4>
            <p class="text-xs text-[#634F44] mt-1">Classic rich creaminess that harmonizes espresso.</p>
          </button>
          <button type="button" data-quiz-choice="oat" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🌾</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Barista Oat Milk (Plant-based)</h4>
            <p class="text-xs text-[#634F44] mt-1">Naturally sweet, toasted cereal notes, dairy-free.</p>
          </button>
          <button type="button" data-quiz-choice="cream-cheese" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🧀</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Savory Cream Cheese Foam</h4>
            <p class="text-xs text-[#634F44] mt-1">Velvety salted cheesecake froth float.</p>
          </button>
          <button type="button" data-quiz-choice="black" class="p-5 rounded-2xl border border-[#E8DDCE] bg-white hover:border-[#C2782A] hover:shadow-md transition-all text-left group">
            <span class="text-2xl block mb-2">🖤</span>
            <h4 class="text-sm font-bold text-[#24140B] group-hover:text-[#C2782A]">Pure Highland Black</h4>
            <p class="text-xs text-[#634F44] mt-1">Zero milk, pure notes of dark chocolate & cacao.</p>
          </button>
        `;
      }
    } else if (this.step === 4) {
      // Show Match Result
      const match = this.getRecommendation();
      if (optionsContainer) optionsContainer.classList.add("hidden");
      if (resultBox) {
        resultBox.classList.remove("hidden");
        document.getElementById("quiz-match-img").src = match.image;
        document.getElementById("quiz-match-name").textContent = match.name;
        document.getElementById("quiz-match-desc").textContent = match.description;
        document.getElementById("quiz-match-price").textContent = `₱${match.price}`;
        document.getElementById("quiz-match-cal").textContent = match.calories;
        document.getElementById("quiz-match-caf").textContent = match.caffeine;

        const orderBtn = document.getElementById("btn-order-quiz-match");
        if (orderBtn) {
          orderBtn.onclick = () => {
            if (window.brewCart) {
              window.brewCart.addItem(match, 1, { size: "22oz (Large)", sweetness: "50%", ice: "Standard Ice" });
              window.brewCart.openDrawer();
            }
          };
        }
      }
    }
  }
}

// ==========================================
// 3. 3D PARALLAX & CUP INTERACTIVE PHYSICS
// ==========================================
class Cup3DParallax {
  constructor() {
    this.init();
  }

  init() {
    const card = document.querySelector("#brew-studio .sticky");
    if (!card) return;

    card.style.transformStyle = "preserve-3d";
    card.style.transition = "transform 0.15s ease-out";

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - (rect.width / 2);
      const y = e.clientY - rect.top - (rect.height / 2);

      const rotateX = -(y / rect.height) * 14;
      const rotateY = (x / rect.width) * 14;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });

    // Make pearls clickable to play cute popping sounds!
    const pearls = document.querySelectorAll("#svg-pearls-group circle");
    pearls.forEach(circle => {
      circle.style.cursor = "pointer";
      circle.addEventListener("click", (e) => {
        e.stopPropagation();
        circle.style.transform = "scale(1.4)";
        setTimeout(() => { circle.style.transform = "scale(1)"; }, 200);
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    });
  }
}

// ==========================================
// 4. GEO STORE LOCATOR: NEAREST BRANCH FINDER
// ==========================================
class GeoStoreLocator {
  constructor() {
    this.init();
  }

  init() {
    const geoBtn = document.getElementById("btn-find-nearest-store");
    if (geoBtn) {
      geoBtn.addEventListener("click", () => this.locateUser());
    }
  }

  // Haversine formula to calculate km between two GPS coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  locateUser() {
    const geoBtn = document.getElementById("btn-find-nearest-store");
    const statusText = document.getElementById("geo-status-text");

    if (!navigator.geolocation) {
      if (statusText) statusText.textContent = "Geolocation is not supported by your browser.";
      return;
    }

    if (geoBtn) geoBtn.disabled = true;
    if (statusText) statusText.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        let nearest = null;
        let shortestDist = Infinity;

        UNCLE_BREW_DATA.branches.forEach(branch => {
          const dist = this.calculateDistance(userLat, userLon, branch.coordinates[0], branch.coordinates[1]);
          branch.distanceKm = dist;
          if (dist < shortestDist) {
            shortestDist = dist;
            nearest = branch;
          }
        });

        // Sort branches by proximity
        UNCLE_BREW_DATA.branches.sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));

        if (window.brewApp) {
          window.brewApp.renderStoreList();
          if (nearest) {
            window.brewApp.focusStore(nearest.id);
          }
        }

        if (statusText && nearest) {
          statusText.innerHTML = `📍 Nearest Branch: <strong>${nearest.name}</strong> (${shortestDist.toFixed(1)} km away)`;
        }
        if (geoBtn) geoBtn.disabled = false;
        if (window.cafeAudio) window.cafeAudio.playChime('success');
      },
      (err) => {
        // Fallback: Default to Cebu IT Park Flagship
        if (statusText) statusText.textContent = "Showing closest branches to Cebu IT Park Flagship.";
        if (geoBtn) geoBtn.disabled = false;
        if (window.brewApp) window.brewApp.focusStore("cebu-it-park");
      },
      { timeout: 8000 }
    );
  }
}

// Bootstrap Interactive Modules
document.addEventListener("DOMContentLoaded", () => {
  window.baristaLab = new BaristaLab();
  window.brewMoodQuiz = new BrewMoodQuiz();
  window.cup3DParallax = new Cup3DParallax();
  window.geoStoreLocator = new GeoStoreLocator();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});
