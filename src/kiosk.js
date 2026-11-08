import { esc, slug, PLUS, MINUS } from './ui.js';
import { peso } from './order.js';
import { itemKey } from './menu.js';

const $ = (s) => document.querySelector(s);
const PLACEHOLDER = '/assets/logo-wide.jpg'; // shown until the sheet's image_url has a photo
const prices = (it) => (it.variants.length ? it.variants.map((v) => v.price) : [it.price]);
const tagHtml = (t) => `<span class="tag ${/^new$/i.test(t) ? 'new' : /best/i.test(t) ? 'best' : ''}">${esc(t)}</span>`;
const img = (it, w) => (it.image
  ? `<img src="${esc(it.image)}" alt="${esc(it.name)}" loading="lazy" decoding="async" width="${w}" height="${w}" />`
  : `<img src="${PLACEHOLDER}" alt="" loading="lazy" decoding="async" width="${w}" height="${w}" />`);

/**
 * Kiosk menu: one category at a time as a grid of cards; tapping a card opens a sheet
 * to pick size + quantity. onAdd(key, qty, label) adds to the cart.
 */
export function initKiosk({ menu, cfg, onAdd }) {
  const entries = menu.categories.flatMap((cat) => cat.items.map((it) => ({ it, cat })));
  entries.forEach((e, i) => { e.i = i; e.search = [e.it.label, e.cat.name, e.it.description, ...e.it.tags].join(' ').toLowerCase(); });
  const bySlug = new Map(menu.categories.map((c) => [slug(c.name), c]));
  const first = slug(menu.categories[0].name);
  let current = bySlug.has(location.hash.slice(1)) ? location.hash.slice(1) : first;
  let cartNow = [];

  // ---- category rail (chips on phones, sticky sidebar on desktop)
  const groupOf = new Map();
  for (const [g, cats] of Object.entries(cfg.categoryGroups || {})) cats.forEach((c) => groupOf.set(c, g));
  let last = null;
  $('#chips').innerHTML = menu.categories.map((c) => {
    const g = groupOf.get(c.name) || '';
    const head = g !== last && g ? `<span class="grp">${esc(g)}</span>` : '';
    last = g;
    return `${head}<a href="#${slug(c.name)}" data-chip="${slug(c.name)}">${esc(c.name)}</a>`;
  }).join('');

  // ---- grid
  const card = ({ it, i }) => {
    const from = Math.min(...prices(it));
    const price = `${prices(it).length > 1 ? 'from ' : ''}${peso(from)}`;
    const tags = it.tags.map(tagHtml).join('') + (it.available ? '' : '<span class="tag sold">Sold out</span>');
    return `<button type="button" class="card${it.available ? '' : ' sold'}" data-i="${i}">
      <span class="card-img${it.image ? '' : ' ph'}">${img(it, 240)}<b class="badge" hidden></b><span class="plus" aria-hidden="true">${PLUS}</span></span>
      <span class="card-name">${esc(it.name)}</span>
      <span class="card-meta"><span class="card-price">${price}</span>${tags}</span>
    </button>`;
  };

  function show() {
    const terms = $('#q').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list, title, sub;
    if (terms.length) {
      list = entries.filter((e) => terms.every((t) => e.search.includes(t)));
      title = 'Search results';
      sub = `${list.length} ${list.length === 1 ? 'item' : 'items'}`;
    } else {
      const cat = bySlug.get(current) || bySlug.get(first);
      list = entries.filter((e) => e.cat === cat);
      title = cat.name;
      sub = `${list.length} ${list.length === 1 ? 'item' : 'items'}`;
    }
    $('#catTitle').textContent = title;
    $('#catSub').textContent = sub;
    $('#listStatus').textContent = `${title}, ${sub}`;
    $('#grid').innerHTML = list.map(card).join('');
    $('#grid').removeAttribute('aria-busy');
    $('#noMatch').hidden = list.length > 0;
    document.querySelectorAll('#chips [data-chip]').forEach((c) => {
      const on = !terms.length && c.dataset.chip === current;
      c.classList.toggle('on', on);
      if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    });
    const on = $('#chips .on');
    if (on) $('#chips').scrollLeft = Math.max(0, on.offsetLeft - ($('#chips').clientWidth - on.offsetWidth) / 2);
    refreshBadges(cartNow);
  }

  /** Quantity bubble on each card: total in the cart across that item's sizes. */
  function refreshBadges(cart) {
    cartNow = cart;
    const qty = new Map(cart.map((e) => [e.key, e.qty]));
    document.querySelectorAll('.card').forEach((el) => {
      const { it } = entries[+el.dataset.i];
      const rows = it.variants.length ? it.variants : [{ label: '' }];
      const n = rows.reduce((s, v) => s + (qty.get(itemKey(it, v.label)) || 0), 0);
      const b = el.querySelector('.badge');
      b.hidden = !n;
      b.innerHTML = `${n}<span class="sr"> in your order</span>`;
    });
  }

  function go(slugName, push) {
    current = slugName;
    $('#q').value = '';
    show();
    if (push) history.pushState(null, '', `#${slugName}`);
    const stage = $('#menu').getBoundingClientRect().top + scrollY - 150;
    if (scrollY > stage) scrollTo({ top: stage });
  }

  $('#chips').addEventListener('click', (e) => {
    const a = e.target.closest('[data-chip]');
    if (!a) return;
    e.preventDefault();
    go(a.dataset.chip, true);
  });
  window.addEventListener('popstate', () => go(bySlug.has(location.hash.slice(1)) ? location.hash.slice(1) : first, false));
  let typing;
  $('#q').addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(() => { show(); $('#chips').scrollLeft = 0; }, 120); });
  $('#grid').addEventListener('click', (e) => {
    const c = e.target.closest('.card');
    if (c) openSheet(+c.dataset.i);
  });

  // ---- item sheet
  const dlg = $('#item');
  let cur = null;
  const unit = () => {
    const { it } = cur.e;
    return it.variants.length ? it.variants[cur.vi].price : it.price;
  };
  function updateAdd() {
    const { it } = cur.e;
    $('#sheetQty').textContent = cur.qty;
    const b = $('#addBtn');
    b.disabled = !it.available;
    b.textContent = it.available ? `Add to order · ${peso(unit() * cur.qty)}` : 'Sold out';
  }
  function openSheet(i) {
    const e = entries[i];
    cur = { e, vi: 0, qty: 1 };
    const { it, cat } = e;
    const rows = it.variants.length
      ? `<fieldset class="vopts"><legend>Choose one</legend>${it.variants.map((v, k) => `<label class="vopt"><input type="radio" name="v" value="${k}"${k === 0 ? ' checked' : ''}${it.available ? '' : ' disabled'} /><span class="vl">${esc(v.label)}</span><b>${peso(v.price)}</b></label>`).join('')}</fieldset>`
      : `<p class="sheet-price">${peso(it.price)}</p>`;
    $('#itemBody').innerHTML = `
      <div class="sheet-img${it.image ? '' : ' ph'}">${img(it, 520)}<button type="button" class="icon sheet-x" id="sheetX" aria-label="Close"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="sheet-body">
        <p class="muted sheet-cat">${esc(cat.name)}</p>
        <h2 id="sheetTitle">${esc(it.name)}${it.tags.map(tagHtml).join('')}</h2>
        ${it.description ? `<p class="desc">${esc(it.description)}</p>` : ''}
        ${rows}
        <div class="sheet-qty"><span>Quantity</span><span class="ctl"><span class="step"><button type="button" data-q="-1" aria-label="Fewer">${MINUS}</button><output id="sheetQty" aria-live="polite">1</output><button type="button" data-q="1" aria-label="More">${PLUS}</button></span></span></div>
      </div>
      <div class="sheet-foot"><button type="button" class="btn primary block" id="addBtn"></button></div>`;
    updateAdd();
    dlg.showModal();
  }
  dlg.addEventListener('change', (e) => { if (e.target.name === 'v') { cur.vi = +e.target.value; updateAdd(); } });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('#sheetX')) return dlg.close();
    const q = e.target.closest('[data-q]');
    if (q) { cur.qty = Math.min(99, Math.max(1, cur.qty + +q.dataset.q)); updateAdd(); return; }
    if (e.target.closest('#addBtn') && cur.e.it.available) {
      const { it } = cur.e;
      const label = it.variants.length ? it.variants[cur.vi].label : '';
      onAdd(itemKey(it, label), cur.qty, `${it.label}${label ? ` (${label})` : ''}`);
      dlg.close();
    }
  });

  show();
  return { refreshBadges };
}
