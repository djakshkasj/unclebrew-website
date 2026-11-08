/**
 * Uncle Brew - Advanced Motion, Scroll-Driven & Micro-Interaction Engine
 * - ScrollProgressBar & Circular Ring FAB: Live scroll percentage indicator & quick jump
 * - ScrollTriggeredRevealEngine: Directional (up/left/right/scale/flip) scroll-triggered reveals
 * - ScrollTriggeredProductGrid: Row-staggered 3D perspective entrance as product cards enter viewport
 * - ScrollTriggeredStudioPour: Automatic coffee cup fill & boba pearl drop when scrolling into Brew Studio
 * - ScrollParallaxAndSpy: Continuous scroll-linked parallax, sticky header morph, and navbar scroll-spy
 * - Dynamic Product Card 3D Tilt & Light Sheen Glare (#menu-items-grid)
 * - MagneticButtonPhysics: Cursor magnetic pull & rubber-band return
 * - FlyToCartEngine & FloatingAddToast: Parabolic Bezier flight particle + "+1" toast
 * - ClickRippleWave & MouseSpotlightEngine: Tactile radial shockwaves & ambient glow
 */

class MotionSystem {
  constructor() {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cardObserver = null;
    this.revealObserver = null;
    this.init();
  }

  init() {
    if (this.isReducedMotion) {
      this.disableForReducedMotion();
      return;
    }

    this.initScrollProgressAndFab();
    this.initScrollReveal();
    this.initScrollParallaxAndSpy();
    this.refreshDynamicElements();
    this.initHeroParallax();
    this.initCountUp();
    this.initMouseSpotlight();
    this.initClickRipple();
  }

  disableForReducedMotion() {
    document.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-revealed'));
    document.querySelectorAll('[data-scroll-reveal]').forEach(el => el.classList.add('is-scroll-visible'));
    document.querySelectorAll('.scroll-card-item').forEach(el => el.classList.add('is-card-visible'));
  }

  // Re-bind 3D Tilt, Magnetic Physics, and Scroll-Triggered Card Observer whenever products re-render
  refreshDynamicElements() {
    if (this.isReducedMotion) {
      this.disableForReducedMotion();
      return;
    }
    this.observeProductCards();
    this.initMagneticButtons();
    this.initCard3DTilt();
  }

  // 1. TOP SCROLL PROGRESS BAR & FLOATING SCROLL-TO-TOP RING FAB
  initScrollProgressAndFab() {
    if (!document.getElementById('scroll-progress-container')) {
      const barContainer = document.createElement('div');
      barContainer.id = 'scroll-progress-container';
      barContainer.innerHTML = `<div id="scroll-progress-bar"></div>`;
      document.body.prepend(barContainer);
    }

    if (!document.getElementById('scroll-top-fab')) {
      const circumference = 2 * Math.PI * 22; // r=22 => ~138.23
      const fab = document.createElement('button');
      fab.id = 'scroll-top-fab';
      fab.type = 'button';
      fab.setAttribute('aria-label', 'Scroll back to top');
      fab.title = 'Back to Top';
      fab.innerHTML = `
        <svg class="progress-ring" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(232,221,206,0.22)" stroke-width="2.5"></circle>
          <circle id="scroll-fab-ring" cx="26" cy="26" r="22" fill="none" stroke="#C2782A" stroke-width="2.5"
            stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" stroke-linecap="round"></circle>
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      `;
      fab.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.appendChild(fab);
    }
  }

