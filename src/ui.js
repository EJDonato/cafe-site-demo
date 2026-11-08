import { DAYS, FULL, fmt, label, status, clock, parseRange } from './hours.js';
import { peso } from './order.js';
import { itemKey } from './menu.js';

const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slug = (s) => 'cat-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const svg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="${d}"/></svg>`;
const PLUS = svg('M12 5v14M5 12h14');
const MINUS = svg('M5 12h14');

/** Cart controls for one key: a + button, or a - qty + stepper once it's in the cart. */
export function ctl(key, qty, name) {
  const k = `data-key="${esc(key)}"`;
  return qty
    ? `<span class="step"><button type="button" data-act="dec" ${k} aria-label="Remove one ${esc(name)}">${MINUS}</button><output aria-label="Quantity">${qty}</output><button type="button" data-act="inc" ${k} aria-label="Add one ${esc(name)}">${PLUS}</button></span>`
    : `<button type="button" class="add" data-act="inc" ${k} aria-label="Add ${esc(name)}">${PLUS}</button>`;
}

export function renderMenu(menu, cfg) {
  const groupOf = new Map();
  for (const [g, cats] of Object.entries(cfg.categoryGroups || {})) cats.forEach((c) => groupOf.set(c, g));
  let lastGroup = null;
  let chips = '';
  let html = '';
  for (const cat of menu.categories) {
    const g = groupOf.get(cat.name) || '';
    if (g !== lastGroup) {
      lastGroup = g;
      if (g) { chips += `<span class="grp">${esc(g)}</span>`; html += `<h2 class="group" aria-hidden="true">${esc(g)}</h2>`; }
    }
    chips += `<a href="#${slug(cat.name)}" data-chip="${slug(cat.name)}">${esc(cat.name)}</a>`;
    html += `<section id="${slug(cat.name)}" aria-labelledby="${slug(cat.name)}-h"><h2 id="${slug(cat.name)}-h">${esc(cat.name)}</h2><div class="items">`;
    for (const it of cat.items) html += itemHtml(it);
    html += '</div></section>';
  }
  $('#chips').innerHTML = chips;
  $('#menu').innerHTML = html;
  observeChips();
}

const slotBtn = (it) => (it.available ? '' : `<button type="button" class="add" disabled aria-label="Sold out">${PLUS}</button>`);
const ctlSlot = (it, vLabel) =>
  `<span class="ctl" data-ctl="${esc(itemKey(it, vLabel))}" data-name="${esc(it.label + (vLabel ? ` ${vLabel}` : ''))}">${slotBtn(it)}</span>`;

function itemHtml(it) {
  const tag = (t) => `<span class="tag ${/^new$/i.test(t) ? 'new' : /best/i.test(t) ? 'best' : ''}">${esc(t)}</span>`;
  const tags = it.tags.map(tag).join('') + (it.available ? '' : '<span class="tag sold">Sold out</span>');
  const desc = it.description ? `<p class="desc">${esc(it.description)}</p>` : '';
  const cls = `item${it.available ? '' : ' sold'}`;
  const img = it.image ? `<img class="thumb" src="${esc(it.image)}" alt="" loading="lazy" width="72" height="72" />` : '';
  const head = `<div class="name">${esc(it.name)}${tags}</div>`;
  if (it.variants.length > 1) {
    const opts = it.variants.map((v) => `<div class="opt"><span class="ov"><span class="ol">${esc(v.label)}</span><span class="price">${peso(v.price)}</span></span>${ctlSlot(it, v.label)}</div>`).join('');
    return `<article class="${cls}"><div class="top-row"><div>${head}${desc}</div>${img}</div><div class="opts">${opts}</div></article>`;
  }
  const v = it.variants[0]; // 0 or 1 variant: price and + share one row
  const sub = v ? `<p class="desc">${esc(v.label)}${it.description ? ' · ' + esc(it.description) : ''}</p>` : desc;
  return `<article class="${cls} single"><div class="top-row"><div>${head}${sub}</div>${img}<div class="buy"><span class="price">${peso(v ? v.price : it.price)}</span>${ctlSlot(it, v ? v.label : '')}</div></div></article>`;
}

export function refreshControls(cart) {
  const qty = new Map(cart.map((e) => [e.key, e.qty]));
  document.querySelectorAll('[data-ctl]').forEach((el) => {
    if (el.querySelector('[disabled]')) return;
    const n = qty.get(el.dataset.ctl) || 0;
    el.innerHTML = ctl(el.dataset.ctl, n, el.dataset.name);
    el.closest('.opt')?.classList.toggle('in', n > 0);
  });
}

