import cfg from '../site.config.json';
import seedCsv from '../menu.csv?raw';
import { loadMenu, buildIndex } from './menu.js';
import { loadCart, saveCart, change, priceLines } from './cart.js';
import { buildOrder, messengerUrl, copyText } from './order.js';
import { renderCart } from './ui.js';
import { initKiosk } from './kiosk.js';

const $ = (s) => document.querySelector(s);
const root = document.documentElement.style;
root.setProperty('--primary', cfg.theme.primary);
root.setProperty('--accent', cfg.theme.accent);
root.setProperty('--tint', cfg.theme.tint);

$('#deliveryOpt').hidden = !cfg.delivery;

let index = new Map();
let cart = loadCart();
let view;
let kiosk;
let ready = false; // don't prune the saved cart until the menu has loaded

function sync() {
  view = ready ? priceLines(cart, index) : priceLines([], index);
  if (view.removed.length) {
    cart = cart.filter((e) => !view.removed.includes(e.key)); // drop sold-out lines, warning stays shown this render
  }
  saveCart(cart);
  renderCart(view, cfg, view.lines.some((l) => /flavor/i.test(l.item.name + l.item.description)));
  kiosk?.refreshBadges(cart);
  if (!view.lines.length && $('#cart').open && !view.removed.length) $('#cart').close();
}

let toastTimer;
function onAdd(key, qty, label) {
  cart = change(cart, key, qty);
  sync();
  const t = $('#toast');
  t.textContent = `Added ${qty > 1 ? qty + '× ' : ''}${label}`;
  t.hidden = false;
  t.style.animation = 'none'; t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2000);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (b) { cart = change(cart, b.dataset.key, b.dataset.act === 'inc' ? 1 : -1); sync(); }
});
$('#cartBtn').addEventListener('click', () => $('#cart').showModal());
$('#cartClose').addEventListener('click', () => $('#cart').close());
$('#clearBtn').addEventListener('click', () => { cart = []; sync(); });

const form = $('#checkout');
const typeOf = () => form.elements.type.value;
form.addEventListener('change', () => { $('#addrRow').hidden = typeOf() !== 'Delivery'; });

function collect() {
  const f = form.elements;
  const err = $('#formErr');
  const bad = [];
  if (!f.name.value.trim()) bad.push(f.name);
  if (typeOf() === 'Delivery' && !f.address.value.trim()) bad.push(f.address);
  [f.name, f.address].forEach((x) => x.classList.toggle('bad', bad.includes(x)));
  err.hidden = !bad.length;
  if (bad.length) { err.textContent = bad[0] === f.name ? 'Please enter your name.' : 'Please enter your delivery address.'; bad[0].focus(); return null; }
  const fresh = priceLines(cart, index); // re-check against the latest menu
  if (!fresh.lines.length) { sync(); return null; }
  if (fresh.removed.length) sync();
  return buildOrder({
    cafeName: cfg.cafeName, lines: fresh.lines, total: fresh.total, name: f.name.value, type: typeOf(),
    address: f.address.value, time: f.time.value, note: f.note.value, source: location.host || '',
  });
}

const after = (t) => { const a = $('#after'); a.hidden = false; a.textContent = t; };
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const o = collect();
  if (!o) return;
  after('Messenger will open with your order. Just tap Send! The café will confirm your order and payment. If the message is empty, tap Copy order and paste it into the chat.' + (o.shortened ? ' Your order was long, so the chat message is shortened. Use Copy order for the full list.' : ''));
  location.href = messengerUrl(cfg.messengerUsername, o.text);
});
$('#copyBtn').addEventListener('click', async () => {
  const o = collect();
  if (o) after((await copyText(o.full)) ? 'Order copied! Paste it into your Messenger chat with us.' : 'Could not copy automatically. Please select and copy your order manually.');
});

sync();
// No top-level await: older in-app browsers (FB/IG on old iOS) can't run it.
loadMenu({ url: cfg.menuCsvUrl, fallbackCsv: seedCsv, ttlMs: cfg.menuCacheMinutes * 60000 }).then(({ menu }) => {
  index = buildIndex(menu);
  ready = true;
  kiosk = initKiosk({ menu, cfg, onAdd });
  sync();
});

