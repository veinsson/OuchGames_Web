/* ============================================================
   OUCH STUDIOS — polish layer (behaviour)
   Runs after main.js. Purely additive: it never touches the rain
   shader, the page-transition layer, or any video.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Atmosphere layers
     --------------------------------------------------------- */
  function mountAtmosphere() {
    ['fx-vignette', 'fx-scan', 'fx-grain'].forEach(function (cls) {
      if (document.querySelector('.' + cls)) return;
      var el = document.createElement('div');
      el.className = cls;
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    });
  }

  /* ---------------------------------------------------------
     2. Hover fills
     The nav pills and buttons get a wipe layer that CSS animates.
     --------------------------------------------------------- */
  function mountFills() {
    document.querySelectorAll('.nav-pill').forEach(function (pill) {
      if (pill.querySelector('.nav-pill__wipe')) return;
      var wipe = document.createElement('span');
      wipe.className = 'nav-pill__wipe';
      wipe.setAttribute('aria-hidden', 'true');
      pill.insertBefore(wipe, pill.firstChild);
    });

    document.querySelectorAll('.btn').forEach(function (btn) {
      if (btn.querySelector('.btn__fill')) return;
      // wrap loose text nodes so they can sit above the fill
      Array.prototype.slice.call(btn.childNodes).forEach(function (node) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          var span = document.createElement('span');
          span.className = 'btn__label';
          span.textContent = node.textContent;
          btn.replaceChild(span, node);
        }
      });
      var fill = document.createElement('span');
      fill.className = 'btn__fill';
      fill.setAttribute('aria-hidden', 'true');
      btn.insertBefore(fill, btn.firstChild);
    });
  }

  /* ---------------------------------------------------------
     2b. Mobile menu footer
     The overlay was three pills floating in a lot of black.
     A contact strip at the bottom gives it a floor.
     --------------------------------------------------------- */
  function mountMenuFooter() {
    var nav = document.querySelector('.site-nav');
    if (!nav || nav.querySelector('.nav-foot')) return;

    var foot = document.createElement('div');
    foot.className = 'nav-foot';
    foot.innerHTML =
      '<a class="nav-foot__mail" href="mailto:contact@ouchuefn.com">contact@ouchuefn.com</a>' +
      // Discord is a primary nav item now, so it is not repeated here
      '<div class="nav-foot__links">' +
        '<a href="https://x.com/OuchCreative" target="_blank" rel="noopener">X</a>' +
        '<span aria-hidden="true">/</span>' +
        '<a href="https://www.fortnite.com/@ouch" target="_blank" rel="noopener">Fortnite</a>' +
      '</div>';
    nav.appendChild(foot);
  }

  /* ---------------------------------------------------------
     3. Scrolled state for the nav
     --------------------------------------------------------- */
  function mountScrollState() {
    var ticking = false;
    function read() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      document.body.classList.toggle('is-scrolled', y > 24);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    read();
  }

  /* ---------------------------------------------------------
     4. Scroll reveal
     --------------------------------------------------------- */
  var REVEAL_TARGETS = [
    '.hx',
    '.about-block',
    '.about-hero',
    '.sealed-specs',
    '.sealed-bigquote',
    '.sealed-discord',
    '.sealed-roadmap',
    '.contact-layout',
    '.site-footer__inner'
  ];

  function mountReveal() {
    if (reduced || !('IntersectionObserver' in window)) return;

    var nodes = [];
    REVEAL_TARGETS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (n) { nodes.push(n); });
    });
    if (!nodes.length) return;

    document.documentElement.classList.add('js-reveal');
    nodes.forEach(function (n, i) {
      n.setAttribute('data-reveal', '');
      n.style.setProperty('--reveal-delay', Math.min(i, 3) * 90 + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
     5. Count-up on the About stats
     --------------------------------------------------------- */
  function mountCounters() {
    var stats = document.querySelectorAll('.about-stat .stat-n');
    if (!stats.length || reduced || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: 0.5 });

    stats.forEach(function (s) { io.observe(s); });

    function run(el) {
      var raw = el.textContent.trim();
      var m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!m) return;
      var target = parseFloat(m[1]);
      var suffix = m[2];
      var decimals = (m[1].split('.')[1] || '').length;
      var start = performance.now();
      var dur = 1100;

      function frame(now) {
        var t = Math.min(1, (now - start) / dur);
        // ease-out cubic
        var v = target * (1 - Math.pow(1 - t, 3));
        el.textContent = v.toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = raw;
      }
      el.textContent = '0' + suffix;
      requestAnimationFrame(frame);
    }
  }

  /* ---------------------------------------------------------
     6. Mobile menu hardening
     main.js owns the open/close toggle; we only add the escapes
     it is missing.
     --------------------------------------------------------- */
  function mountMenu() {
    var burger = document.querySelector('.nav-hamburger');
    if (!burger) return;

    function close() {
      if (document.body.classList.contains('nav-open')) burger.click();
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // Tapping a destination should dismiss the overlay even when the
    // page transition is slow to start.
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.classList.contains('logo')) return;
        setTimeout(close, 0);
      });
    });

    // If the viewport grows past the touch breakpoint, drop the lock.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 720 && matchMedia('(hover:hover)').matches) close();
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */
  function init() {
    mountAtmosphere();
    mountFills();
    mountMenuFooter();
    mountScrollState();
    mountReveal();
    mountCounters();
    mountMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   OUCH STUDIOS — glitch triggers (additive, after polish.js)
   One-shot RGB split as headings enter view, a light ambient
   cadence, and an occasional flicker across the hero wordmark.
   ============================================================ */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function fire(el) {
    if (!el) return;
    el.classList.add('is-glitch');
    setTimeout(function () { el.classList.remove('is-glitch'); }, 520);
  }

  function boot() {
    var gls = Array.prototype.slice.call(document.querySelectorAll('.gl'));

    if ('IntersectionObserver' in window && gls.length) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          setTimeout(function () { fire(e.target); }, 160);
        });
      }, { threshold: 0.35 });
      gls.forEach(function (g) { io.observe(g); });

      setInterval(function () {
        if (document.hidden) return;
        var vh = window.innerHeight;
        var onscreen = gls.filter(function (g) {
          var r = g.getBoundingClientRect();
          return r.top < vh * 0.9 && r.bottom > 0;
        });
        if (!onscreen.length) return;
        fire(onscreen[Math.floor(Math.random() * onscreen.length)]);
      }, 5200);
    }

    var hero = document.querySelector('.hero-title');
    if (hero) {
      setInterval(function () {
        if (document.hidden) return;
        if (window.scrollY > window.innerHeight * 0.6) return;
        document.body.classList.add('hero-glitch');
        setTimeout(function () { document.body.classList.remove('hero-glitch'); }, 620);
      }, 6400);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
