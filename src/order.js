const MAX_ENCODED = 1800; // m.me text limit is ~2000; keep headroom

export const peso = (n) => `₱${Number.isInteger(n) ? n : n.toFixed(2)}`;
const lineName = (l) => l.item.label + (l.variantLabel ? ` (${l.variantLabel})` : '');

function compose({ cafeName, lines, total, name, type, address, time, note, source }, compact, hidden = 0) {
  const items = lines.map((l) => (compact ? `• ${l.qty}x ${lineName(l)}` : `• ${l.qty}x ${lineName(l)} – ${peso(l.total)}`));
  if (hidden) items.push(`…+${hidden} more item(s) (not shown, use Copy order)`);
  const details = [
    ['Name', name], ['Type', type], ['Address', type === 'Delivery' ? address : ''], ['Time', time], ['Note', note],
  ].filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v.trim()}`);
  return [
    `Hi ${cafeName}! I'd like to order:`, '', ...items, '', `Total: ${peso(total)}`, '', ...details, '',
    source ? `(Sent from ${source})` : '',
  ].join('\n').trim();
}

/** Returns { text, url-safe text, full }. `full` is always complete (for Copy order). */
export function buildOrder(input) {
  const full = compose(input, false);
  const enc = (t) => encodeURIComponent(t).length;
  if (enc(full) <= MAX_ENCODED) return { full, text: full, shortened: false };
  const compact = compose(input, true);
  if (enc(compact) <= MAX_ENCODED) return { full, text: compact, shortened: true };
  let n = input.lines.length;
  while (n > 1 && enc(compose({ ...input, lines: input.lines.slice(0, n) }, true, input.lines.length - n)) > MAX_ENCODED) n--;
  return { full, text: compose({ ...input, lines: input.lines.slice(0, n) }, true, input.lines.length - n), shortened: true };
}

export const messengerUrl = (username, text) => `https://m.me/${encodeURIComponent(username)}?text=${encodeURIComponent(text)}`;

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // In-app browsers often lack the async clipboard API.
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
}
