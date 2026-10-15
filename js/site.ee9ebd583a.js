/* Shared interactions. No framework or build step required. */

/* Loader (home and ABYSS): a dark cover with the OUCH mark that lifts once
   the window has loaded (every CSS background the scene uses included) and
   the fonts are in, so the hero starts its entrance whole. No counter: the
   cover is only there long enough to hide the pieces arriving. */
(function () {
  const root = document.documentElement, loader = document.querySelector('[data-loader]');
  if (!root.classList.contains('is-loading')) return;
  if (!loader) { root.classList.remove('is-loading'); return; }
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove('is-loading');
    loader.classList.add('is-leaving');
    setTimeout(() => loader.remove(), 900);
  }
  const loaded = new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([Promise.all([loaded, fonts]), new Promise(r => setTimeout(r, 6000))]).then(finish);
})();

(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const announce = text => { $('#announcement').textContent = text; };
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  $$('.desktop-nav a, .mobile-menu a').forEach(a => {
    if ((a.pathname === location.pathname || (a.pathname === '/abyss/' && location.pathname.startsWith('/abyss/')) || (a.pathname === '/games/' && location.pathname.startsWith('/games/'))) && !a.hash) {
      a.setAttribute('aria-current', 'page');
    }
  });
  // pages without the site header (the links page) have no menu
  const menu = $('#mobile-menu'), toggle = $('.menu-toggle');
  if (menu && toggle) {
    function setMenu(open) {
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? 'Close <span>×</span>' : 'Menu <span>＋</span>';
      if (open) $('a', menu).focus();
    }
    toggle.addEventListener('click', () => setMenu(menu.hidden));
    document.addEventListener('keydown', e => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); }
      if (e.key === 'Tab') {
        const focusables = [toggle, ...$$('a', menu)], first = focusables[0], last = focusables.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    matchMedia('(min-width: 701px)').addEventListener('change', e => { if(e.matches) setMenu(false); });
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  }

  // Games stage. No scroll hijacking. Click, keyboard and touch controls.
  const stage = $('.game-showcase');
  if (stage) {
    const games = window.OUCH_GAMES, images = $('.stage-images'), tabs = $('.stage-tabs');
    let current = 0;
    const mounted = new Map();
    games.slice(0, 6).forEach((g, i) => {
      const button = document.createElement('button'); button.type = 'button';
      button.innerHTML = `<span>${String(i+1).padStart(2,'0')}</span>${g.title}`;
      button.setAttribute('aria-pressed', 'false'); button.addEventListener('click', () => select(i)); tabs.append(button);
    });
    function mediaFor(g) {
      if(mounted.has(g.id)) return mounted.get(g.id);
      const el = document.createElement(g.video ? 'video' : 'img');
      // the 1600px web version of the art; the original only if that is missing
      if (g.video) el.src = '/' + g.video.replace(/^\//, '');
      else { el.src = g.id === 'abyss' ? '/assets/abyss/abyss-tb-1920.webp' : `/assets/studio/${g.id}-1600.webp`; el.onerror = () => { el.onerror = null; el.src = '/' + g.image.replace(/^\//, ''); }; }
      el.className = 'stage-image';
      if (g.focus) el.style.setProperty('--focus', g.focus);
      if(g.video) { el.muted = true; el.loop = true; el.playsInline = true; el.poster = '/' + g.image; }
      else { el.alt = ''; el.decoding = 'async'; }
      images.append(el); mounted.set(g.id,el); return el;
    }
    function select(index, update = true) {
      current = (index + games.length) % games.length;
      const g = games[current], media = mediaFor(g);
      for (const el of mounted.values()) { el.classList.toggle('is-active', el === media); if(el.tagName === 'VIDEO') el.pause(); }
      if(media.tagName === 'VIDEO' && !reduced.matches) media.play().catch(()=>{});
      $$('#showcase .stage-tabs button').forEach((b,i) => { b.classList.toggle('active',i===current); b.setAttribute('aria-pressed',String(i===current)); });
      $('#stage-title').textContent = g.title;
      $('#stage-title').classList.toggle('long-title', g.title.length > 9);
      $('#stage-credit').textContent = `${g.category} / ${g.credit}`;
      $('#stage-desc').textContent = g.description;
      $('#stage-index').textContent = `${String(current+1).padStart(2,'0')} / ${games.length}`;
      $('#stage-play').href = g.code ? `https://www.fortnite.com/play/island/${g.code}` : 'https://www.fortnite.com/@ouch';
      $('#stage-play').innerHTML = g.code ? 'Play in Fortnite <span>↗</span>' : 'View creator page <span>↗</span>';
      $('#stage-copy').hidden = !g.code; $('#stage-copy').textContent = g.code + ' ⧉';
      $('#stage-copy').setAttribute('aria-label', `Copy island code ${g.code}`);
      if ($('#stage-more')) $('#stage-more').href = g.id === 'abyss' ? '/abyss/' : `/games/${g.id}/`;
      const content = $('.stage-content'); content.classList.remove('swapping'); void content.offsetWidth; content.classList.add('swapping');
      if(update) { const url = new URL(location); url.searchParams.set('game',g.id); history.replaceState(null,'',url); announce(`${g.title}. ${g.description}`); }
    }
    const initial = games.findIndex(g => g.id === new URLSearchParams(location.search).get('game'));
    select(initial < 0 ? 0 : initial, false);
    $$('[data-game-count]').forEach(el => el.textContent=games.length);
    // island codes on the cards follow games.js, so a code added there
    // (ABYSS's, once it has one) replaces "Out now" without touching the page
    $$('.catalogue .game-card').forEach(card => {
      const g = games.find(x => x.id === card.dataset.game);
      const chip = card.querySelector('code');
      if (g && g.code && chip) { chip.textContent = g.code; chip.classList.remove('is-live'); }
    });
    stage.addEventListener('pointermove', e => {
      if(reduced.matches || e.pointerType==='touch')return;
      images.style.setProperty('--px', ((e.clientX/innerWidth-.5)*14)+'px');
      images.style.setProperty('--py', ((e.clientY/innerHeight-.5)*10)+'px');
    }, {passive:true});
    stage.addEventListener('pointerleave',()=>{images.style.setProperty('--px','0px');images.style.setProperty('--py','0px');});
    $('#stage-next').addEventListener('click', () => select(current+1));
    $('#stage-prev').addEventListener('click', () => select(current-1));
    document.addEventListener('keydown', e => {
      if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || (menu && !menu.hidden) || stage.getBoundingClientRect().bottom < innerHeight/3) return;
      if(e.key === 'ArrowRight') { e.preventDefault(); select(current+1); }
      if(e.key === 'ArrowLeft') { e.preventDefault(); select(current-1); }
    });
    let touchX = 0;
    stage.addEventListener('touchstart',e => touchX=e.touches[0].clientX,{passive:true});
    stage.addEventListener('touchend',e => { if(e.target.closest('a,button,.stage-tabs'))return; const delta=e.changedTouches[0].clientX-touchX; if(Math.abs(delta)>70)select(current+(delta<0?1:-1)); },{passive:true});
    $('#stage-copy').addEventListener('click', async () => {
      const code=games[current].code;
      try { await navigator.clipboard.writeText(code); $('#stage-copy').textContent='Copied'; announce('Island code copied'); }
      catch { $('#stage-copy').textContent='Select code: '+code; announce('Copy unavailable. The island code is shown on the button.'); }
    });
    $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      $$('[data-filter]').forEach(b => { b.classList.toggle('active',b===button); b.setAttribute('aria-pressed',String(b===button)); });
      let count=0;
      $$('[data-category]').forEach(item => { item.hidden=filter!=='All' && item.dataset.category!==filter; if(!item.hidden)count++; });
      $('#filter-status').textContent=`${count} ${count===1?'game':'games'}`;
    }));
    reduced.addEventListener('change',e => { for(const el of mounted.values())if(el.tagName==='VIDEO'){if(e.matches)el.pause();else if(el.classList.contains('is-active'))el.play().catch(()=>{});} });
    document.addEventListener('visibilitychange',()=>{ for(const el of mounted.values())if(el.tagName==='VIDEO'){if(document.hidden)el.pause();else if(el.classList.contains('is-active')&&!reduced.matches)el.play().catch(()=>{});} });
  }
  const form = $('#contact-form');
  if(form) {
    const settings=window.OUCH_SETTINGS, status=$('#form-status'), submit=$('#contact-submit');
    if(settings.contactEndpoint) { submit.innerHTML='Send message <span>↗</span>'; status.textContent='Your details are used to reply to your enquiry.'; }
    form.addEventListener('submit', async e => {
      e.preventDefault(); if(!form.reportValidity())return;
      const data=Object.fromEntries(new FormData(form));
      if(!settings.contactEndpoint) {
        const body=`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
        location.href=`mailto:${settings.email}?subject=${encodeURIComponent(data.topic+' enquiry')}&body=${encodeURIComponent(body)}`;
        status.textContent='Email draft requested. Send it from your email app. If nothing opened, use the email address on this page.';
        return;
      }
      submit.disabled=true;status.textContent='Sending…';
      try { const result=await fetch(settings.contactEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});if(!result.ok)throw Error('Request failed'); status.textContent='Message sent. Thank you for getting in touch.';form.reset(); }
      catch {status.textContent='The message could not be sent. Please email '+settings.email+'.';}
      finally{submit.disabled=false;}
    });
  }
})();

/* ---------------------------------------------------------------
   Liquid glass. Injects the SVG lens filter once, then layers the
   glass stack into the header so the backdrop actually refracts.
   Chromium renders the displacement; elsewhere it degrades to blur.
   --------------------------------------------------------------- */
(function () {
  'use strict';

  function mountFilter() {
    if (document.getElementById('lensFilter')) return;
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;overflow:hidden';
    wrap.innerHTML =
      '<svg width="0" height="0">' +
        '<filter id="lensFilter" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">' +
          '<feComponentTransfer in="SourceAlpha" result="alpha">' +
            '<feFuncA type="identity"/>' +
          '</feComponentTransfer>' +
          '<feGaussianBlur in="alpha" stdDeviation="26" result="blur"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="blur" scale="38"' +
            ' xChannelSelector="A" yChannelSelector="A"/>' +
        '</filter>' +
      '</svg>';
    document.body.appendChild(wrap);
  }

  function mountGlass(el) {
    if (!el || el.querySelector('.glass-filter')) return;
    ['glass-specular', 'glass-overlay', 'glass-filter'].forEach(function (cls) {
      var layer = document.createElement('div');
      layer.className = cls;
      layer.setAttribute('aria-hidden', 'true');
      el.insertBefore(layer, el.firstChild);
    });
  }

  function init() {
    mountFilter();
    document.querySelectorAll('.site-header, .mobile-menu').forEach(mountGlass);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Header stays fixed while its glass shell compacts on scroll. */
(() => {
  let queued = false;
  const read = () => {
    document.body.classList.toggle('is-scrolled', scrollY > 30);
    queued = false;
  };
  addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(read); }
  }, { passive: true });
  read();
})();

/* Pause motion. rain.js owns the button and records its state only in
   aria-pressed, so mirror that onto <body> where the stylesheets can see it.
   Before this existed, nothing in CSS could tell the button had been pressed. */
(function () {
  const toggle = document.querySelector('.motion-toggle');
  if (!toggle) return;
  const mirror = () => {
    const paused = toggle.getAttribute('aria-pressed') === 'true';
    document.body.classList.toggle('motion-paused', paused);
    dispatchEvent(new CustomEvent('ouch:motion', { detail: { paused } }));
  };
  new MutationObserver(mirror).observe(toggle, { attributes: true, attributeFilter: ['aria-pressed'] });
  mirror();
})();

/* The home scene answers the pointer in two ways.
   Depth: each layer slides by a different amount, so the kelp, the diver and
   the light separate into planes as you move.
   Attention: once the pointer is out in the water in front of him, the lamp
   leans toward it. Behind him, over the type, it ignores you and keeps
   sweeping. Values ease toward their targets on a frame loop that stops as
   soon as everything has settled. */
(function () {
  // the scene can live in the home atmosphere or the ABYSS hero; the depth
  // and aim variables are set on whichever element hosts it
  const lamp = document.querySelector('.scene__core');
  const atmosphere = lamp && lamp.closest('.atmosphere, .abyss-hero');
  if (!atmosphere) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const BEAM_HEADING = 29;   // the beam art points this many degrees below horizontal
  const target = { x: 0, y: 0, aim: 0 };
  const now = { x: 0, y: 0, aim: 0 };
  let frame = 0;

  const still = () => reduced.matches || document.body.classList.contains('motion-paused');
  function tick() {
    let settling = false;
    for (const key in target) {
      const gap = target[key] - now[key];
      if (Math.abs(gap) > .01) { now[key] += gap * .075; settling = true; } else now[key] = target[key];
    }
    atmosphere.style.setProperty('--ax', now.x.toFixed(2) + 'px');
    atmosphere.style.setProperty('--ay', now.y.toFixed(2) + 'px');
    atmosphere.style.setProperty('--aim', now.aim.toFixed(2) + 'deg');
    frame = settling ? requestAnimationFrame(tick) : 0;
  }
  const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
  const rest = () => { target.x = target.y = target.aim = 0; wake(); };

  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || still()) return rest();
    target.x = (e.clientX / innerWidth - .5) * -30;
    target.y = (e.clientY / innerHeight - .5) * -18;
    const r = lamp.getBoundingClientRect();
    const lx = r.left + r.width / 2, ly = r.top + r.height / 2;
    const heading = Math.atan2(e.clientY - ly, e.clientX - lx) * 180 / Math.PI;
    const offAxis = ((heading - BEAM_HEADING + 540) % 360) - 180;
    // fades in as the pointer crosses from behind the diver to in front of him
    const presence = Math.min(1, Math.max(0, (e.clientX - lx + 160) / 360));
    target.aim = Math.max(-12, Math.min(12, offAxis * .42)) * presence;
    wake();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', rest);
  addEventListener('blur', rest);
  addEventListener('ouch:motion', e => { if (e.detail.paused) rest(); });
  reduced.addEventListener('change', rest);
})();

/* Studio page: the worlds wall, the world count and per-person credits, all
   read from js/games.js so the page keeps up as games are added. The wall
   is two rows drifting in opposite directions; each row holds its set twice
   so the loop is seamless, and the copy is hidden from assistive tech. */
(function () {
  const wall = document.querySelector('[data-world-wall]');
  const games = window.OUCH_GAMES;
  if (!wall || !Array.isArray(games) || !games.length) return;
  document.querySelectorAll('[data-world-count]').forEach(el => { el.textContent = games.length; });
  document.querySelectorAll('[data-credit-for]').forEach(el => {
    const mine = games.filter(g => g.credit === el.dataset.creditFor).map(g => g.title);
    if (mine.length) { el.textContent = (el.dataset.creditLabel || 'Made') + ' ' + mine.join(', '); el.hidden = false; }
  });

  const tile = (g, copy) => {
    const a = document.createElement('a');
    a.className = 'wall-tile';
    a.href = g.id === 'abyss' ? '/abyss/' : '/games/' + encodeURIComponent(g.id) + '/';
    if (copy) { a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1; }
    const img = new Image();
    img.src = '/assets/studio/' + g.id + '-480.webp';
    img.onerror = () => { img.onerror = null; img.src = '/' + g.image.replace(/^\//, ''); };
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 480;
    img.height = 270;
    const label = document.createElement('span');
    label.className = 'wall-tile__label';
    label.innerHTML = '<b></b>' + (g.credit && g.credit !== 'OUCH Studios' ? '<i></i>' : '');
    label.querySelector('b').textContent = g.title;
    if (label.querySelector('i')) label.querySelector('i').textContent = 'by ' + g.credit;
    a.append(img, label);
    return a;
  };
  const half = Math.ceil(games.length / 2);
  [games.slice(0, half), games.slice(half)].forEach((set, i) => {
    const row = document.createElement('div');
    row.className = 'wall-row' + (i ? ' wall-row--back' : '');
    const track = document.createElement('div');
    track.className = 'wall-track';
    track.style.setProperty('--n', set.length);
    set.forEach(g => track.append(tile(g, false)));
    set.forEach(g => track.append(tile(g, true)));
    row.append(track);
    wall.append(row);
  });
})();

/* Game pages: copy the island code. */
document.addEventListener('click', async e => {
  const button = e.target.closest('[data-copy-code]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copyCode);
    button.classList.add('is-copied');
    setTimeout(() => button.classList.remove('is-copied'), 1800);
  } catch (err) { /* the code is printed on the button anyway */ }
});

/* Studio page: the timeline. Every game with a "released" date in
   js/games.js, oldest first, with a marker where each new year starts. The
   most recent release ends it in red as the newest world; a game with no
   date yet comes after that as "Now". Scrolls sideways; the arrows step a
   couple of cards at a time and a mouse can drag it. */
(function () {
  const track = document.querySelector('[data-timeline-track]');
  const games = window.OUCH_GAMES;
  if (!track || !Array.isArray(games)) return;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dated = games.filter(g => g.released).sort((a, b) => a.released.localeCompare(b.released));
  const now = games.filter(g => !g.released);
  let year = '';
  const add = (g, isNow) => {
    const y = isNow ? '' : g.released.slice(0, 4);
    if (y && y !== year) {
      year = y;
      const mark = document.createElement('li');
      mark.className = 'timeline__year';
      mark.innerHTML = '<span></span>';
      mark.querySelector('span').textContent = y;
      track.append(mark);
    }
    const newest = isNow || (!now.length && dated[dated.length - 1] === g);
    const li = document.createElement('li');
    li.className = 'timeline__item' + (newest ? ' is-now' : '') + (dated[0] === g ? ' is-first' : '');
    const a = document.createElement('a');
    a.href = g.id === 'abyss' ? '/abyss/' : '/games/' + encodeURIComponent(g.id) + '/';
    const when = document.createElement('time');
    if (isNow) when.textContent = 'Now';
    else {
      when.dateTime = g.released;
      when.textContent = months[+g.released.slice(5, 7) - 1] + ' ' + (+g.released.slice(8, 10)) + ', ' + g.released.slice(0, 4);
    }
    const img = new Image();
    img.src = '/assets/studio/' + g.id + '-480.webp';
    img.onerror = () => { img.onerror = null; img.src = '/' + g.image.replace(/^\//, ''); };
    img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.width = 480; img.height = 270;
    const title = document.createElement('b');
    title.textContent = g.title;
    const note = document.createElement('small');
    note.textContent = dated[0] === g ? 'Our first world' : newest ? 'Our newest world' : (g.credit && g.credit !== 'OUCH Studios' ? 'by ' + g.credit : g.category || '');
    a.append(when, img, title, note);
    li.append(a);
    track.append(li);
  };
  dated.forEach(g => add(g, false));
  now.forEach(g => add(g, true));

  const step = dir => {
    const card = track.querySelector('.timeline__item');
    track.scrollBy({ left: dir * (card ? card.getBoundingClientRect().width + 18 : 300) * 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  document.querySelector('[data-timeline="prev"]')?.addEventListener('click', () => step(-1));
  document.querySelector('[data-timeline="next"]')?.addEventListener('click', () => step(1));
  // drag to scroll with a mouse; a drag that moved does not count as a click
  let down = null, moved = false;
  track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, left: track.scrollLeft }; moved = false; });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
    track.scrollLeft = down.left - dx;
  });
  addEventListener('pointerup', () => { down = null; track.classList.remove('is-dragging'); });
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  track.addEventListener('dragstart', e => e.preventDefault());
})();

/* Studio page: the big numbers count up once, when they come into view.
   The finished figure is in the HTML, so without JS it simply shows. */
(function () {
  const counters = [...document.querySelectorAll('[data-count]')];
  if (!counters.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const show = (el, k) => {
    const value = +el.dataset.count * k, places = +(el.dataset.decimals || 0);
    el.textContent = value.toFixed(places) + (el.dataset.suffix || '');
  };
  const seen = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    seen.unobserve(entry.target);
    const el = entry.target, length = 1600;
    let start = 0;
    const step = now => {
      // a frame's timestamp can predate the call that queued it, so the
      // clock starts on the first frame rather than at performance.now()
      if (!start) start = now;
      const p = Math.min(1, Math.max(0, (now - start) / length));
      show(el, 1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    show(el, 0);
    requestAnimationFrame(step);
  }), { threshold: .6 });
  counters.forEach(el => seen.observe(el));
})();

/* Links page: share. The phone's own share sheet where there is one,
   otherwise the link is copied. */
(function () {
  const button = document.querySelector('[data-share]');
  if (!button) return;
  const label = button.querySelector('[data-share-label]');
  const url = 'https://ouchuefn.com/links/';
  button.addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'OUCH Studios', url }); } catch (e) { /* closed */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); label.textContent = 'Copied'; }
    catch (e) { label.textContent = 'ouchuefn.com/links'; }
    setTimeout(() => { label.textContent = 'Share'; }, 2200);
  });
})();

/* ABYSS launch page: the reef. Its art is only requested once a reef is
   about a screen away, so it never holds up the loader. */
(function () {
  const reefs = document.querySelectorAll('.reef');
  if (!reefs.length) return;
  if (!('IntersectionObserver' in window)) { reefs.forEach(r => r.classList.add('is-near')); return; }
  const near = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-near'); near.unobserve(e.target); }
  }), { rootMargin: '120% 0px' });
  reefs.forEach(r => near.observe(r));
})();

/* ABYSS launch page: things lurking behind the interface.
   Each .lurk emerges a beat after it scrolls into view. When a pointer comes
   near, it catches the light for a moment and ducks back into cover; once the
   pointer has stayed away for a while, it creeps out again. Distance is
   measured to the lurk's window, not the creature, so a creature that has
   ducked does not immediately count as "gone" and pop straight back out. */
(function () {
  const lurkers = [...document.querySelectorAll('.lurk')];
  if (!lurkers.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const comeBack = new Map();
  const seen = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const lurk = entry.target;
      seen.unobserve(lurk);
      setTimeout(() => { if (!lurk.classList.contains('is-spotted')) lurk.classList.add('is-out'); }, reduced.matches ? 0 : 900);
    }
  }, { threshold: .35 });
  // most wait to be seen; a lurk with data-deep waits for the dive to pass
  // that fraction of the page, and slips away again if you surface
  const deep = lurkers.filter(l => l.dataset.deep);
  lurkers.filter(l => !l.dataset.deep).forEach(l => seen.observe(l));
  const pending = new Map();
  function sound() {
    const room = document.documentElement.scrollHeight - innerHeight;
    const t = room > 0 ? scrollY / room : 0;
    for (const lurk of deep) {
      const at = +lurk.dataset.deep;
      if (t >= at && !lurk.classList.contains('is-out') && !lurk.classList.contains('is-spotted') && !pending.has(lurk)) {
        pending.set(lurk, setTimeout(() => { pending.delete(lurk); lurk.classList.add('is-out'); }, reduced.matches ? 0 : 900));
      } else if (t < at - .08) {
        clearTimeout(pending.get(lurk));
        pending.delete(lurk);
        lurk.classList.remove('is-out', 'is-spotted');
      }
    }
  }
  if (deep.length) { addEventListener('scroll', sound, { passive: true }); sound(); }

  let px = -1e4, py = -1e4, frame = 0;
  function check() {
    frame = 0;
    for (const lurk of lurkers) {
      const r = lurk.getBoundingClientRect();
      const dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);
      const near = Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / 260));
      lurk.style.setProperty('--near', near.toFixed(2));
      if (near > .62 && lurk.classList.contains('is-out')) {
        lurk.classList.remove('is-out');
        lurk.classList.add('is-spotted');
        clearTimeout(comeBack.get(lurk));
      } else if (near < .15 && lurk.classList.contains('is-spotted') && !comeBack.has(lurk)) {
        comeBack.set(lurk, setTimeout(() => {
          comeBack.delete(lurk);
          lurk.classList.remove('is-spotted');
          lurk.classList.add('is-out');
        }, 2400));
      } else if (near >= .15 && comeBack.has(lurk)) {
        clearTimeout(comeBack.get(lurk));
        comeBack.delete(lurk);
      }
    }
  }
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || reduced.matches) return;
    px = e.clientX; py = e.clientY;
    if (!frame) frame = requestAnimationFrame(check);
  }, { passive: true });
  addEventListener('scroll', () => { if (!frame && px > -1e4) frame = requestAnimationFrame(check); }, { passive: true });
})();

/* ABYSS launch page: a dive computer. Scrolling down the page is the dive,
   so depth counts up and oxygen runs down; it goes red when you are nearly
   out, and steps aside when the footer arrives. */
(function () {
  const hud = document.querySelector('.dive-hud');
  if (!hud) return;
  const depth = hud.querySelector('[data-depth]'), o2 = hud.querySelector('[data-o2]');
  const MAX_DEPTH = 1240;
  let frame = 0;
  function read() {
    frame = 0;
    const room = document.documentElement.scrollHeight - innerHeight;
    const t = room > 0 ? Math.min(1, Math.max(0, scrollY / room)) : 0;
    const left = Math.round(100 - t * 88);
    depth.textContent = String(Math.round(t * MAX_DEPTH)).padStart(4, '0');
    o2.textContent = left;
    hud.style.setProperty('--o2', (left / 100).toFixed(3));
    hud.classList.toggle('is-low', left <= 25);
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(read); }, { passive: true });
  addEventListener('resize', () => { read(); stamp(); }, { passive: true });
  // each section is stamped with the depth the computer will read when that
  // section reaches the top of the screen, so the two always agree
  const stamped = [...document.querySelectorAll('[data-depth-stamp]')];
  function stamp() {
    const room = document.documentElement.scrollHeight - innerHeight;
    for (const section of stamped) {
      let tag = section.querySelector(':scope > .depth-stamp');
      if (!tag) { tag = document.createElement('span'); tag.className = 'depth-stamp'; tag.setAttribute('aria-hidden', 'true'); section.prepend(tag); }
      const top = section.getBoundingClientRect().top + scrollY;
      tag.textContent = String(Math.round(Math.min(1, Math.max(0, top / room)) * MAX_DEPTH)).padStart(4, '0') + ' m';
    }
  }
  stamp();
  addEventListener('load', stamp);
  // the dive profile draws itself when it comes into view
  const profile = document.querySelector('.dive-profile');
  if (profile) new IntersectionObserver(([e], io) => { if (e.isIntersecting) { profile.classList.add('is-drawn'); io.disconnect(); } }, { threshold: .4 }).observe(profile);
  const footer = document.querySelector('.footer');
  if (footer) new IntersectionObserver(([e]) => hud.classList.toggle('is-away', e.isIntersecting)).observe(footer);
  read();
})();

/* ABYSS launch page: the trailer. A silent clip that loops on its own while
   it is on screen and pauses when it scrolls away, so it costs nothing until
   it is seen. Phones get the 720p file. Reduced motion (or the site's pause
   button) leaves it paused on its poster; the button plays it by hand. The
   corner button opens it full screen. */
(function () {
  const trailer = document.querySelector('.trailer.is-video');
  if (!trailer) return;
  const video = trailer.querySelector('video');
  const toggle = trailer.querySelector('[data-trailer-toggle]');
  const full = trailer.querySelector('[data-trailer-full]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 900px)').matches && trailer.dataset.mp4Small;
  let loaded = false, wanted = !reduced.matches, visible = false;
  const load = () => { if (!loaded) { video.src = small ? trailer.dataset.mp4Small : trailer.dataset.mp4; loaded = true; } };
  const paused = () => document.body.classList.contains('motion-paused');
  function sync() {
    const run = wanted && visible && !paused() && !document.hidden;
    if (run) { load(); video.play().catch(() => {}); } else if (loaded) video.pause();
    trailer.classList.toggle('is-paused', !run);
    toggle.setAttribute('aria-label', run ? 'Pause trailer' : 'Play trailer');
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) load(); sync(); }, { rootMargin: '200px 0px' }).observe(trailer);
  toggle.addEventListener('click', () => { wanted = !wanted; if (wanted) document.body.classList.remove('motion-paused'); sync(); });
  full.addEventListener('click', () => {
    load();
    video.muted = true;
    const go = video.requestFullscreen || video.webkitEnterFullscreen || video.webkitRequestFullscreen;
    if (go) go.call(video);
    wanted = true; sync();
  });
  document.addEventListener('visibilitychange', sync);
  addEventListener('ouch:motion', sync);
  reduced.addEventListener('change', e => { wanted = !e.matches; sync(); });
})();

/* ABYSS launch page: footage viewer. Each feed opens full size in a native
   dialog; arrow keys step through them, Escape and the backdrop close it. */
(function () {
  const viewer = document.querySelector('.footage-viewer');
  const feeds = [...document.querySelectorAll('.footage')];
  if (!viewer || !feeds.length || typeof viewer.showModal !== 'function') return;
  const img = viewer.querySelector('img'), cap = viewer.querySelector('[data-viewer-cap]');
  let index = 0, opener = null;
  function show(i) {
    index = (i + feeds.length) % feeds.length;
    const source = feeds[index].querySelector('img');
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    cap.textContent = feeds[index].dataset.cap + ' · ' + (index + 1) + ' of ' + feeds.length;
  }
  feeds.forEach((feed, i) => feed.addEventListener('click', () => { opener = feed; show(i); viewer.showModal(); }));
  viewer.addEventListener('click', e => {
    const action = e.target.closest('[data-viewer]')?.dataset.viewer;
    if (action === 'prev') show(index - 1);
    else if (action === 'next') show(index + 1);
    else if (action === 'close' || e.target === viewer) viewer.close();
  });
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  viewer.addEventListener('close', () => opener?.focus());
})();

/* ABYSS launch. Until the release date in js/games.js (15 October), copy
   that would say "out now" shows the date instead, and the ABYSS hero counts
   down. From launch day, anything marked data-launched="…" switches to that
   text. Once ABYSS has an island code in js/games.js, the "Find ABYSS"
   buttons go straight to the island and the code appears beside them with
   a copy button. Nothing here needs editing on the day. */
(function () {
  const abyss = (window.OUCH_GAMES || []).find(g => g.id === 'abyss') || {};
  const [y, m, d] = (abyss.released || '2026-10-15').split('-').map(Number);
  const launch = new Date(y, m - 1, d); // midnight, the visitor's own time
  const now = new Date(), out = now >= launch;
  const date = launch.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  if (out) document.querySelectorAll('[data-launched]').forEach(el => { el.textContent = el.dataset.launched; });
  document.querySelectorAll('[data-launch-countdown]').forEach(el => {
    const days = Math.ceil((launch - now) / 864e5);
    el.textContent = out ? 'Out now in Fortnite'
      : days <= 1 ? `Out tomorrow, ${date}`
      : `Out ${date} · ${days} days to go`;
    el.parentElement.classList.toggle('is-out', out);
  });
  if (!abyss.code) return;
  const play = `https://www.fortnite.com/play/island/${abyss.code}`;
  document.querySelectorAll('[data-play-abyss]').forEach(a => {
    a.href = play;
    a.innerHTML = 'Play in Fortnite <span aria-hidden="true">↗</span>';
  });
  document.querySelectorAll('[data-abyss-code]').forEach(button => {
    button.hidden = false;
    button.dataset.copyCode = abyss.code;
    button.querySelector('b').textContent = abyss.code;
    button.setAttribute('aria-label', `Copy island code ${abyss.code}`);
  });
})();

/* ABYSS page: links into the creature files ask first. Without script (or
   without <dialog>) they are plain links. */
(function () {
  const dialog = document.querySelector('.spoiler-warning');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const go = dialog.querySelector('[data-spoiler-go]');
  let opener = null;
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-spoiler-link]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    opener = link;
    go.href = link.href;
    dialog.showModal();
  });
  dialog.querySelector('[data-spoiler-stay]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
})();

/* Press kit: copy a description, and show ABYSS's island code once known. */
(function () {
  document.querySelectorAll('[data-copy-text]').forEach(button => {
    button.addEventListener('click', async () => {
      const card = button.closest('.press-card');
      const text = [...card.querySelectorAll('p:not(.press-card__kicker)')].map(p => p.textContent.trim()).join('\n\n');
      try {
        await navigator.clipboard.writeText(text);
        const label = button.textContent;
        button.textContent = label === 'Kopiera' ? 'Kopierat' : 'Copied';
        button.classList.add('is-copied');
        setTimeout(() => { button.textContent = label; button.classList.remove('is-copied'); }, 1800);
      } catch (err) { /* select the text by hand */ }
    });
  });
  const code = (window.OUCH_GAMES || []).find(g => g.id === 'abyss')?.code;
  if (code) document.querySelectorAll('[data-press-code]').forEach(el => { el.textContent = code; });
  const games = window.OUCH_GAMES;
  if (Array.isArray(games)) document.querySelectorAll('.page-press [data-world-count]').forEach(el => { el.textContent = games.length; });
})();
