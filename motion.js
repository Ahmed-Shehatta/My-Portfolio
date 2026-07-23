/* ══════════════════════════════════════════════════
   MOTION ENGINE — shared by Home.html + Services.html

   Every feature is optional: if a page lacks the
   element, that feature quietly no-ops. Pages differ
   in markup, so nothing here assumes a section exists.
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp    = (a, b, t) => a + (b - a) * t;
  const clamp   = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const $       = (s, r = document) => r.querySelector(s);
  const $$      = (s, r = document) => [...r.querySelectorAll(s)];

  /* ─────────────────────────────────────────────
     1. SPLIT TEXT — per-character headline reveal
     ───────────────────────────────────────────── */
  function splitText(el) {
    if (!el) return;
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    let index = 0;

    el.innerHTML = lines.map(line => {
      const holder = document.createElement('div');
      holder.innerHTML = line;

      const walk = (node) => {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...node.textContent].forEach(ch => {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'split-char';
            s.textContent = ch;
            s.style.animationDelay = (0.35 + index * 0.035) + 's';
            index++;
            frag.appendChild(s);
          });
          node.replaceWith(frag);
        } else if (node.nodeType === 1) {
          [...node.childNodes].forEach(walk);
        }
      };
      [...holder.childNodes].forEach(walk);
      return '<span class="split-line">' + holder.innerHTML + '</span>';
    }).join('');
  }

  if (!reduced) $$('.split-text').forEach(splitText);

  /* ─────────────────────────────────────────────
     2. AUTO-TAG elements that need motion classes,
        so pages stay clean of markup noise
     ───────────────────────────────────────────── */
  const SPOTLIGHT_SEL = '.service-card, .type-card, .include-item';
  $$(SPOTLIGHT_SEL).forEach(el => el.classList.add('spotlight'));

  // Carousel cards reveal in sequence
  $$('.project-card').forEach((card, i) => {
    card.classList.add('reveal');
    card.dataset.delay = i * 80;
  });

  // Services page: stagger list rows, includes, and type cards
  const stagger = (sel, step) => $$(sel).forEach((el, i) => {
    el.classList.add('reveal');
    el.dataset.delay = i * step;
  });
  stagger('.service-list-item', 70);
  stagger('.include-item', 60);
  stagger('.type-card', 90);
  stagger('.faq-item', 45);

  // Highlight the current page in the nav
  const here = location.pathname.split('/').pop().toLowerCase() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (!href.startsWith('#') && href.split('#')[0] === here) a.classList.add('is-current');
  });

  /* ─────────────────────────────────────────────
     3. SCROLL REVEALS — staggered via data-delay
     ───────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || 0, 10);
      setTimeout(() => entry.target.classList.add('in-view'), delay);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ─────────────────────────────────────────────
     4. SCROLL — progress bar, nav state, parallax
        (one rAF-throttled listener for all three)
     ───────────────────────────────────────────── */
  const progress = $('#scrollProgress');
  const nav      = $('#mainNav') || $('nav');
  let lastY = window.scrollY;

  // `translate` composes with transform-based keyframes; `transform` would clobber them
  const layers = $$('[data-parallax]').map(el => ({
    el,
    speed: parseFloat(el.dataset.parallax)
  }));

  const pImages = $$('[data-parallax-img]').map(el => ({
    el,
    speed: parseFloat(el.dataset.parallaxImg),
    wrap: el.parentElement
  }));

  let ticking = false;

  function onScroll() {
    const y = window.scrollY;

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    }

    if (nav) {
      nav.classList.toggle('nav-scrolled', y > 40);
      if (y > 400 && y > lastY + 6)      nav.classList.add('nav-hidden');
      else if (y < lastY - 6 || y < 200) nav.classList.remove('nav-hidden');
    }
    lastY = y;

    if (reduced) { ticking = false; return; }

    layers.forEach(({ el, speed }) => {
      el.style.translate = '0 ' + (y * speed).toFixed(2) + 'px';
    });

    const vh = window.innerHeight;
    pImages.forEach(({ el, speed, wrap }) => {
      const rect = wrap.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const rel = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
      el.style.translate = '0 ' + (rel * speed * 100).toFixed(2) + 'px';
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* Project images drift as the carousel scrolls horizontally */
  const track = $('#projectsCarousel');
  if (track && !reduced) {
    let cTicking = false;
    const drift = () => {
      const tRect = track.getBoundingClientRect();
      $$('.project-img', track).forEach(img => {
        const r = img.getBoundingClientRect();
        const rel = (r.left + r.width / 2 - (tRect.left + tRect.width / 2)) / tRect.width;
        img.style.translate = (rel * -18).toFixed(2) + 'px 0';
      });
      cTicking = false;
    };
    track.addEventListener('scroll', () => {
      if (cTicking) return;
      cTicking = true;
      requestAnimationFrame(drift);
    }, { passive: true });
    drift();
  }

  /* ─────────────────────────────────────────────
     5. CUSTOM CURSOR — dot snaps, ring trails
     ───────────────────────────────────────────── */
  const dot  = $('#cursorDot');
  const ring = $('#cursorRing');
  if (dot && ring && fine && !reduced) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('cursor-ready');
    }, { passive: true });

    (function trail() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform  = 'translate(' + mx + 'px,' + my + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(trail);
    })();

    document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-ready'));
    document.addEventListener('mouseenter', () => document.body.classList.add('cursor-ready'));

    $$('a, button, .project-card, .service-card, .type-card, .modal-gallery img').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // The "Live Preview" bubble already owns project cards — stand down there.
    $$('.project-card').forEach(card => {
      card.addEventListener('mouseenter', () => document.body.classList.remove('cursor-ready'));
      card.addEventListener('mouseleave', () => document.body.classList.add('cursor-ready'));
    });
  }

  /* ─────────────────────────────────────────────
     6. HERO GLOW — follows the pointer
     ───────────────────────────────────────────── */
  const hero = $('.hero');
  const glow = $('#heroGlow');
  if (hero && glow && fine && !reduced) {
    let gx = 0, gy = 0, tx = 0, ty = 0, active = false;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!active) { gx = tx; gy = ty; active = true; }
    }, { passive: true });

    (function follow() {
      gx = lerp(gx, tx, 0.08);
      gy = lerp(gy, ty, 0.08);
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
      requestAnimationFrame(follow);
    })();
  }

  /* ─────────────────────────────────────────────
     7. MAGNETIC BUTTONS
     ───────────────────────────────────────────── */
  if (fine && !reduced) {
    $$('.magnetic, .hero-cta, .hero-ghost, .btn-whatsapp, .btn-instagram, .carousel-arrow').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ─────────────────────────────────────────────
     8. 3D TILT + spotlight coordinate feed
     ───────────────────────────────────────────── */
  if (fine && !reduced) {
    function addTilt(el, { max = 8, lift = 6, scale = 1 } = {}) {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.transform =
          'perspective(900px) rotateX(' + ((0.5 - py) * max * 2).toFixed(2) + 'deg) rotateY(' +
          ((px - 0.5) * max * 2).toFixed(2) + 'deg) translateY(-' + lift + 'px) scale(' + scale + ')';
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('mouseleave', () => {
        el.classList.remove('tilting');
        el.style.transform = '';
      });
    }

    [
      { sel: '.project-card', opts: { max: 6, lift: 8 } },
      { sel: '.service-card', opts: { max: 4, lift: 4, scale: 1.02 } },
      { sel: '.type-card',    opts: { max: 5, lift: 6 } }
    ].forEach(({ sel, opts }) => $$(sel).forEach(el => addTilt(el, opts)));

    // Spotlight-only elements still need pointer coords, without the tilt
    $$('.include-item').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    });
  }
})();
