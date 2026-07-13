(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.prefersReducedMotion = api.prefersReducedMotion;
    root.initMainPage = api.initMainPage;
  }
})(typeof window !== 'undefined' ? window : this, function () {

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function nextHeroMode(current) {
    return current === 'wedding' ? 'commercial' : 'wedding';
  }

  function initNavToggle() {
    var toggle = document.getElementById('nav-toggle');
    var list = document.getElementById('nav-list');
    if (!toggle || !list) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      list.classList.toggle('open');
    });
  }

  function initScrollReveal() {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    var targets = document.querySelectorAll('#hero p, .service-card, .case-card, #prozess .step, #ueber-mich .text, #kundenstimmen h2');
    targets.forEach(function (el, i) {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
          delay: (i % 4) * 0.04,
          scrollTrigger: { trigger: el, start: 'top 85%' }
        }
      );
    });
  }

  function initCaseCardHover() {
    if (prefersReducedMotion()) return;
    document.querySelectorAll('.case-card').forEach(function (card) {
      var yTo = gsap.quickTo(card, 'y', { duration: 0.25, ease: 'power2.out' });
      var scaleTo = gsap.quickTo(card, 'scale', { duration: 0.25, ease: 'power2.out' });
      card.addEventListener('mouseenter', function () { yTo(-4); scaleTo(1.02); });
      card.addEventListener('mouseleave', function () { yTo(0); scaleTo(1); });
    });
  }

  function initMagnetCursor() {
    if (prefersReducedMotion() || isTouchDevice()) return;
    var targets = [document.querySelector('#hero .btn'), document.querySelector('#kontakt .whatsapp-cta')].filter(Boolean);
    targets.forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'elastic.out(1,0.4)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'elastic.out(1,0.4)' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  function initHeroParallax() {
    if (prefersReducedMotion()) return;
    var bg = document.querySelector('#hero .hero-bg');
    if (!bg) return;
    gsap.to(bg, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  function initCustomCursor() {
    if (prefersReducedMotion() || isTouchDevice()) return;
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;
    document.documentElement.classList.add('custom-cursor-active');
    var dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.3, ease: 'power2.out' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.3, ease: 'power2.out' });
    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll('a, button, .case-card').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
    });
  }

  function initHeroTypewriter() {
    var h1 = document.getElementById('hero-headline');
    if (!h1) return;
    var textEl = h1.querySelector('.typed-text');
    var fullText = h1.getAttribute('aria-label') || '';
    if (!textEl || !fullText) return;
    if (prefersReducedMotion()) {
      textEl.textContent = fullText;
      return;
    }
    var i = 0;
    function typeNext() {
      if (i > fullText.length) return;
      textEl.textContent = fullText.slice(0, i);
      i++;
      setTimeout(typeNext, 35);
    }
    typeNext();
  }

  function initMainPage() {
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
    initMagnetCursor();
    initHeroParallax();
    initCustomCursor();
    initHeroTypewriter();
  }

  return { prefersReducedMotion: prefersReducedMotion, isTouchDevice: isTouchDevice, nextHeroMode: nextHeroMode, initMainPage: initMainPage };
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    window.initMainPage();
  });
}
