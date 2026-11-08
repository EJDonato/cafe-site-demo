import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseMenu, buildIndex, itemKey, loadMenu } from '../src/menu.js';
import { change, priceLines, loadCart } from '../src/cart.js';
import { buildOrder, peso, messengerUrl } from '../src/order.js';
import { parseRange, status, label } from '../src/hours.js';

const seed = readFileSync(new URL('../menu.csv', import.meta.url), 'utf8');
const CSV = `category,name,description,price,variants,image_url,tags,available,sort
Coffee,Latte,,,12oz:140|16oz:160,,Bestseller,TRUE,2
Coffee,Mocha,,150,,,,TRUE,1
Coffee,Broken,,abc,,,,TRUE,
Coffee,Gone,,100,,,,FALSE,
,NoCat,,10,,,,TRUE,
Food,Latte,,99,,,,TRUE,`;

test('parseMenu: validates, orders, labels duplicates', () => {
  const m = parseMenu(CSV);
  assert.deepEqual(m.categories.map((c) => c.name), ['Coffee', 'Food']);
  const coffee = m.categories[0].items.map((i) => i.name);
  assert.deepEqual(coffee, ['Mocha', 'Latte', 'Gone']); // sort col first, Broken skipped
  assert.equal(m.categories[0].items[1].variants[1].price, 160);
  assert.equal(m.categories[0].items[2].available, false);
  assert.equal(m.categories[0].items[1].label, 'Coffee Latte');
});

test('seed menu.csv parses fully', () => {
  const m = parseMenu(seed);
  assert.equal(m.categories.length, 16);
  assert.equal(m.categories.reduce((s, c) => s + c.items.length, 0), 95);
});

test('cart: change, persistence tolerance, repricing', () => {
  const idx = buildIndex(parseMenu(CSV));
  const [coffee] = parseMenu(CSV).categories;
  let cart = change([], itemKey(coffee.items[1], '16oz'), 2);
  cart = change(cart, itemKey(coffee.items[0]), 1);
  cart = change(cart, itemKey(coffee.items[2]), 1); // sold out
  const p = priceLines(cart, idx);
  assert.equal(p.total, 160 * 2 + 150);
  assert.equal(p.removed.length, 1);
  assert.deepEqual(change(cart, itemKey(coffee.items[0]), -1).length, 2);
  assert.deepEqual(loadCart({ getItem: () => '{bad' }), []);
  assert.deepEqual(loadCart({ getItem: () => { throw new Error('x'); } }), []);
});

const base = (lines) => ({
  cafeName: 'Señorito Cafe', lines, total: lines.reduce((s, l) => s + l.total, 0),
  name: 'Ana', type: 'Pickup', address: 'ignored', time: '', note: 'Less ice', source: 'x.com',
});
const line = (label, v, unit, qty) => ({ item: { label }, variantLabel: v, unit, qty, total: unit * qty });

test('order message matches PRD format', () => {
  const o = buildOrder(base([line('Spanish Latte', '16oz', 160, 2), line('Croissant', '', 120, 1)]));
  assert.equal(o.text, `Hi Señorito Cafe! I'd like to order:

• 2x Spanish Latte (16oz) – ₱320
• 1x Croissant – ₱120

Total: ₱440

Name: Ana
Type: Pickup
Note: Less ice

(Sent from x.com)`);
  assert.equal(peso(12.5), '₱12.50');
});

test('delivery includes address; long orders shorten but full stays complete', () => {
  const d = buildOrder({ ...base([line('A', '', 1, 1)]), type: 'Delivery', address: 'Lot 1' });
  assert.match(d.text, /Address: Lot 1/);
  const many = Array.from({ length: 120 }, (_, i) => line(`Item number ${i}`, '16oz', 100, 1));
  const o = buildOrder(base(many));
  assert.ok(o.shortened);
  assert.ok(encodeURIComponent(o.text).length <= 1800);
  assert.ok(o.full.includes('Item number 119'));
  assert.ok(messengerUrl('123', 'a b').endsWith('?text=a%20b'));
});

const H = { mon: '12:00 PM – 12:00 AM', tue: '12:00 PM – 12:00 AM', sun: 'Closed', wed: '6:00 PM – 2:00 AM' };
test('hours: midnight close, spill past midnight, closed days', () => {
  assert.deepEqual(parseRange(H.mon), [720, 1440]);
  assert.equal(status(H, { day: 'mon', mins: 23 * 60 + 59 }).open, true);
  assert.equal(status(H, { day: 'mon', mins: 11 * 60 + 59 }).open, false);
  assert.equal(status(H, { day: 'mon', mins: 12 * 60 }).open, true);
  assert.equal(label(status(H, { day: 'tue', mins: 0 })), 'Closed · Opens today at 12:00 PM');
  assert.equal(status(H, { day: 'thu', mins: 60 }).open, true); // wed 6PM–2AM spills
  assert.equal(label(status(H, { day: 'sat', mins: 600 })), 'Closed · Opens Monday at 12:00 PM');
});

test('loadMenu: cache, stale cache, fallback', async () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const ok = async () => ({ ok: true, text: async () => CSV });
  const bad = async () => { throw new Error('offline'); };
  let t = 0;
  const args = { url: 'u', fallbackCsv: seed, ttlMs: 1000, storage, now: () => t };
  assert.equal((await loadMenu({ ...args, fetchFn: ok })).source, 'network');
  assert.equal((await loadMenu({ ...args, fetchFn: bad })).source, 'cache'); // fresh
  t = 5000;
  assert.equal((await loadMenu({ ...args, fetchFn: bad })).source, 'stale-cache');
  assert.equal((await loadMenu({ ...args, storage: { getItem: () => null, setItem() {} }, fetchFn: bad })).source, 'fallback');
  const html = async () => ({ ok: true, text: async () => '<html>error</html>' });
  assert.equal((await loadMenu({ ...args, fetchFn: html })).source, 'stale-cache');
});
