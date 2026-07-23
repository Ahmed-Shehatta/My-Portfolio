/* ──────────────────────────────────────────────────────────────
   Bilingual (EN ⇄ AR) toggle — shared across the whole site.

   How it works:
   • A language button is injected into every page's <nav>.
   • Choice is saved in localStorage('siteLang') so it carries
     across pages and reloads.
   • Shared strings (nav, footer, contact) translate everywhere via
     the SHARED dictionary below — no per-page markup needed.
   • Page-specific text translates via inline  data-ar="…"  attributes.
     The English original is kept automatically, so toggling back is
     lossless. data-ar may contain HTML (e.g. <strong>, <br>).
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Strings shared by every page (matched by their English text).
  var SHARED = {
    'Home': 'الرئيسية',
    'About': 'من أنا',
    'Services': 'الخدمات',
    'Projects': 'المشاريع',
    'WhatsApp': 'واتساب',
    'Instagram': 'إنستغرام',
    'Gmail': 'الإيميل',
    'Terms & Conditions': 'الشروط والأحكام',
    'Privacy': 'الخصوصية',
    'Get In Touch': 'تواصل معنا',
    "Let's build something remarkable together.": 'لنصنع شيئًا مميزًا معًا.',
    'Like What You See?': 'أعجبك ما رأيت؟',
    'Your business could be the next project on this page.': 'قد يكون عملك هو المشروع القادم على هذه الصفحة.',
    '© 2025. All rights reserved': '© 2025. جميع الحقوق محفوظة'
  };

  var STORAGE_KEY = 'siteLang';

  function currentLang() {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  }

  // Tag shared elements with data-ar from the dictionary (once).
  function bootstrapShared() {
    var els = document.querySelectorAll(
      '.nav-links a, .links a, .policies a, .contact-section h2, .contact-sub, .bottom p'
    );
    els.forEach(function (el) {
      var key = el.textContent.trim();
      if (SHARED[key] && !el.hasAttribute('data-ar')) {
        el.setAttribute('data-ar', SHARED[key]);
      }
    });
  }

  function translate(toAr) {
    document.querySelectorAll('[data-ar]').forEach(function (el) {
      if (toAr) {
        if (el._enHTML === undefined) el._enHTML = el.innerHTML;
        el.innerHTML = el.getAttribute('data-ar');
      } else if (el._enHTML !== undefined) {
        el.innerHTML = el._enHTML;
      }
    });
  }

  function updateButtons(lang) {
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      // Show the language you can switch TO.
      btn.textContent = lang === 'ar' ? 'English' : 'العربية';
      btn.setAttribute('aria-label',
        lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    });
  }

  function apply(lang, persist) {
    var toAr = lang === 'ar';
    var root = document.documentElement;
    root.lang = toAr ? 'ar' : 'en';
    root.dir = toAr ? 'rtl' : 'ltr';
    root.classList.toggle('ar-mode', toAr);
    translate(toAr);
    updateButtons(lang);
    if (persist) localStorage.setItem(STORAGE_KEY, lang);
    // Let width-dependent widgets (e.g. the projects filter glider) re-measure.
    window.dispatchEvent(new Event('resize'));
  }

  function toggle() {
    apply(currentLang() === 'ar' ? 'en' : 'ar', true);
  }

  // Inject the toggle button into every <nav> on the page.
  function injectButtons() {
    document.querySelectorAll('nav').forEach(function (nav) {
      if (nav.querySelector('.lang-toggle')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-toggle';
      btn.addEventListener('click', toggle);
      // Place it at the very end of the header (after the Projects link).
      nav.appendChild(btn);
    });
  }

  // Pull in the RTL/button stylesheet and the Arabic font once.
  function injectAssets() {
    if (!document.querySelector('link[data-lang-css]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'lang.css';
      css.setAttribute('data-lang-css', '');
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[data-readex]')) {
      var font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;300;400;500&display=swap';
      font.setAttribute('data-readex', '');
      document.head.appendChild(font);
    }
  }

  function init() {
    injectAssets();
    injectButtons();
    bootstrapShared();
    apply(currentLang(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
