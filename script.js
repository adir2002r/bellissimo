/* ═══════════════════════════════════════════════════════════
   BELLISSIMO – Heladería Artesanal
   script.js — Funcionalidades completas
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────
   1. UTILIDADES
───────────────────────────────────────────────────────── */
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/** Muestra un toast de notificación */
function showToast(msg, duration = 2800) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ─────────────────────────────────────────────────────────
   2. NAVBAR — scroll + hamburguesa + active link
───────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar    = $('#navbar');
  const burger    = $('#burgerBtn');
  const navMenu   = $('#navMenu');
  const navLinks  = $$('.navbar__link');

  // Sombra al hacer scroll
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveLink();
  }, { passive: true });

  // Hamburguesa
  burger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Cierra el menú al hacer click en un link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Cierra el menú al hacer click fuera
  document.addEventListener('click', e => {
    if (!navMenu.contains(e.target) && !burger.contains(e.target)) {
      navMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Link activo según sección visible
  function updateActiveLink() {
    const sections = $$('section[id], div[id]');
    let current = '';
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom > 100) current = sec.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active-link', href === current);
    });
  }

  // Smooth scroll para todos los enlaces ancla
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
                              .getPropertyValue('--navbar-h'), 10) || 72;
      window.scrollTo({
        top: target.offsetTop - navH + 1,
        behavior: 'smooth'
      });
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   3. SCROLL-TO-TOP
───────────────────────────────────────────────────────── */
(function initScrollTop() {
  const btn = $('#scrollTopBtn');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ─────────────────────────────────────────────────────────
   4. REVEAL ON SCROLL (Intersection Observer)
───────────────────────────────────────────────────────── */
(function initReveal() {
  const elements = $$('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────────────────────
   5. FILTROS DEL MENÚ
───────────────────────────────────────────────────────── */
(function initMenuFilters() {
  const filters = $$('.menu__filter');
  const cards   = $$('.product-card');

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualiza clase activa
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.classList.remove('hidden');
          // Stagger de entrada
          card.style.transitionDelay = `${(i % 6) * 55}ms`;
          // Forzar re-render para animación
          requestAnimationFrame(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity .4s ease, transform .4s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          });
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   6. CARRITO DE COMPRAS
───────────────────────────────────────────────────────── */
const Cart = (function () {
  let items = [];    // { name, price, qty, icon }
  let isOpen = false;

  const cartPanel   = $('#cartPanel');
  const cartOverlay = $('#cartOverlay');
  const cartList    = $('#cartList');
  const cartCount   = $('#cartCount');
  const cartTotal   = $('#cartTotal');
  const cartBubble  = $('#cartBubble');
  const cartClose   = $('#cartClose');
  const clearBtn    = $('#clearCartBtn');
  const checkoutBtn = $('#checkoutBtn');

  /* Abre / cierra el panel */
  function togglePanel(forceOpen) {
    isOpen = forceOpen !== undefined ? forceOpen : !isOpen;
    cartPanel.classList.toggle('open', isOpen);
    cartOverlay.classList.toggle('active', isOpen);
    cartPanel.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  /* Renderiza la lista */
  function render() {
    cartList.innerHTML = '';

    if (!items.length) {
      cartList.innerHTML = '<li class="cart-panel__empty">Tu carrito está vacío 🍦</li>';
    } else {
      items.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <span class="cart-item__icon">${item.icon}</span>
          <div class="cart-item__info">
            <div class="cart-item__name">${item.name}</div>
            <div class="cart-item__price">S/ ${(item.price * item.qty).toFixed(2)}</div>
          </div>
          <div class="cart-item__controls">
            <button class="cart-item__btn" data-action="dec" data-idx="${idx}" aria-label="Disminuir cantidad">−</button>
            <span class="cart-item__qty">${item.qty}</span>
            <button class="cart-item__btn" data-action="inc" data-idx="${idx}" aria-label="Aumentar cantidad">+</button>
          </div>
        `;
        cartList.appendChild(li);
      });
    }

    // Totales
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const count = items.reduce((s, it) => s + it.qty, 0);
    cartTotal.textContent = `S/ ${total.toFixed(2)}`;
    cartCount.textContent = count;

    // Bounce del contador
    cartCount.classList.remove('bounce');
    void cartCount.offsetWidth;  // reflow
    cartCount.classList.add('bounce');
  }

  /* Agrega un producto */
  function addItem(name, price, icon = '🍦') {
    const existing = items.find(i => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ name, price: parseFloat(price), qty: 1, icon });
    }
    render();
    showToast(`✅ ${name} agregado al pedido`);
  }

  /* Modifica cantidad */
  function changeQty(idx, delta) {
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    render();
  }

  /* Vacía el carrito */
  function clear() {
    items = [];
    render();
    showToast('🗑️ Carrito vaciado');
  }

  /* Eventos */
  cartBubble.addEventListener('click', () => togglePanel());
  cartClose.addEventListener('click', () => togglePanel(false));
  cartOverlay.addEventListener('click', () => togglePanel(false));
  clearBtn.addEventListener('click', () => {
    if (items.length) clear();
  });

  // Incrementar / decrementar desde el panel
  cartList.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx   = parseInt(btn.dataset.idx, 10);
    const delta = btn.dataset.action === 'inc' ? 1 : -1;
    changeQty(idx, delta);
  });

  // Checkout → WhatsApp
  checkoutBtn.addEventListener('click', () => {
    if (!items.length) {
      showToast('⚠️ Tu carrito está vacío');
      return;
    }
    const lines = items.map(i =>
      `• ${i.name} x${i.qty} = S/ ${(i.price * i.qty).toFixed(2)}`
    ).join('%0A');
    const total = items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
    const msg   = `Hola BELLISSIMO 🍦%0AQuiero hacer un pedido:%0A%0A${lines}%0A%0ATotal: S/ ${total}`;
    window.open(`https://wa.me/51999000123?text=${msg}`, '_blank', 'noopener,noreferrer');
  });

  // Escucha tecla Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) togglePanel(false);
  });

  // Inicializa
  render();

  return { addItem };
})();

/* ─────────────────────────────────────────────────────────
   7. BOTONES "AGREGAR AL CARRITO"
───────────────────────────────────────────────────────── */
(function initAddButtons() {
  // Mapa de emojis por nombre de producto
  const emojiMap = {
    'Vainilla Suprema':  '🍦',
    'Chocolate Belga':   '🍫',
    'Fresa & Crema':     '🍓',
    'Mango Tropical':    '🥭',
    'Blueberry Dream':   '🫐',
    'Limón Citrus':      '🍋',
    'Piña Colada Ice':   '🍍',
    'Uva Morada':        '🍇',
    'Kiwi Fresco':       '🥝',
    'Copa Bellissimo':   '🍨',
    'Copa Romántica':    '🌸',
    'Copa Tropical':     '🧁',
    'Shake Fresa':       '🥤',
    'Shake Oreo':        '🍫',
    'Shake Mango':       '🥭',
    'Sundae Clásico':    '🍫',
    'Sundae Berry':      '🍓',
    'Sundae Caramelo':   '🥜',
    'Combo Pareja':      '👫',
    'Combo Amigos x4':   '🎉',
    'Happy Hour 2×1':    '☀️',
    'Pack Cumpleaños':   '🎂',
    'Combo Fit':         '💚',
    'Combo Familiar':    '🏆',
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add, .promo-btn');
    if (!btn) return;

    const name  = btn.dataset.name;
    const price = btn.dataset.price;
    const icon  = emojiMap[name] || '🍦';

    Cart.addItem(name, price, icon);

    // Micro-animación del botón
    btn.textContent = '✓ Agregado';
    btn.style.background = 'linear-gradient(135deg, #26c6da, #00acc1)';
    setTimeout(() => {
      btn.textContent = btn.classList.contains('promo-btn')
        ? (btn.dataset.name.includes('Happy') ? 'Aprovechar oferta' : btn.dataset.name.includes('reservar') ? 'Reservar ahora' : 'Agregar al pedido')
        : '+ Agregar';
      btn.style.background = '';
    }, 1500);
  });
})();

/* ─────────────────────────────────────────────────────────
   8. VALIDACIÓN DEL FORMULARIO DE CONTACTO
───────────────────────────────────────────────────────── */
(function initContactForm() {
  const form       = $('#contactForm');
  if (!form) return;

  const nameInput  = $('#contactName');
  const emailInput = $('#contactEmail');
  const msgInput   = $('#contactMsg');
  const nameErr    = $('#nameError');
  const emailErr   = $('#emailError');
  const msgErr     = $('#msgError');
  const successDiv = $('#formSuccess');

  function setError(input, errorEl, msg) {
    errorEl.textContent = msg;
    input.classList.toggle('error', !!msg);
  }

  function validateName()  { return nameInput.value.trim().length >= 2; }
  function validateEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
  }
  function validateMsg()   { return msgInput.value.trim().length >= 10; }

  // Validación en tiempo real
  nameInput.addEventListener('input', () => {
    setError(nameInput, nameErr, validateName() ? '' : 'El nombre debe tener al menos 2 caracteres.');
  });
  emailInput.addEventListener('input', () => {
    setError(emailInput, emailErr, validateEmail() ? '' : 'Ingresa un correo válido.');
  });
  msgInput.addEventListener('input', () => {
    setError(msgInput, msgErr, validateMsg() ? '' : 'El mensaje debe tener al menos 10 caracteres.');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;

    if (!validateName()) {
      setError(nameInput, nameErr, 'El nombre debe tener al menos 2 caracteres.');
      valid = false;
    } else { setError(nameInput, nameErr, ''); }

    if (!validateEmail()) {
      setError(emailInput, emailErr, 'Ingresa un correo electrónico válido.');
      valid = false;
    } else { setError(emailInput, emailErr, ''); }

    if (!validateMsg()) {
      setError(msgInput, msgErr, 'El mensaje debe tener al menos 10 caracteres.');
      valid = false;
    } else { setError(msgInput, msgErr, ''); }

    if (!valid) return;

    // Simula envío exitoso
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.textContent = 'Enviando…';
    submitBtn.disabled = true;

    setTimeout(() => {
      successDiv.textContent = `¡Gracias, ${nameInput.value.trim()}! Tu mensaje fue enviado. Te contactaremos pronto. 🍦`;
      successDiv.classList.add('show');
      form.reset();
      submitBtn.textContent = 'Enviar mensaje 📨';
      submitBtn.disabled = false;

      setTimeout(() => successDiv.classList.remove('show'), 6000);
    }, 1200);
  });
})();

/* ─────────────────────────────────────────────────────────
   9. INTERACCIONES VISUALES EN TARJETAS (Parallax tilt)
───────────────────────────────────────────────────────── */
(function initCardTilt() {
  // Solo en dispositivos con hover (no táctiles)
  if (window.matchMedia('(hover: none)').matches) return;

  const cards = $$('.product-card, .promo-card, .why__card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const tiltX  = dy * -6;
      const tiltY  = dx *  6;

      card.style.transform = `
        perspective(800px)
        rotateX(${tiltX}deg)
        rotateY(${tiltY}deg)
        translateY(-6px)
        scale(1.02)
      `;
      card.style.boxShadow = `
        ${-tiltY * 2}px ${tiltX * 2}px 32px rgba(240,98,146,.22)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.transition = 'transform .5s ease, box-shadow .5s ease';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   10. CONTADOR ANIMADO en las estadísticas del hero
───────────────────────────────────────────────────────── */
(function initCounters() {
  const stats = $$('.hero__stat strong');

  const targets = [40, 100, 5]; // +40, 100%, +5
  const suffixes = ['+', '%', '+★'];
  let animated = false;

  function animateCount(el, target, suffix, duration = 1600) {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const heroSection = $('#inicio');
  if (!heroSection) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      stats.forEach((el, i) => animateCount(el, targets[i], suffixes[i]));
      obs.disconnect();
    }
  }, { threshold: 0.5 });

  obs.observe(heroSection);
})();

/* ─────────────────────────────────────────────────────────
   11. BOTÓN DE WHATSAPP de promociones
───────────────────────────────────────────────────────── */
(function initWhatsApp() {
  const wa = $('.contact__whatsapp');
  if (!wa) return;
  // El href ya está definido en el HTML; esta función solo añade analytics-ready
  wa.addEventListener('click', () => {
    showToast('💬 Abriendo WhatsApp…');
  });
})();

/* ─────────────────────────────────────────────────────────
   12. EFECTO PARTÍCULAS en el hero (canvas ligero)
───────────────────────────────────────────────────────── */
(function initParticles() {
  const hero = $('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position:absolute;inset:0;width:100%;height:100%;
    pointer-events:none;z-index:0;opacity:.35;
  `;
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, particles;

  const EMOJIS = ['🍦','🍓','❄️','✦','·','○'];

  class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x     = Math.random() * W;
      this.y     = initial ? Math.random() * H : H + 20;
      this.size  = 8 + Math.random() * 14;
      this.speed = 0.3 + Math.random() * 0.5;
      this.drift = (Math.random() - 0.5) * 0.4;
      this.alpha = 0.1 + Math.random() * 0.4;
      this.emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      this.rot   = Math.random() * Math.PI * 2;
      this.rotV  = (Math.random() - 0.5) * 0.02;
    }
    update() {
      this.y   -= this.speed;
      this.x   += this.drift;
      this.rot += this.rotV;
      if (this.y + this.size < 0) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.font = `${this.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    particles = Array.from({ length: 28 }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  loop();
})();

/* ─────────────────────────────────────────────────────────
   13. INICIALIZACIÓN GLOBAL
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Marca el primer reveal como visible inmediatamente
  $$('.hero .reveal').forEach(el => el.classList.add('visible'));
  console.log('%c🍦 BELLISSIMO – Heladería Artesanal', 'color:#e91e8c;font-size:1.2rem;font-weight:bold;');
  console.log('%cPágina cargada correctamente ✓', 'color:#26c6da;');
});
