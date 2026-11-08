const KEY = 'cart-v1';

export function loadCart(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage.getItem(KEY));
    return Array.isArray(v) ? v.filter((e) => e && typeof e.key === 'string' && e.qty > 0) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(cart)); } catch {}
}

/** Returns a new cart with qty changed by delta; drops the line at 0. */
export function change(cart, key, delta) {
  const found = cart.some((e) => e.key === key);
  const next = found ? cart.map((e) => (e.key === key ? { ...e, qty: e.qty + delta } : e)) : [...cart, { key, qty: delta }];
  return next.filter((e) => e.qty > 0).map((e) => ({ ...e, qty: Math.min(e.qty, 99) }));
}

/** Re-prices the cart from the live menu. Sold-out or deleted items go to `removed`, not the total. */
export function priceLines(cart, index) {
  const lines = [];
  const removed = [];
  for (const { key, qty } of cart) {
    const ref = index.get(key);
    if (!ref || !ref.item.available) removed.push(key);
    else lines.push({ key, item: ref.item, variantLabel: ref.variantLabel, unit: ref.unit, qty, total: ref.unit * qty });
  }
  return { lines, removed, total: lines.reduce((s, l) => s + l.total, 0), count: lines.reduce((s, l) => s + l.qty, 0) };
}