  // 2. DIRECTIONAL SCROLL-TRIGGERED REVEALS & BREW STUDIO POUR TRIGGER
  initScrollReveal() {
    // Also upgrade any legacy .reveal-item elements
    const revealItems = document.querySelectorAll('.reveal-item, [data-scroll-reveal]');

    // Add staggered transition delays to Brew Studio customizer steps
    const studioSteps = document.querySelectorAll('#brew-studio .lg\\:col-span-7 > [data-scroll-reveal]');
    studioSteps.forEach((step, idx) => {
      step.style.transitionDelay = `${idx * 75}ms`;
    });

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('is-revealed', 'is-scroll-visible');

          // If this is the Brew Studio Cup Preview entering the viewport, trigger the live Cup Pour + Pearl Drop!
          if (el.id === 'studio-cup-preview-card') {
            this.triggerStudioScrollPour(el);
          }
        }
      });
    }, {
      rootMargin: '0px 0px -55px 0px',
      threshold: 0.12
    });

    revealItems.forEach(el => this.revealObserver.observe(el));
  }

  triggerStudioScrollPour(cupCardEl) {
    if (cupCardEl.dataset.pourTriggered) return;
    cupCardEl.dataset.pourTriggered = '1';

    const svgEl = cupCardEl.querySelector('svg');
    const pearlsGroup = document.getElementById('svg-pearls-group');

    if (svgEl) {
      svgEl.classList.add('cup-scroll-pour');
      setTimeout(() => svgEl.classList.remove('cup-scroll-pour'), 1200);
    }

    if (pearlsGroup && pearlsGroup.style.display !== 'none') {
      pearlsGroup.classList.remove('pearl-drop-anim');
      void pearlsGroup.offsetWidth;
      pearlsGroup.classList.add('pearl-drop-anim');
      pearlsGroup.querySelectorAll('circle').forEach((c, idx) => {
        c.style.animationDelay = `${250 + idx * 45}ms`;
      });
    }
  }

  // 3. SCROLL-TRIGGERED 3D PRODUCT CARD GRID REVEAL
  observeProductCards() {
    if (this.cardObserver) {
      this.cardObserver.disconnect();
    }

    const cards = document.querySelectorAll('#menu-items-grid .scroll-card-item');
    if (!cards.length) return;

    this.cardObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const idx = parseInt(card.dataset.cardIndex || '0', 10);
          // Stagger by column position (0..3) so each row cascades left-to-right as you scroll!
          const colDelay = (idx % 4) * 75;
          card.style.transitionDelay = `${colDelay}ms`;
          card.classList.add('is-card-visible');

          // Clear transitionDelay after entrance so 3D hover tilt remains instant
          setTimeout(() => {
            card.style.transitionDelay = '0ms';
          }, 750 + colDelay);

          obs.unobserve(card);
        }
      });
    }, {
      rootMargin: '0px 0px -30px 0px',
      threshold: 0.08
    });

    cards.forEach(card => this.cardObserver.observe(card));
  }

  // 4. CONTINUOUS SCROLL-LINKED PARALLAX, HEADER MORPH & NAVBAR SCROLL-SPY
  initScrollParallaxAndSpy() {
    const progressBar = document.getElementById('scroll-progress-bar');
    const fab = document.getElementById('scroll-top-fab');
    const fabRing = document.getElementById('scroll-fab-ring');
    const header = document.querySelector('header');
    const parallaxEls = document.querySelectorAll('[data-parallax-speed]');
    const spyLinks = document.querySelectorAll('[data-scroll-spy]');
    const circumference = 2 * Math.PI * 22;

    let ticking = false;

    const updateOnScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

      // 4a. Top Progress Bar
      if (progressBar) {
        progressBar.style.width = `${(progress * 100).toFixed(2)}%`;
      }

      // 4b. Floating Scroll-to-Top FAB & SVG Ring
      if (fab) {
        if (scrollY > 320) {
          fab.classList.add('is-visible');
        } else {
          fab.classList.remove('is-visible');
        }
      }
      if (fabRing) {
        const offset = circumference - progress * circumference;
        fabRing.style.strokeDashoffset = `${offset}`;
      }

      // 4c. Sticky Header Compact Morph
      if (header) {
        if (scrollY > 36) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
      }

      // 4d. Multi-plane Scroll Parallax Elements
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallaxSpeed || '0.1');
        const yOffset = scrollY * speed;
        el.style.transform = `translate3d(0, ${yOffset.toFixed(1)}px, 0)`;
      });

      // 4e. Scroll-Spy Active Section Highlight
      if (spyLinks.length) {
        const studioSection = document.getElementById('brew-studio');
        let activeId = 'menu';
        if (studioSection) {
          const rect = studioSection.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.42) {
            activeId = 'brew-studio';
          }
        }
        spyLinks.forEach(link => {
          if (link.dataset.scrollSpy === activeId) {
            link.classList.add('active-section-link');
          } else {
            link.classList.remove('active-section-link');
          }
        });
      }

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    }, { passive: true });

    // Run once on load
    updateOnScroll();
  }

  // 5. MAGNETIC BUTTON MICRO-INTERACTION
  initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn, [data-magnetic], .category-pill, #btn-add-studio-drink');

    magneticBtns.forEach(btn => {
      if (btn.dataset.magneticBound) return;
      btn.dataset.magneticBound = '1';

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.28;
        const deltaY = (e.clientY - centerY) * 0.28;

        btn.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.04)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0) scale(1)';
      });
    });
  }

  // 6. 3D CARD HOVER TILT WITH DYNAMIC GLARE
  initCard3DTilt() {
    const cards = document.querySelectorAll('.tilt-card, [data-tilt], #menu-items-grid > div');

    cards.forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = '1';
      card.classList.add('tilt-card');

      if (!card.querySelector('.tilt-glare')) {
        const glare = document.createElement('div');
        glare.className = 'tilt-glare';
        card.appendChild(glare);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = -((y - centerY) / centerY) * 7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        card.style.setProperty('--glare-x', `${x}px`);
        card.style.setProperty('--glare-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // 7. HERO 3D MULTI-PLANE PARALLAX (For Landing Page)
  initHeroParallax() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    const showcaseCard = heroSection.querySelector('.aspect-square, .aspect-\\[4\\/5\\]');
    const badges = heroSection.querySelectorAll('.float-badge, .float-badge-rev');

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;

      if (showcaseCard) {
        const rotateY = xNorm * 10;
        const rotateX = -yNorm * 10;
        showcaseCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }

      badges.forEach((badge, idx) => {
        const factor = (idx + 1) * 16;
        badge.style.transform = `translate3d(${xNorm * factor}px, ${yNorm * factor}px, 20px)`;
      });
    });

    heroSection.addEventListener('mouseleave', () => {
      if (showcaseCard) showcaseCard.style.transform = '';
      badges.forEach(badge => badge.style.transform = '');
    });
  }

  // 8. STATISTIC NUMBER COUNT-UP ANIMATION
  initCountUp() {
    const statCards = document.querySelectorAll('#hero .grid-cols-2 .p-4');
    if (!statCards.length) return;

    const stats = [
      { el: statCards[0]?.querySelector('div:first-child'), target: 150, suffix: '+' },
      { el: statCards[1]?.querySelector('div:first-child'), target: 35, suffix: 'K+' },
      { el: statCards[2]?.querySelector('div:first-child'), target: 100, suffix: '%' },
      { el: statCards[3]?.querySelector('div:first-child'), target: 4.9, suffix: ' ★', isDecimal: true }
    ];

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stats.forEach(s => {
            if (s.el) this.animateNumber(s.el, s.target, s.suffix, s.isDecimal);
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });

    if (statCards[0]) observer.observe(statCards[0]);
  }

  animateNumber(el, target, suffix, isDecimal = false) {
    const duration = 1600;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = isDecimal ? (ease * target).toFixed(1) : Math.round(ease * target);
      el.textContent = `${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  // 9. AMBIENT MOUSE SPOTLIGHT OVERLAY
  initMouseSpotlight() {
    if (window.innerWidth < 1024) return;

    let spotlight = document.getElementById('mouse-spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.id = 'mouse-spotlight';
      document.body.appendChild(spotlight);
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    const animateSpotlight = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(animateSpotlight);
    };

    requestAnimationFrame(animateSpotlight);
  }

  // 10. CLICK RIPPLE SHOCKWAVE ON BUTTONS & CARDS
  initClickRipple() {
    document.addEventListener('click', (e) => {
      const interactive = e.target.closest('button, a, label, .category-pill');
      if (!interactive) return;

      const ripple = document.createElement('div');
      ripple.className = 'click-ripple-wave';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);

      setTimeout(() => ripple.remove(), 520);
    });
  }

  // 11. FLOATING "+1 ADDED" TOAST PILL
  spawnFloatingToast(sourceEl, text = '+1 Added!') {
    if (!sourceEl || this.isReducedMotion) return;
    const rect = sourceEl.getBoundingClientRect();
    const toast = document.createElement('div');
    toast.className = 'floating-add-toast';
    toast.textContent = text;
    toast.style.left = `${rect.left + rect.width / 2}px`;
    toast.style.top = `${rect.top - 6}px`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 880);
  }

  // 12. PARABOLIC FLIGHT TO CART ANIMATION
  flyToCart(sourceElement, icon = '☕') {
    if (!sourceElement || this.isReducedMotion) return;

    const cartBtn = document.querySelector('.btn-open-cart');
    if (!cartBtn) return;

    const srcRect = sourceElement.getBoundingClientRect();
    const dstRect = cartBtn.getBoundingClientRect();

    const startX = srcRect.left + srcRect.width / 2;
    const startY = srcRect.top + srcRect.height / 2;
    const endX = dstRect.left + dstRect.width / 2;
    const endY = dstRect.top + dstRect.height / 2;

    const controlX = (startX + endX) / 2;
    const controlY = Math.min(startY, endY) - 140;

    const particle = document.createElement('div');
    particle.className = 'flight-particle';
    particle.innerHTML = `<span>${icon}</span>`;
    document.body.appendChild(particle);

    const duration = 700;
    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      const currentX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * endX;
      const currentY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;
      const scale = 1.15 - (t * 0.45);
      const rotate = t * 360;

      particle.style.left = `${currentX}px`;
      particle.style.top = `${currentY}px`;
      particle.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        particle.remove();
        cartBtn.classList.remove('cart-pop-active');
        void cartBtn.offsetWidth;
        cartBtn.classList.add('cart-pop-active');

        const badge = cartBtn.querySelector('.cart-count-badge');
        if (badge) {
          badge.classList.remove('cart-pop-active');
          void badge.offsetWidth;
          badge.classList.add('cart-pop-active');
        }
      }
    };

    requestAnimationFrame(frame);
  }
}

window.flyToCart = function(sourceEl, icon) {
  if (window.motionSystem) {
    window.motionSystem.flyToCart(sourceEl, icon);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.motionSystem = new MotionSystem();
});
