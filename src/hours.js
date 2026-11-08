const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const FULL = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };

export function clock(date = new Date(), timeZone = 'Asia/Manila') {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(date).map((x) => [x.type, x.value]),
  );
  return { day: p.weekday.toLowerCase().slice(0, 3), mins: +p.hour * 60 + +p.minute };
}

/** "12:00 PM – 12:00 AM" -> [720, 1440]. A close at/before open means after midnight (+24h). null = closed. */
export function parseRange(s) {
  const m = [...String(s || '').matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  if (m.length !== 2) return null;
  const [a, b] = m.map(([, h, mi, ap]) => ((+h % 12) + (ap.toUpperCase() === 'PM' ? 12 : 0)) * 60 + +mi);
  return [a, b <= a ? b + 1440 : b];
}

export function fmt(mins) {
  const h = Math.floor(mins / 60) % 24;
  return `${h % 12 || 12}:${String(mins % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function status(hours, { day, mins }) {
  const i = DAYS.indexOf(day);
  const today = parseRange(hours[day]);
  const prev = parseRange(hours[DAYS[(i + 6) % 7]]);
  if (prev && prev[1] > 1440 && mins < prev[1] - 1440) return { open: true, until: prev[1] - 1440 };
  if (today && mins >= today[0] && mins < today[1]) return { open: true, until: today[1] };
  if (today && mins < today[0]) return { open: false, opens: today[0], when: 'today' };
  for (let k = 1; k <= 7; k++) {
    const d = DAYS[(i + k) % 7];
    const r = parseRange(hours[d]);
    if (r) return { open: false, opens: r[0], when: k === 1 ? 'tomorrow' : FULL[d] };
  }
  return { open: false };
}

export function label(s) {
  if (s.open) return `Open now · until ${fmt(s.until)}`;
  return s.opens == null ? 'Closed' : `Closed · Opens ${s.when} at ${fmt(s.opens)}`;
}

export { DAYS, FULL };