function observeChips() {
  const chips = [...document.querySelectorAll('[data-chip]')];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      chips.forEach((c) => c.classList.toggle('on', c.dataset.chip === e.target.id));
      // Scroll only the chip row. scrollIntoView would also move the page and fight the user's scroll.
      const on = chips.find((c) => c.classList.contains('on'));
      const bar = $('#chips');
      if (on) bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
    }
  }, { rootMargin: '-130px 0px -70% 0px' });
  chips.forEach((c) => { const s = document.getElementById(c.dataset.chip); if (s) io.observe(s); });
}

export function renderHeader(cfg) {
  const s = $('#status');
  const tick = () => {
    const st = status(cfg.hours, clock(new Date(), cfg.timezone));
    s.textContent = label(st);
    s.classList.toggle('open', st.open);
    return st;
  };
  tick();
  setInterval(tick, 60000);
  const links = [
    cfg.grabfoodUrl && `<a class="btn" href="${esc(cfg.grabfoodUrl)}" target="_blank" rel="noopener">GrabFood</a>`,
    cfg.foodpandaUrl && `<a class="btn" href="${esc(cfg.foodpandaUrl)}" target="_blank" rel="noopener">Foodpanda</a>`,
  ].filter(Boolean).join('');
  $('#cta').insertAdjacentHTML('beforeend', links);
  const t = DAYS.includes(clock(new Date(), cfg.timezone).day) ? cfg.hours[clock(new Date(), cfg.timezone).day] : '';
  $('#heroMeta').innerHTML = [cfg.address, t && `Today ${t}`].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
}

export function renderInfo(cfg) {
  const today = clock(new Date(), cfg.timezone).day;
  const rows = DAYS.slice(1).concat('sun').map((d) => {
    const t = d === today ? ' class="today"' : '';
    return `<dt${t}>${FULL[d]}</dt><dd${t}>${esc(cfg.hours[d] || 'Closed')}</dd>`;
  }).join('');
  const msg = `https://m.me/${encodeURIComponent(cfg.messengerUsername)}`;
  const link = (href, text) => href && `<a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;
  const s = cfg.socials || {};
  $('#info').innerHTML = `
    <h2>Visit us</h2>
    <p>${esc(cfg.address)}${cfg.mapsUrl ? ` · <a href="${esc(cfg.mapsUrl)}" target="_blank" rel="noopener">Open in Maps</a>` : ''}</p>
    ${cfg.perks?.length ? `<p class="muted">${cfg.perks.map(esc).join(' · ')}</p>` : ''}
    ${cfg.about ? `<p>${esc(cfg.about)}</p>` : ''}
    <h2>Hours</h2><dl>${rows}</dl>
    <h2>Contact</h2>
    <div class="links">${[link(msg, 'Messenger'), cfg.phone && link(`tel:${cfg.phone}`, esc(cfg.phone)), link(s.facebook, 'Facebook'), link(s.instagram, 'Instagram'), link(s.tiktok, 'TikTok')].filter(Boolean).join('')}</div>`;
}

export function renderCart({ lines, removed, total, count }, cfg, hasFlavor) {
  $('#cartBtn').hidden = !lines.length;
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = peso(total);
  $('#cartBody').innerHTML = (removed.length ? `<p class="warn">Removed (sold out or no longer on the menu): ${removed.map((k) => esc(k.split('␟')[1])).join(', ')}</p>` : '')
    + (lines.length
      ? lines.map((l) => `<div class="line"><div class="row"><div><span class="name">${esc(l.item.label)}</span>${l.variantLabel ? `<div class="sub">${esc(l.variantLabel)} · ${peso(l.unit)} each</div>` : `<div class="sub">${peso(l.unit)} each</div>`}</div><span class="price">${peso(l.total)}</span></div>
          <div class="row"><span></span><span class="ctl">${ctl(l.key, l.qty, l.item.label)}</span></div></div>`).join('') + `<div class="total"><span>Total</span><span>${peso(total)}</span></div>`
      : '<p class="muted">Your cart is empty.</p>');
  $('#checkout').hidden = !lines.length;
  const hint = $('#hint');
  hint.hidden = !hasFlavor;
  hint.textContent = hasFlavor ? 'Tip: write your flavor (e.g. Buffalo, Cheese) in the note.' : '';
}

export function closedNote(cfg) {
  const st = status(cfg.hours, clock(new Date(), cfg.timezone));
  const el = $('#closedNote');
  el.hidden = st.open;
  if (!st.open) el.textContent = `We're closed right now (${label(st).replace('Closed · ', '').toLowerCase()}). You can still send your order. The café will reply when open.`;
  return st;
}
export { parseRange, fmt };
