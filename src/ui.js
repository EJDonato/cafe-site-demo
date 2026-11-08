import { DAYS, FULL, today } from './hours.js';
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

export function renderHero(cfg) {
  const links = [
    cfg.grabfoodUrl && `<a class="btn ghost" href="${esc(cfg.grabfoodUrl)}" target="_blank" rel="noopener">GrabFood</a>`,
    cfg.foodpandaUrl && `<a class="btn ghost" href="${esc(cfg.foodpandaUrl)}" target="_blank" rel="noopener">Foodpanda</a>`,
  ].filter(Boolean).join('');
  $('#cta').insertAdjacentHTML('beforeend', links);
  $('#heroMeta').textContent = [cfg.address, ...(cfg.perks || [])].join(' · ');
}

export function renderFind(cfg) {
  const now = today(new Date(), cfg.timezone);
  const rows = DAYS.slice(1).concat('sun').map((d) => {
    const t = d === now ? ' class="today"' : '';
    return `<dt${t}>${FULL[d]}</dt><dd${t}>${esc(cfg.hours[d] || 'Closed')}</dd>`;
  }).join('');
  const q = encodeURIComponent(cfg.mapQuery || cfg.address);
  const link = (href, text) => href && `<a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;
  const s = cfg.socials || {};
  const msg = `https://m.me/${encodeURIComponent(cfg.messengerUsername)}`;
  $('#visit').innerHTML = `
    <h2>Find us</h2>
    <div class="find-grid">
      <div class="map"><iframe title="Map showing ${esc(cfg.cafeName)}" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
      <div class="find-info">
        <h3>Address</h3>
        <p>${esc(cfg.address)}</p>
        <div class="links">${link(cfg.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${q}`, 'Open in Maps')}${link(`https://www.google.com/maps/dir/?api=1&destination=${q}`, 'Directions')}</div>
        <h3>Hours</h3>
        <dl>${rows}</dl>
        <h3>Contact</h3>
        <div class="links">${[link(msg, 'Messenger'), cfg.phone && link(`tel:${cfg.phone}`, esc(cfg.phone)), link(s.facebook, 'Facebook'), link(s.instagram, 'Instagram'), link(s.tiktok, 'TikTok')].filter(Boolean).join('')}</div>
      </div>
    </div>`;
}

/** Facebook reels: embed each URL in cfg.reels, else the page's timeline (needs a public Facebook Page). */
export function renderReels(cfg) {
  const fb = cfg.socials?.facebook;
  const reels = cfg.reels || [];
  const frames = reels.length
    ? `<div class="reels">${reels.map((u, i) => `<iframe title="Facebook reel ${i + 1}" src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&width=267&height=476" width="267" height="476" loading="lazy" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`).join('')}</div>`
    : fb ? `<div class="fb-page"><iframe title="${esc(cfg.cafeName)} on Facebook" src="https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fb)}&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false" width="500" height="640" loading="lazy" allow="encrypted-media"></iframe></div>` : '';
  if (!frames) return;
  $('#reels').innerHTML = `<h2>Watch us on Facebook</h2><p class="lead">We share our drinks, food and café moments on Facebook.</p>${frames}${fb ? `<a class="btn" href="${esc(fb)}" target="_blank" rel="noopener">Follow on Facebook</a>` : ''}`;
}

export function renderCart({ lines, removed, total, count }, cfg, hasFlavor) {
  $('#cartBtn').hidden = !lines.length;
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = peso(total);
  $('#cartBody').innerHTML = (removed.length ? `<p class="warn">Removed (sold out or no longer on the menu): ${removed.map((k) => esc(k.split('\u241F')[1])).join(', ')}</p>` : '')
    + (lines.length
      ? lines.map((l) => `<div class="line"><div class="row"><div><span class="name">${esc(l.item.label)}</span>${l.variantLabel ? `<div class="sub">${esc(l.variantLabel)} · ${peso(l.unit)} each</div>` : `<div class="sub">${peso(l.unit)} each</div>`}</div><span class="price">${peso(l.total)}</span></div>
          <div class="row"><span></span><span class="ctl">${ctl(l.key, l.qty, l.item.label)}</span></div></div>`).join('') + `<div class="total"><span>Total</span><span>${peso(total)}</span></div>`
      : '<p class="muted">Your cart is empty.</p>');
  $('#checkout').hidden = !lines.length;
  const hint = $('#hint');
  hint.hidden = !hasFlavor;
  hint.textContent = hasFlavor ? 'Tip: write your flavor (e.g. Buffalo, Cheese) in the note.' : '';
}
