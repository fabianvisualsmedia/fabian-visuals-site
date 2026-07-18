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
      toggle.setAttribute('aria-label', expanded ? 'Menü öffnen' : 'Menü schließen');
      list.classList.toggle('open');
    });
  }

  function initScrollReveal() {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    var targets = document.querySelectorAll('#hero .hero-content--commercial p, .service-card, .case-card, #ueber-mich .text, #kundenstimmen h2');
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
    document.querySelectorAll('.case-media').forEach(function (media) {
      var yTo = gsap.quickTo(media, 'y', { duration: 0.25, ease: 'power2.out' });
      var scaleTo = gsap.quickTo(media, 'scale', { duration: 0.25, ease: 'power2.out' });
      media.addEventListener('mouseenter', function () { yTo(-4); scaleTo(1.02); });
      media.addEventListener('mouseleave', function () { yTo(0); scaleTo(1); });
    });
  }

  function initCaseExpand() {
    var cards = document.querySelectorAll('.case-card');
    if (!cards.length) return;
    var current = null;

    function setOpenState(card, isOpen) {
      var btn = card.querySelector('.case-toggle');
      var detail = card.querySelector('.case-detail');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.querySelector('.case-toggle-label').textContent = isOpen ? 'Weniger anzeigen' : 'Mehr erfahren';
      detail.setAttribute('aria-hidden', String(!isOpen));
      detail.toggleAttribute('inert', !isOpen);
    }

    function refreshScrollTrigger() {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    function expand(card) {
      var detail = card.querySelector('.case-detail');
      card.classList.add('is-expanded');
      setOpenState(card, true);
      if (prefersReducedMotion()) {
        detail.style.height = 'auto';
        refreshScrollTrigger();
      } else {
        gsap.fromTo(detail, { height: 0 }, {
          height: 'auto', duration: 0.4, ease: 'power2.inOut',
          onComplete: refreshScrollTrigger
        });
      }
    }

    function collapse(card) {
      var detail = card.querySelector('.case-detail');
      setOpenState(card, false);
      if (prefersReducedMotion()) {
        card.classList.remove('is-expanded');
        detail.style.height = '';
        refreshScrollTrigger();
      } else {
        gsap.to(detail, {
          height: 0, duration: 0.3, ease: 'power2.inOut',
          onComplete: function () {
            card.classList.remove('is-expanded');
            detail.style.height = '';
            refreshScrollTrigger();
          }
        });
      }
    }

    cards.forEach(function (card) {
      var btn = card.querySelector('.case-toggle');
      if (!btn) return;
      function toggle() {
        var isOpen = card.classList.contains('is-expanded');
        if (isOpen) {
          collapse(card);
          current = null;
        } else {
          if (current && current !== card) collapse(current);
          expand(card);
          current = card;
        }
      }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggle();
      });
      card.addEventListener('click', function (e) {
        if (e.target.closest('.case-detail')) return;
        toggle();
      });
    });
  }

  function initServiceAccordion() {
    var items = document.querySelectorAll('#leistungen .service-item');
    if (!items.length) return;

    function setOpen(item, isOpen) {
      var btn = item.querySelector('.service-toggle');
      var detail = item.querySelector('.service-detail');
      gsap.killTweensOf(detail);
      item.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      detail.hidden = false;
      if (prefersReducedMotion()) {
        detail.style.height = isOpen ? 'auto' : '0';
        if (!isOpen) detail.hidden = true;
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        return;
      }
      if (isOpen) {
        gsap.fromTo(detail, { height: 0 }, {
          height: 'auto', duration: 0.4, ease: 'power2.inOut',
          onComplete: function () { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); }
        });
      } else {
        gsap.to(detail, {
          height: 0, duration: 0.3, ease: 'power2.inOut',
          onComplete: function () {
            detail.hidden = true;
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
          }
        });
      }
    }

    items.forEach(function (item) {
      item.querySelector('.service-toggle').addEventListener('click', function () {
        var alreadyOpen = item.classList.contains('is-open');
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
        setOpen(item, !alreadyOpen);
      });
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
    var bg = document.querySelector('.hero-bg--commercial');
    if (!bg) return;
    gsap.to(bg, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  function initHeroModeSwitch() {
    var hero = document.querySelector('#hero');
    var toggle = document.querySelector('.hero-switch-toggle');
    var label = document.getElementById('hero-switch-label');
    var commercial = document.querySelector('.hero-content--commercial');
    var wedding = document.querySelector('.hero-content--wedding');
    if (!hero || !toggle || !label || !commercial || !wedding) return;
    toggle.addEventListener('click', function () {
      var mode = nextHeroMode(hero.getAttribute('data-hero-mode'));
      var weddingActive = mode === 'wedding';
      hero.setAttribute('data-hero-mode', mode);
      toggle.setAttribute('aria-checked', String(weddingActive));
      label.textContent = weddingActive ? 'Zurück zu Commercial' : 'Hochzeiten ansehen';
      wedding.toggleAttribute('inert', !weddingActive);
      wedding.setAttribute('aria-hidden', String(!weddingActive));
      commercial.toggleAttribute('inert', weddingActive);
      commercial.setAttribute('aria-hidden', String(weddingActive));
      if (weddingActive) {
        setTimeout(function () {
          window.location.href = 'hochzeiten.html';
        }, prefersReducedMotion() ? 0 : 700);
      }
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

  function initProcessPin() {
    if (prefersReducedMotion()) return;
    var section = document.querySelector('#prozess');
    var steps = document.querySelectorAll('#prozess .step');
    if (!section || !steps.length) return;
    gsap.set(steps, { opacity: 0, y: 24 });
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=100%',
        scrub: 1,
        pin: true
      }
    });
    steps.forEach(function (step, i) {
      tl.to(step, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, i * 0.5);
    });
  }

  function initMainPage() {
    initNavToggle();
    initScrollReveal();
    initCaseCardHover();
    initCaseExpand();
    initServiceAccordion();
    initMagnetCursor();
    initHeroParallax();
    initCustomCursor();
    initHeroTypewriter();
    initHeroModeSwitch();
    initProcessPin();
  }

  return { prefersReducedMotion: prefersReducedMotion, isTouchDevice: isTouchDevice, nextHeroMode: nextHeroMode, initMainPage: initMainPage };
});

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    window.initMainPage();
  });
}
