/**
 * Uncle Brew - Advanced Motion & Micro-Interaction Engine
 * - ScrollRevealEngine: Staggered spring entrance on scroll
 * - MagneticButtonPhysics: Cursor magnetic pull & rubber-band return
 * - HeroParallaxEngine: 3D multi-plane mouse parallax
 * - CountUpEngine: Eased numeric statistics animation
 * - FlyToCartEngine: Parabolic flight particle animation from button to cart
 * - Card3DTiltEngine: 3D tilt with real-time dynamic light sheen glare
 * - MouseSpotlightEngine: Ambient warm caramel cursor spotlight
 */

class MotionSystem {
  constructor() {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    if (this.isReducedMotion) {
      this.disableForReducedMotion();
      return;
    }

    this.initScrollReveal();
    this.initMagneticButtons();
    this.initHeroParallax();
    this.initCountUp();
    this.initCard3DTilt();
    this.initMouseSpotlight();
    this.hookCartAdditions();
  }

  disableForReducedMotion() {
    document.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-revealed'));
  }

  // 1. SCROLL-DRIVEN STAGGERED REVEAL
  initScrollReveal() {
    // Automatically flag elements that need entrance animation
    const targets = document.querySelectorAll(
      '.reveal-item, section > div, .menu-card, #barista-lab .bg-\\[\\#FAF7F2\\], #mood-finder .bg-\\[\\#FAF7F2\\], #loyalty-stamps-grid'
    );

    targets.forEach((el, index) => {
      if (!el.classList.contains('reveal-item') && !el.closest('header') && !el.closest('aside')) {
        el.classList.add('reveal-item');
        // Add subtle stagger based on child order
        const siblingIndex = Array.from(el.parentNode.children).indexOf(el);
        if (siblingIndex % 4 === 1) el.classList.add('delay-75');
        else if (siblingIndex % 4 === 2) el.classList.add('delay-150');
        else if (siblingIndex % 4 === 3) el.classList.add('delay-225');
      }
    });

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.08
    });

    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
  }

  // 2. MAGNETIC BUTTON MICRO-INTERACTION
  initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn, [data-magnetic]');

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.32;
        const deltaY = (e.clientY - centerY) * 0.32;

        btn.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.03)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0) scale(1)';
      });
    });
  }

  // 3. HERO 3D MULTI-PLANE PARALLAX
  initHeroParallax() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    const showcaseCard = heroSection.querySelector('.aspect-square');
    const badges = heroSection.querySelectorAll('.aspect-square .absolute.rounded-2xl');
    const steamWisps = heroSection.querySelectorAll('.steam-wisp, .steam-wisp-2, .steam-wisp-3');

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;

      if (showcaseCard) {
        const rotateY = xNorm * 12;
        const rotateX = -yNorm * 12;
        showcaseCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
      }

      badges.forEach((badge, idx) => {
        const factor = (idx + 1) * 18;
        badge.style.transform = `translate3d(${xNorm * factor}px, ${yNorm * factor}px, 20px)`;
      });

      steamWisps.forEach((wisp, idx) => {
        const factor = (idx + 1) * -12;
        wisp.style.transform = `translateX(${xNorm * factor}px)`;
      });
    });

    heroSection.addEventListener('mouseleave', () => {
      if (showcaseCard) showcaseCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      badges.forEach(badge => badge.style.transform = 'translate3d(0, 0, 0)');
      steamWisps.forEach(wisp => wisp.style.transform = 'translateX(0)');
    });
  }

  // 4. STATISTIC NUMBER COUNT-UP ANIMATION
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
    const duration = 1800;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = isDecimal ? (ease * target).toFixed(1) : Math.round(ease * target);
      el.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  // 5. 3D CARD HOVER TILT WITH DYNAMIC GLARE
  initCard3DTilt() {
    const cards = document.querySelectorAll(
      '.tilt-card, [data-tilt], #barista-lab .border-2, #franchise .rounded-3xl, #menu-grid > div'
    );

    cards.forEach(card => {
      card.classList.add('tilt-card');

      // Create glare overlay if not present
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

        const rotateX = -((y - centerY) / centerY) * 8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        card.style.setProperty('--glare-x', `${x}px`);
        card.style.setProperty('--glare-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // 6. AMBIENT MOUSE SPOTLIGHT OVERLAY
  initMouseSpotlight() {
    if (window.innerWidth < 1024) return; // Desktop only

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

    // Smooth lerp frame loop
    const animateSpotlight = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(animateSpotlight);
    };

    requestAnimationFrame(animateSpotlight);
  }

  // 7. HOOK CART ADDITIONS FOR FLY-TO-CART MOTION
  hookCartAdditions() {
    // Observe cart drawer additions or hook global cart
    const origAddItem = window.BrewCart?.prototype?.addItem;
    if (origAddItem && !window.BrewCart.prototype._hookedMotion) {
      const self = this;
      window.BrewCart.prototype.addItem = function(product, qty, customDetails) {
        // Find triggering button if active
        const activeBtn = document.activeElement;
        if (activeBtn && (activeBtn.tagName === 'BUTTON' || activeBtn.tagName === 'A')) {
          self.flyToCart(activeBtn);
        }
        return origAddItem.apply(this, arguments);
      };
      window.BrewCart.prototype._hookedMotion = true;
    }
  }

  // PARABOLIC FLIGHT TO CART ANIMATION
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

    // Highest arc vertex
    const controlX = (startX + endX) / 2;
    const controlY = Math.min(startY, endY) - 130;

    const particle = document.createElement('div');
    particle.className = 'flight-particle';
    particle.innerHTML = `<span>${icon}</span>`;
    document.body.appendChild(particle);

    const duration = 750;
    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Quadratic Bezier Formula: B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
      const currentX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * endX;
      const currentY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;
      const scale = 1 - (t * 0.4); // shrinks as it enters cart
      const rotate = t * 360;

      particle.style.left = `${currentX}px`;
      particle.style.top = `${currentY}px`;
      particle.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        particle.remove();
        // Cart button bounce shockwave
        cartBtn.classList.remove('cart-pop-active');
        void cartBtn.offsetWidth; // trigger reflow
        cartBtn.classList.add('cart-pop-active');

        const badge = cartBtn.querySelector('.cart-count-badge');
        if (badge) {
          badge.classList.remove('cart-pop-active');
          void badge.offsetWidth;
          badge.classList.add('cart-pop-active');
        }

        if (window.cafeAudio) window.cafeAudio.playChime('pop');
      }
    };

    requestAnimationFrame(frame);
  }
}

// Global helper for manual flight trigger
window.flyToCart = function(sourceEl, icon) {
  if (window.motionSystem) {
    window.motionSystem.flyToCart(sourceEl, icon);
  }
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.motionSystem = new MotionSystem();
});
