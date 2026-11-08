/**
 * Uncle Brew - Franchise Financial Model & ROI Calculator
 * Calculates daily sales, COGS, labor, operational expenses, net profit, and payback months
 * Features real-time Chart.js doughnut breakdown and package selection.
 */

class FranchiseCalculator {
  constructor() {
    this.selectedPackageId = "cafe-standard";
    this.dailyCups = 350;
    this.avgCupPrice = 85;
    this.chart = null;

    this.init();
  }

  init() {
    this.renderPackageTabs();
    this.bindEvents();
    this.initChart();
    this.recalculate();
  }

  renderPackageTabs() {
    const container = document.getElementById("franchise-package-cards");
    if (!container) return;

    container.innerHTML = UNCLE_BREW_DATA.franchisePackages.map(pkg => {
      const isSelected = pkg.id === this.selectedPackageId;
      return `
        <div data-package="${pkg.id}" class="franchise-pkg-card cursor-pointer p-7 rounded-3xl border transition-all duration-300 relative shadow-sm hover:shadow-md ${isSelected ? 'border-[#C2782A] bg-[#FDF9F4] ring-2 ring-[#C2782A]/20' : 'border-[#E8DDCE] bg-white hover:border-[#C2782A]'}">
          ${pkg.popular ? `<span class="absolute -top-3 left-6 px-3.5 py-1 bg-[#2B160A] text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow">Most Popular</span>` : ''}
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="text-xl font-bold text-[#2B160A]">${pkg.name}</h4>
              <p class="text-xs text-[#634F44] mt-1">${pkg.subtitle}</p>
            </div>
            <div class="text-right">
              <span class="text-xl font-black text-[#C2782A]">${pkg.investmentFormatted}</span>
              <p class="text-[10px] text-[#8E7A6E] font-medium">Turnkey CapEx</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs py-3 my-3 border-y border-[#F2E9DE] text-[#634F44]">
            <div><span class="text-[#8E7A6E]">Space:</span> <span class="font-bold text-[#2B160A]">${pkg.spaceRequired}</span></div>
            <div><span class="text-[#8E7A6E]">Payback:</span> <span class="font-bold text-[#C2782A]">${pkg.estPaybackMonths}</span></div>
          </div>
          <ul class="space-y-2 text-xs text-[#5E2F10] mb-5">
            ${pkg.features.slice(0, 3).map(f => `<li class="flex items-center gap-2"><i data-lucide="check" class="w-3.5 h-3.5 text-[#C2782A] flex-shrink-0"></i> <span>${f}</span></li>`).join("")}
          </ul>
          <button type="button" class="w-full py-3 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-[#2B160A] text-white border-[#2B160A] shadow-md' : 'border-[#E8DDCE] hover:border-[#C2782A] text-[#2B160A] bg-white'}">
            ${isSelected ? 'Selected Package' : 'Select Package'}
          </button>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  bindEvents() {
    const pkgContainer = document.getElementById("franchise-package-cards");
    if (pkgContainer) {
      pkgContainer.addEventListener("click", (e) => {
        const card = e.target.closest("[data-package]");
        if (!card) return;
        this.selectedPackageId = card.getAttribute("data-package");
        const pkg = UNCLE_BREW_DATA.franchisePackages.find(p => p.id === this.selectedPackageId);
        if (pkg) {
          this.dailyCups = pkg.estDailyCups;
          const cupsSlider = document.getElementById("slider-daily-cups");
          if (cupsSlider) cupsSlider.value = this.dailyCups;
        }
        this.renderPackageTabs();
        this.recalculate();
        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      });
    }

    const cupsSlider = document.getElementById("slider-daily-cups");
    if (cupsSlider) {
      cupsSlider.addEventListener("input", (e) => {
        this.dailyCups = parseInt(e.target.value, 10);
        this.recalculate();
      });
    }

    const priceSlider = document.getElementById("slider-avg-price");
    if (priceSlider) {
      priceSlider.addEventListener("input", (e) => {
        this.avgCupPrice = parseInt(e.target.value, 10);
        this.recalculate();
      });
    }

    // Franchise inquiry button
    const openInquiryBtn = document.getElementById("btn-open-franchise-inquiry");
    if (openInquiryBtn) {
      openInquiryBtn.addEventListener("click", () => {
        const modal = document.getElementById("franchise-inquiry-modal");
        if (modal) modal.classList.remove("hidden");
      });
    }

    // Close modal
    const closeBtn = document.getElementById("btn-close-franchise-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        const modal = document.getElementById("franchise-inquiry-modal");
        if (modal) modal.classList.add("hidden");
      });
    }

    // Submit inquiry form
    const form = document.getElementById("franchise-inquiry-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const successBox = document.getElementById("franchise-inquiry-success");

        const packageName = document.getElementById("franchise-package-select")?.value || "Standard Café Branch";
        const fullName = document.getElementById("franchise-name")?.value || "";
        const mobile = document.getElementById("franchise-mobile")?.value || "";
        const email = document.getElementById("franchise-email")?.value || "";
        const targetCity = document.getElementById("franchise-city")?.value || "";
        const hasCommercialSpace = document.querySelector('input[name="has-space"]:checked')?.value === "yes";

        if (window.uncleBrewSupabase) {
          window.uncleBrewSupabase.submitFranchiseInquiry({
            packageName,
            fullName,
            mobile,
            email,
            targetCity,
            hasCommercialSpace
          }).then(res => {
            if (res.success && !res.localOnly) {
              console.log("[UncleBrew] Franchise Inquiry synchronized to Supabase Cloud:", res.data);
            }
          });
        }

        if (successBox) {
          form.classList.add("hidden");
          successBox.classList.remove("hidden");
          if (window.confetti) {
            window.confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
          }
          if (window.cafeAudio) window.cafeAudio.playChime('success');
        }
      });
    }
  }

  initChart() {
    const canvas = document.getElementById("franchise-roi-chart");
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext("2d");
    this.chart = new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Net Profit", "Ingredients & COGS (32%)", "Rent & Utilities (18%)", "Staff Payroll (15%)", "Packaging & Ops (10%)"],
        datasets: [{
          data: [25, 32, 18, 15, 10],
          backgroundColor: ["#C2782A", "#382014", "#5E2F10", "#8E7A6E", "#DCC3AB"],
          borderColor: "#FFFFFF",
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#5E2F10",
              font: { size: 11, family: "Plus Jakarta Sans" },
              boxWidth: 12,
              padding: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ₱${context.raw.toLocaleString()} /mo`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  }

  recalculate() {
    const pkg = UNCLE_BREW_DATA.franchisePackages.find(p => p.id === this.selectedPackageId) || UNCLE_BREW_DATA.franchisePackages[1];
    
    // Sliders display values
    const cupsValEl = document.getElementById("val-daily-cups");
    const priceValEl = document.getElementById("val-avg-price");
    if (cupsValEl) cupsValEl.textContent = `${this.dailyCups} Cups`;
    if (priceValEl) priceValEl.textContent = `₱${this.avgCupPrice}`;

    // Financial formulas (30 days/month average)
    const daysInMonth = 30;
    const monthlyGrossSales = this.dailyCups * this.avgCupPrice * daysInMonth;

    // Costs
    const cogsPercent = 0.32; // 32% Coffee beans, dairy, syrups, ice
    const cogsAmount = monthlyGrossSales * cogsPercent;

    // Fixed / Variable operational estimates
    let staffCount = 2;
    let baseRent = 25000;
    if (pkg.id === "cafe-standard") { staffCount = 3; baseRent = 45000; }
    if (pkg.id === "prime-flagship") { staffCount = 5; baseRent = 80000; }

    const avgSalaryPerStaff = 16000; // Monthly average barista wage
    const laborCost = staffCount * avgSalaryPerStaff;
    const utilitiesCost = baseRent * 0.4;
    const packagingOpsCost = monthlyGrossSales * 0.08; // Cups, lids, napkins, cleaning, POS

    const totalMonthlyOpex = cogsAmount + baseRent + laborCost + utilitiesCost + packagingOpsCost;
    const monthlyNetProfit = Math.max(0, monthlyGrossSales - totalMonthlyOpex);

    // Payback period
    const totalInvestment = pkg.investment;
    const paybackMonths = monthlyNetProfit > 0 ? (totalInvestment / monthlyNetProfit).toFixed(1) : "N/A";
    const annualNet = monthlyNetProfit * 12;
    const annualROI = totalInvestment > 0 ? ((annualNet / totalInvestment) * 100).toFixed(0) : 0;

    // Update UI Metrics
    const grossEl = document.getElementById("calc-gross-monthly");
    const netEl = document.getElementById("calc-net-monthly");
    const paybackEl = document.getElementById("calc-payback-months");
    const roiEl = document.getElementById("calc-roi-annual");

    if (grossEl) grossEl.textContent = `₱${Math.round(monthlyGrossSales).toLocaleString()}`;
    if (netEl) netEl.textContent = `₱${Math.round(monthlyNetProfit).toLocaleString()}`;
    if (paybackEl) paybackEl.textContent = `${paybackMonths} Months`;
    if (roiEl) roiEl.textContent = `${annualROI}%`;

    // Update Chart
    if (this.chart) {
      this.chart.data.datasets[0].data = [
        Math.round(monthlyNetProfit),
        Math.round(cogsAmount),
        Math.round(baseRent + utilitiesCost),
        Math.round(laborCost),
        Math.round(packagingOpsCost)
      ];
      this.chart.update();
    }
  }
}
