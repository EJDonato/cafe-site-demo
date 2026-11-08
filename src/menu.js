import Papa from 'papaparse';

export const SEP = '␟'; // joins category/name/variant into a cart key

const num = (v) => {
  const s = String(v ?? '').replace(/[₱,\s]/g, '');
  return s !== '' && Number.isFinite(Number(s)) && Number(s) >= 0 ? Number(s) : null;
};

function parseVariants(str) {
  return str
    .split('|')
    .map((p) => {
      const i = p.lastIndexOf(':');
      return i < 1 ? null : { label: p.slice(0, i).trim(), price: num(p.slice(i + 1)) };
    })
    .filter((v) => v && v.label && v.price !== null);
}

/** CSV text -> { categories: [{ name, items }] }. Bad rows are skipped, never thrown. */
export function parseMenu(csv) {
  const { data } = Papa.parse(csv.replace(/^﻿/, '').trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const cats = new Map();
  const all = [];
  data.forEach((row, i) => {
    const t = (f) => String(row[f] ?? '').trim();
    const category = t('category');
    const name = t('name');
    const variants = parseVariants(t('variants'));
    const price = num(t('price'));
    if (!category || !name || (!variants.length && price === null)) {
      console.warn(`Menu row ${i + 2} skipped:`, row);
      return;
    }
    const item = {
      category,
      name,
      description: t('description'),
      price: variants.length ? null : price,
      variants,
      image: /^https?:\/\//i.test(t('image_url')) ? t('image_url') : '',
      tags: t('tags').split(',').map((s) => s.trim()).filter(Boolean),
      available: t('available').toLowerCase() !== 'false',
      sort: num(t('sort')),
      i,
    };
    all.push(item);
    if (!cats.has(category)) cats.set(category, []);
    cats.get(category).push(item);
  });
  // Same name in two categories (e.g. Americano iced/hot): disambiguate in cart and message.
  const counts = {};
  all.forEach((it) => (counts[it.name] = (counts[it.name] || 0) + 1));
  all.forEach((it) => (it.label = counts[it.name] > 1 ? `${it.category} ${it.name}` : it.name));
  return {
    categories: [...cats].map(([name, items]) => ({
      name,
      items: items.sort((a, b) => (a.sort ?? 1e9) - (b.sort ?? 1e9) || a.i - b.i),
    })),
  };
}

/** key -> { item, variantLabel, unit } for every orderable line. */
export function buildIndex(menu) {
  const index = new Map();
  for (const { items } of menu.categories)
    for (const item of items) {
      const opts = item.variants.length ? item.variants : [{ label: '', price: item.price }];
      for (const v of opts) index.set(itemKey(item, v.label), { item, variantLabel: v.label, unit: v.price });
    }
  return index;
}

export const itemKey = (item, variantLabel = '') => [item.category, item.name, variantLabel].join(SEP);

const CACHE_KEY = 'menu-cache-v1';
const read = (s) => {
  try { return JSON.parse(s.getItem(CACHE_KEY)); } catch { return null; }
};

/** Sheet (fresh cache first) -> stale cache -> bundled fallback. Never returns an empty menu. */
export async function loadMenu({ url, fallbackCsv, ttlMs, storage = globalThis.localStorage, fetchFn = fetch, now = Date.now }) {
  const usable = (csv) => {
    const m = parseMenu(csv);
    return m.categories.length ? m : null;
  };
  const cached = url && storage ? read(storage) : null;
  if (url) {
    if (cached?.url === url && now() - cached.ts < ttlMs) {
      const m = usable(cached.csv);
      if (m) return { menu: m, source: 'cache' };
    }
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 8000);
      const res = await fetchFn(url, { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      const m = usable(csv);
      if (!m) throw new Error('No valid menu rows');
      try { storage?.setItem(CACHE_KEY, JSON.stringify({ url, ts: now(), csv })); } catch {}
      return { menu: m, source: 'network' };
    } catch (e) {
      console.warn('Menu fetch failed, using fallback:', e);
      const m = cached?.url === url && usable(cached.csv);
      if (m) return { menu: m, source: 'stale-cache' };
    }
  }
  return { menu: parseMenu(fallbackCsv), source: 'fallback' };
}
