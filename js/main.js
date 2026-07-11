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
    var targets = document.querySelectorAll('#hero h1, #hero p, .service-card, .case-card, #prozess .step, #ueber-mich .text, #kundenstimmen h2');
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

  function initMainPage() {
    initNavToggle();
    initScrollReveal();
  }

  return { prefersReducedMotion: prefersReducedMotion, initMainPage: initMainPage };
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    window.initMainPage();
  });
}
