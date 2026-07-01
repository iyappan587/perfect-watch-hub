/* ==========================================================================
   script.js — Perfect Watch Hub interactions
   Depends on csv-loader.js having populated window.PERFECTWATCHHUB.products
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- CONFIG ---------------- */
  const WHATSAPP_NUMBER = '918438475865';
  const CURRENCY = '₹';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------- STATE (persisted) ---------------- */
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
  };
  let wishlist = store.get('perfectwatchhub_wishlist', []);
  let cart = store.get('perfectwatchhub_cart', []);
  let currentSort = 'default';
  let currentSearch = '';

  /* ================= LOADER ================= */
  window.addEventListener('load', () => {
    setTimeout(() => $('#loader')?.classList.add('hidden'), 400);
  });

  /* ================= SCROLL PROGRESS + NAVBAR + BACK TO TOP + CURSOR GLOW ================= */
  const navbar = $('#navbar');
  const progressBar = $('#scrollProgress');
  const backToTop = $('#backToTop');

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';

    navbar.classList.toggle('scrolled', scrollTop > 60);
    backToTop.classList.toggle('show', scrollTop > 700);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const cursorGlow = $('#cursorGlow');
  window.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  });

  /* ================= MOBILE NAV ================= */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navBackdrop = document.getElementById('navBackdrop');

  function setMobileNavOpen(isOpen) {
    navLinks?.classList.toggle('active', isOpen);
    navLinks?.classList.toggle('open', isOpen);
    navBackdrop?.classList.toggle('open', isOpen);
    navToggle?.classList.toggle('active', isOpen);
    navToggle?.setAttribute('aria-expanded', String(isOpen));
    navToggle?.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      setMobileNavOpen(!navLinks.classList.contains('active'));
    });

    navBackdrop?.addEventListener('click', () => setMobileNavOpen(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        setMobileNavOpen(false);

        if (!href || !href.startsWith('#')) return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (window.location.hash !== href) {
              history.pushState(null, '', href);
            }
          }, 180);
        } else {
          window.location.hash = href;
        }
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) setMobileNavOpen(false);
    });
  }

  /* ================= MOBILE SECTION ORDER ================= */
  const heroSection = document.getElementById('top');
  const productsSection = document.getElementById('products');

  function reorderMobileSections() {
    if (!heroSection || !productsSection || window.innerWidth > 768) return;
    const nextSibling = heroSection.nextElementSibling;
    if (productsSection !== nextSibling) {
      heroSection.insertAdjacentElement('afterend', productsSection);
    }
  }

  reorderMobileSections();
  window.addEventListener('resize', reorderMobileSections);

  /* ================= THEME TOGGLE ================= */
  const themeToggle = $('#themeToggle');
  const savedTheme = store.get('perfectwatchhub_theme', 'dark');
  document.body.setAttribute('data-theme', savedTheme);
  themeToggle?.addEventListener('click', () => {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    store.set('perfectwatchhub_theme', next);
  });

  /* ================= RIPPLE EFFECT ================= */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ripple], .btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  /* ================= HERO PARTICLES ================= */
  const particleWrap = $('#heroParticles');
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = '-10px';
    p.style.animationDuration = (10 + Math.random() * 14) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    particleWrap.appendChild(p);
  }

  /* ================= HERO WATCH: real ticks + real-time hands + parallax ================= */
  const ticksGroup = $('#ticks');
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const r1 = isMajor ? 70 : 76;
    const r2 = 82;
    const x1 = 100 + r1 * Math.sin(angle), y1 = 100 - r1 * Math.cos(angle);
    const x2 = 100 + r2 * Math.sin(angle), y2 = 100 - r2 * Math.cos(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke-width', isMajor ? 2.6 : 1.2);
    ticksGroup.appendChild(line);
  }

  const hourHand = $('#hourHand'), minHand = $('#minHand'), secHand = $('#secHand');
  function tickClock() {
    const now = new Date();
    const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
    const hourDeg = (h + m / 60) * 30;
    const minDeg = (m + s / 60) * 6;
    const secDeg = s * 6;
    hourHand.setAttribute('transform', `rotate(${hourDeg} 100 100)`);
    minHand.setAttribute('transform', `rotate(${minDeg} 100 100)`);
    secHand.setAttribute('transform', `rotate(${secDeg} 100 100)`);
  }
  tickClock();
  setInterval(tickClock, 1000);

  const heroVisual = $('#heroVisual');
  const watchGlass = $('#watchGlass');
  heroVisual?.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    watchGlass.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  });
  heroVisual?.addEventListener('mouseleave', () => { watchGlass.style.transform = ''; });

  /* ================= ANIMATED COUNTERS ================= */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target * eased;
      el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ================= SCROLL REVEAL (IntersectionObserver) ================= */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Animate counters + progress bars inside
        $$('[data-count]', entry.target).forEach(el => { if (!el.dataset.done) { el.dataset.done = '1'; animateCounter(el); } });
        $$('[data-count]').includes(entry.target) && !entry.target.dataset.done && (entry.target.dataset.done = '1', animateCounter(entry.target));
        $$('.progress-fill', entry.target).forEach(el => { el.style.width = el.dataset.progress + '%'; });
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function observeReveals(root = document) {
    $$('.reveal, .reveal-left, .reveal-right', root).forEach((el, i) => {
      el.style.setProperty('--i', i % 8);
      revealObserver.observe(el);
    });
  }
  observeReveals();
  // Hero stats aren't inside a .reveal wrapper, animate them on load
  window.addEventListener('load', () => setTimeout(() => $$('.hero-stats [data-count]').forEach(animateCounter), 900));

  /* ================= REVIEWS CAROUSEL ================= */
  const reviewTrack = $('#reviewTrack');
  $('#reviewNext')?.addEventListener('click', () => reviewTrack.scrollBy({ left: 340, behavior: 'smooth' }));
  $('#reviewPrev')?.addEventListener('click', () => reviewTrack.scrollBy({ left: -340, behavior: 'smooth' }));

  /* ================= NEWSLETTER ================= */
  $('#newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#newsletterEmail').value;
    $('#newsletterMsg').textContent = `You're on the list — we'll email ${email} when something new drops.`;
    $('#newsletterForm').reset();
    showToast('Subscribed! Welcome to Perfect Watch Hub.');
  });

  /* ================= PRIVACY ACCORDION ================= */
  $$('.privacy-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.privacy-item');
      const wasOpen = item.classList.contains('open');
      $$('.privacy-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ================= TOAST ================= */
  let toastTimer;
  function showToast(msg) {
    const toast = $('#toast');
    $('#toastMsg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ================= FOOTER YEAR ================= */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ================================================================
     PRODUCTS: render, search, sort, wishlist, cart badge, quick view,
     buy now → WhatsApp
     ================================================================ */
  const productGrid = $('#productGrid');
  const productCount = $('#productCount');
  const sortSelect = $('#sortSelect');
  const searchInput = $('#searchInput');
  const searchSuggestions = $('#searchSuggestions');

  function money(n) { return CURRENCY + Number(n).toLocaleString('en-IN'); }

  function starIcons(rating) {
    const full = Math.round(rating);
    let out = '';
    for (let i = 0; i < 5; i++) {
      out += `<svg viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z" opacity="${i < full ? 1 : 0.25}"/></svg>`;
    }
    return out;
  }

  function highlight(text, query) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  function buildWhatsAppLink(product) {
    const productUrl = window.location.href.split('#')[0] + '#product-' + product.id;
    const img = product.images[0] || '';
    const message =
`Hello,

I would like to buy this watch.

Product Name: ${product.name}
Brand: ${product.brand}
Price: ${money(product.price)}
Product Link: ${productUrl}
Image: ${img}

Please provide more details.

Thank you.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function cardTemplate(p, i) {
    const img1 = p.images[0] || 'https://picsum.photos/seed/meridian' + p.id + '/800/800';
    const img2 = p.images[1] || img1;
    const stockLabel = p.stock > 10 ? `In Stock (${p.stock})` : (p.stock > 0 ? `Only ${p.stock} left` : 'Out of Stock');
    const stockClass = p.stock > 10 ? '' : 'low';
    const isWishlisted = wishlist.includes(String(p.id));
    return `
    <article class="product-card reveal" style="--i:${i}" id="product-${p.id}" data-id="${p.id}">
      <div class="card-media">
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
        ${p.discount ? `<span class="card-discount">-${p.discount}%</span>` : ''}
        <img class="img-1" src="${img1}" alt="${p.name} — front view" loading="lazy" onerror="this.src='https://picsum.photos/seed/meridian${p.id}a/800/800'">
        <img class="img-2" src="${img2}" alt="${p.name} — alternate view" loading="lazy" onerror="this.src='https://picsum.photos/seed/meridian${p.id}b/800/800'">
        <div class="card-quick-actions">
          <button class="qa-btn wishlist-toggle ${isWishlisted ? 'active' : ''}" data-id="${p.id}" aria-label="Add to wishlist" title="Wishlist">
            <svg viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </button>
          <button class="qa-btn quick-view" data-id="${p.id}" aria-label="Quick view" title="Quick View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="qa-btn share-btn" data-id="${p.id}" aria-label="Share" title="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-top-row">
          <span class="card-brand">${p.brand}</span>
          <span class="card-rating">${starIcons(p.rating)} ${p.rating.toFixed(1)}</span>
        </div>
        <h3 class="card-name">${highlight(p.name, currentSearch)}</h3>
        <div class="card-price-row">
          <span class="card-price">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="card-old-price">${money(p.oldPrice)}</span>` : ''}
        </div>
        <div class="card-stock ${stockClass}">${stockLabel}</div>
        <button class="buy-btn buy-now" data-id="${p.id}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.7 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
          Buy Now on WhatsApp
        </button>
      </div>
    </article>`;
  }

  function getSortedFiltered() {
    let list = (window.PERFECTWATCHHUB.products || []).slice();
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    switch (currentSort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      case 'bestselling': list.sort((a, b) => (b.stock < a.stock ? -1 : 1)); break; // fewer left = selling faster
      case 'discount': list.sort((a, b) => b.discount - a.discount); break;
      default: break; // "Newest" = CSV order
    }
    return list;
  }

  function renderProducts() {
    if (!productGrid || !productCount) return;
    const list = getSortedFiltered();
    productCount.textContent = `Showing ${list.length} watch${list.length !== 1 ? 'es' : ''}`;
    if (!list.length) {
      productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px 0; color:var(--ivory-faint);">No watches match your search.</div>`;
      return;
    }
    productGrid.innerHTML = list.map((p, i) => cardTemplate(p, i)).join('');
    observeReveals(productGrid);
    wireProductCardEvents();
  }

  function wireProductCardEvents() {
    $$('.wishlist-toggle', productGrid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (wishlist.includes(id)) { wishlist = wishlist.filter(x => x !== id); showToast('Removed from wishlist'); }
        else { wishlist.push(id); showToast('Added to wishlist ♥'); }
        store.set('perfectwatchhub_wishlist', wishlist);
        updateBadges();
        btn.classList.toggle('active');
        const svg = btn.querySelector('svg');
        svg.setAttribute('fill', wishlist.includes(id) ? 'currentColor' : 'none');
      });
    });

    $$('.quick-view', productGrid).forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openQuickView(btn.dataset.id); });
    });

    $$('.share-btn', productGrid).forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const p = findProduct(btn.dataset.id);
        const url = window.location.href.split('#')[0] + '#product-' + p.id;
        if (navigator.share) {
          try { await navigator.share({ title: p.name, text: `Check out the ${p.name} by ${p.brand}`, url }); } catch {}
        } else {
          try { await navigator.clipboard.writeText(url); showToast('Product link copied!'); }
          catch { showToast(url); }
        }
      });
    });

    $$('.buy-now', productGrid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = findProduct(btn.dataset.id);
        if (!cart.includes(String(p.id))) { cart.push(String(p.id)); store.set('perfectwatchhub_cart', cart); updateBadges(); }
        window.open(buildWhatsAppLink(p), '_blank', 'noopener');
      });
    });
  }

  function findProduct(id) {
    return (window.PERFECTWATCHHUB.products || []).find(p => String(p.id) === String(id));
  }

  function updateBadges() {
    $('#wishlistCount').textContent = wishlist.length;
    $('#cartCount').textContent = cart.length;
  }
  updateBadges();

  /* ---------------- QUICK VIEW MODAL ---------------- */
  const modalOverlay = $('#modalOverlay');
  const modalBox = $('#modalBox');

  function openQuickView(id) {
    const p = findProduct(id);
    if (!p) return;
    modalBox.innerHTML = `
      <button class="modal-close" id="modalClose" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-img"><img src="${p.images[0] || ''}" alt="${p.name}" onerror="this.src='https://picsum.photos/seed/meridian${p.id}/800/800'"></div>
      <div class="modal-info">
        <span class="card-brand">${p.brand}</span>
        <h2 style="font-family:var(--font-display); font-size:30px; margin:8px 0 12px;">${p.name}</h2>
        <div class="card-rating" style="margin-bottom:14px;">${starIcons(p.rating)} ${p.rating.toFixed(1)} · ${p.category}</div>
        <div class="card-price-row"><span class="card-price" style="font-size:26px;">${money(p.price)}</span>${p.oldPrice ? `<span class="card-old-price">${money(p.oldPrice)}</span>` : ''}${p.discount ? `<span class="card-discount" style="position:static;">-${p.discount}%</span>` : ''}</div>
        <p style="color:var(--ivory-dim); margin:16px 0;">${p.description}</p>
        <div class="modal-features">${p.features.map(f => `<span>${f}</span>`).join('')}</div>
        <div class="card-stock" style="margin-bottom:20px;">${p.stock > 0 ? `In Stock — ${p.stock} available` : 'Out of Stock'}</div>
        <button class="buy-btn buy-now" data-id="${p.id}" style="background:var(--gold); color:#0a0a0a;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.7 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3z"/></svg>
          Buy Now on WhatsApp
        </button>
      </div>`;
    $('#modalClose').addEventListener('click', closeQuickView);
    $('.buy-now', modalBox).addEventListener('click', () => {
      const prod = findProduct(id);
      if (!cart.includes(String(prod.id))) { cart.push(String(prod.id)); store.set('perfectwatchhub_cart', cart); updateBadges(); }
      window.open(buildWhatsAppLink(prod), '_blank', 'noopener');
    });
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeQuickView() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeQuickView(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuickView(); });

  /* ---------------- CARD TILT EFFECT ---------------- */
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest?.('.product-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest?.('.product-card');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });

  /* ---------------- SORT ---------------- */
  sortSelect?.addEventListener('change', () => { currentSort = sortSelect.value; renderProducts(); });

  /* ---------------- SEARCH (nav overlay + live suggestions, scoped to the 4 shown products) ---------------- */
  const searchToggle = $('#searchToggle');
  const searchPanel = $('#searchPanel');
  const searchClose = $('#searchClose');

  searchToggle?.addEventListener('click', () => {
    searchPanel?.classList.add('open');
    setTimeout(() => searchInput?.focus(), 300);
  });
  searchClose?.addEventListener('click', () => searchPanel?.classList.remove('open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') searchPanel?.classList.remove('open'); });

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim();
    renderSuggestions(q);
  });

  function renderSuggestions(q) {
    const list = (window.PERFECTWATCHHUB.products || []).filter(p =>
      !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())
    );
    if (!list.length) {
      searchSuggestions.innerHTML = `<div class="no-results">No watches found for "${q}".</div>`;
      return;
    }
    searchSuggestions.innerHTML = list.map(p => `
      <div class="suggestion-item" data-id="${p.id}">
        <img src="${p.images[0] || ''}" alt="" onerror="this.src='https://picsum.photos/seed/meridian${p.id}/100/100'">
        <span class="s-name">${highlight(p.name, q)}</span>
        <span class="s-price">${money(p.price)}</span>
      </div>`).join('');
    $$('.suggestion-item', searchSuggestions).forEach(el => {
      el.addEventListener('click', () => {
        searchPanel.classList.remove('open');
        currentSearch = '';
        document.getElementById('product-' + el.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        openQuickView(el.dataset.id);
      });
    });
  }

  /* Live filter of the on-page grid too (search box appears in nav; also filter grid as you type) */
  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      renderProducts();
    }, 200);
  });

  /* ================= INIT: wait for CSV ================= */
  document.addEventListener('perfectwatchhub:products-ready', renderProducts);
  // In case the event already fired before this script attached listeners:
  if (window.PERFECTWATCHHUB.products) renderProducts();

})();
