/* ABYSS wiki: filters, search, item inspector, spoilers, tabs and the
   "on this page" highlight. Every page works without this file. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };
  document.documentElement.classList.add('wk-js');

  /* ---------- spoilers ---------- */
  const SPOIL = 'abyss-wiki-spoilers';
  const revealed = new Set(store.get(SPOIL) || []);
  const slugOf = el => el.dataset.spoilerId || (el.querySelector('a[href*="/creatures/"]')?.getAttribute('href') || location.pathname).split('/').filter(Boolean).pop();
  const isRevealed = slug => revealed.has('*') || revealed.has(slug);
  function paintSpoilers() {
    $$('[data-spoiler]').forEach(el => el.classList.toggle('is-revealed', isRevealed(slugOf(el))));
    const all = $('[data-reveal-all]');
    if (all) {
      all.setAttribute('aria-pressed', String(revealed.has('*')));
      all.textContent = revealed.has('*') ? 'Hide spoilers' : 'Show spoilers';
    }
  }
  function reveal(slug, on = true) {
    if (on) revealed.add(slug); else revealed.delete(slug);
    store.set(SPOIL, [...revealed]);
    paintSpoilers();
  }
  document.addEventListener('click', e => {
    const card = e.target.closest('.wk-creature[data-spoiler], .wk-post[data-spoiler]');
    if (card && !card.classList.contains('is-revealed')) { e.preventDefault(); reveal(slugOf(card)); return; }
    if (e.target.closest('[data-reveal]')) { reveal(slugOf(e.target.closest('[data-spoiler]'))); return; }
    if (e.target.closest('[data-unreveal]')) { reveal(slugOf(e.target.closest('[data-spoiler]')), false); return; }
    const all = e.target.closest('[data-reveal-all]');
    if (all) {
      if (revealed.has('*')) { revealed.clear(); store.set(SPOIL, []); paintSpoilers(); }
      else reveal('*');
    }
  });
  paintSpoilers();

  /* ---------- filters (loot and creatures) ---------- */
  const ORDER = ['common', 'uncommon', 'rare', 'legendary', 'abyssal'];
  $$('[data-filter-for]').forEach(panel => {
    const list = $(`[data-filter-list="${panel.dataset.filterFor}"]`);
    if (!list) return;
    panel.hidden = false;
    const cards = [...list.children];
    const text = $('[data-filter-text]', panel);
    const where = $('[data-filter-where]', panel);
    const sort = $('[data-sort]', panel);
    const count = $('[data-filter-count]', panel);
    const empty = list.parentElement.querySelector('[data-filter-empty]');
    const noun = { items: ['item', 'items'], creatures: ['creature', 'creatures'], updates: ['post', 'posts'] }[panel.dataset.filterFor];
    const pressed = attr => $$(`[${attr}][aria-pressed="true"]`, panel).map(b => b.getAttribute(attr));

    function apply() {
      const q = (text?.value || '').trim().toLowerCase();
      const rarities = pressed('data-filter-rarity'), tiers = pressed('data-filter-tier');
      const places = pressed('data-filter-place'), flags = pressed('data-filter-flag'), authors = pressed('data-filter-author');
      const at = where?.value || '';
      let shown = 0;
      cards.forEach(card => {
        const d = card.dataset;
        const ok = (!q || (d.name || '').includes(q))
          && (!rarities.length || rarities.includes(d.rarity))
          && (!tiers.length || tiers.includes(d.tier))
          && (!places.length || places.some(p => (d.where || '').split(' ').includes(p)))
          && (!authors.length || authors.includes(d.author))
          && (!at || d.where.split(' ').includes(at))
          && flags.every(f => d[f] === '1');
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown === cards.length ? `All ${cards.length} ${noun[1]}` : `${shown} of ${cards.length} ${noun[1]}`;
      if (empty) empty.hidden = shown > 0;
    }
    function reorder() {
      if (!sort) return;
      const by = sort.value;
      const key = {
        rarity: c => [ORDER.indexOf(c.dataset.rarity), +c.dataset.value],
        value: c => [-(+c.dataset.value), 0],
        weight: c => [+c.dataset.weight, 0],
        name: c => [c.dataset.name, 0],
      }[by];
      cards.slice().sort((a, b) => {
        const [a1, a2] = key(a), [b1, b2] = key(b);
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a2 - b2;
      }).forEach(c => list.appendChild(c));
    }
    panel.addEventListener('click', e => {
      const chip = e.target.closest('.wk-chipbtn:not([data-reveal-all])');
      if (!chip) return;
      chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
      apply();
    });
    text?.addEventListener('input', apply);
    where?.addEventListener('change', apply);
    sort?.addEventListener('change', reorder);
    empty?.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
      if (text) text.value = '';
      if (where) where.value = '';
      $$('[aria-pressed="true"]:not([data-reveal-all])', panel).forEach(b => b.setAttribute('aria-pressed', 'false'));
      apply();
    });
    // ?rarity=legendary&heavy=1 and the like, so a filtered view can be shared
    const params = new URLSearchParams(location.search);
    params.getAll('rarity').forEach(r => $(`[data-filter-rarity="${r}"]`, panel)?.setAttribute('aria-pressed', 'true'));
    if (params.get('heavy')) $('[data-filter-flag="heavy"]', panel)?.setAttribute('aria-pressed', 'true');
    if (params.get('where') && where) where.value = params.get('where');
    if (params.get('q') && text) text.value = params.get('q');
    apply();
  });

  /* ---------- item inspector ---------- */
  const items = $('[data-filter-list="items"]');
  if (items && typeof HTMLDialogElement === 'function') {
    const dialog = document.createElement('dialog');
    dialog.className = 'wk-inspect';
    dialog.setAttribute('aria-labelledby', 'wk-inspect-title');
    document.body.appendChild(dialog);
    let opener = null;
    function open(card) {
      opener = card.querySelector('.wk-item__face');
      const img = card.querySelector('.wk-item__icon img');
      const stats = card.querySelector('.wk-item__stats');
      dialog.className = 'wk-inspect ' + [...card.classList].find(c => c.startsWith('wk-r-'));
      dialog.innerHTML = `
        <button class="wk-inspect__close" type="button" aria-label="Close">✕</button>
        <div class="wk-inspect__body">
          <div class="wk-inspect__icon">${img ? `<img src="${img.src.replace('-96.webp', '-192.webp')}" alt="" width="192" height="192">` : ''}</div>
          <div>
            <div class="wk-inspect__flags">${card.querySelector('.wk-item__flags').innerHTML}</div>
            <h2 id="wk-inspect-title">${card.querySelector('.wk-item__name').textContent}</h2>
            <div class="wk-inspect__stats">
              <div>Value<b>${stats.querySelector('b').textContent}</b></div>
              <div>Weight<b>${stats.querySelector('span').textContent}</b></div>
            </div>
            <div class="wk-inspect__more">${card.querySelector('.wk-item__more').innerHTML}</div>
          </div>
        </div>`;
      dialog.querySelector('.wk-inspect__close').addEventListener('click', () => dialog.close());
      dialog.showModal();
      history.replaceState(null, '', '#' + card.id);
    }
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      history.replaceState(null, '', location.pathname + location.search);
      opener?.focus({ preventScroll: true });
    });
    items.addEventListener('click', e => {
      const card = e.target.closest('.wk-item');
      if (card) open(card);
    });
    // a link like /abyss/wiki/loot/#crown opens that item
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target?.classList.contains('wk-item')) {
      target.hidden = false;
      requestAnimationFrame(() => { target.scrollIntoView({ block: 'center' }); open(target); });
    }
  }

  /* ---------- local tabs (contracts) ---------- */
  $$('[data-tabs]').forEach(box => {
    const tabs = $$('[role="tab"]', box);
    const select = tab => tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        const next = tabs[(i + step + tabs.length) % tabs.length];
        select(next); next.focus();
      });
    });
    select(tabs[0]);
  });

  /* ---------- site search ---------- */
  const input = $('#wk-search'), results = $('#wk-search-results');
  let index = null, active = -1;
  async function load() {
    if (index) return index;
    try { index = await (await fetch('/abyss/wiki/search.json')).json(); }
    catch { index = []; }
    return index;
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function close() { results.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
  async function search() {
    const q = input.value.trim().toLowerCase();
    if (!q) { close(); return; }
    const all = await load();
    const hits = all
      .map(r => ({ r, at: r.t.toLowerCase().indexOf(q) }))
      .filter(h => h.at >= 0 && (!h.r.s || isRevealed(h.r.u.split('/').filter(Boolean).pop()) || h.r.t.toLowerCase().startsWith(q)))
      .sort((a, b) => (a.at !== 0) - (b.at !== 0) || (a.r.k === 'Page' ? -1 : 0) || a.r.t.length - b.r.t.length)
      .slice(0, 8);
    results.innerHTML = hits.length
      ? hits.map((h, i) => `<li role="option" id="wk-hit-${i}" aria-selected="false"><a href="${h.r.u}">${h.r.i ? `<img src="${h.r.i}" alt="" width="36" height="36" loading="lazy">` : '<i aria-hidden="true">#</i>'}<span>${esc(h.r.t)}<small>${esc(h.r.k)}</small></span></a></li>`).join('')
      : '<li class="is-empty">No matches. Try a creature or an item name.</li>';
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = -1;
  }
  if (input && results) {
    input.addEventListener('focus', load, { once: true });
    input.addEventListener('input', search);
    input.addEventListener('keydown', e => {
      const opts = $$('[role="option"]', results);
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Enter') {
        const pick = opts[active] || opts[0];
        if (pick) { e.preventDefault(); location.href = pick.querySelector('a').href; }
        return;
      }
      const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (!step || !opts.length) return;
      e.preventDefault();
      active = (active + step + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
      input.setAttribute('aria-activedescendant', opts[active].id);
    });
    document.addEventListener('click', e => { if (!e.target.closest('.wk-search')) close(); });
    // a hash link to the page you're on: close the inspector-free list and go
    results.addEventListener('click', () => setTimeout(close, 0));
  }

  /* ---------- "on this page" ---------- */
  const tocLinks = $$('.wk-toc a');
  if (tocLinks.length) {
    const heads = tocLinks.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    let queued = false;
    const update = () => {
      queued = false;
      let current = heads[0];
      for (const h of heads) if (h.getBoundingClientRect().top < 160) current = h;
      tocLinks.forEach(a => a.toggleAttribute('aria-current', a.hash === '#' + current.id));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
