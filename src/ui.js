import { peso } from './order.js';

const $ = (s) => document.querySelector(s);
import { esc } from './html.js';
export { esc };
export const slug = (s) => 'cat-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const svg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="${d}"/></svg>`;
export const PLUS = svg('M12 5v14M5 12h14');
export const MINUS = svg('M5 12h14');

/** Cart-line stepper: - qty +. Lines only exist while qty > 0. */
export function ctl(key, qty, name) {
  const k = `data-key="${esc(key)}"`;
  return `<span class="step"><button type="button" data-act="dec" ${k} aria-label="Remove one ${esc(name)}">${MINUS}</button><output aria-label="Quantity">${qty}</output><button type="button" data-act="inc" ${k} aria-label="Add one ${esc(name)}">${PLUS}</button></span>`;
}

/** One best-seller per category (distinct names), linking to its menu section. */
export function renderBest(menu) {
  const seen = new Set();
  const picks = [];
  for (const cat of menu.categories)
    for (const it of cat.items)
      if (it.available && it.tags.some((t) => /best/i.test(t)) && !seen.has(it.name)) {
        seen.add(it.name);
        picks.push({ it, cat });
        break;
      }
  if (picks.length < 3) { $('#best').hidden = true; return; }
  $('#bestList').innerHTML = picks.slice(0, 10).map(({ it, cat }) => {
    const prices = it.variants.length ? it.variants.map((v) => v.price) : [it.price];
    const from = Math.min(...prices);
    return `<li><a href="/menu.html#${slug(cat.name)}"><span class="bn">${esc(it.name)}<small>${esc(cat.name)}</small></span><span class="bp">${prices.length > 1 ? 'from ' : ''}${peso(from)}</span></a></li>`;
  }).join('');
  $('#bestList').removeAttribute('aria-busy');
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
