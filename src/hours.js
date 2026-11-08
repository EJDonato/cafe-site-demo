const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const FULL = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };

/** Current weekday key ('mon'...) in the café's time zone, used to bold today in the hours list. */
export function today(date = new Date(), timeZone = 'Asia/Manila') {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date).toLowerCase().slice(0, 3);
}

/** "12:00 PM – 12:00 AM" -> [720, 1440] minutes. A close at/before open means after midnight (+24h). null = closed. */
export function parseRange(s) {
  const m = [...String(s || '').matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  if (m.length !== 2) return null;
  const [a, b] = m.map(([, h, mi, ap]) => ((+h % 12) + (ap.toUpperCase() === 'PM' ? 12 : 0)) * 60 + +mi);
  return [a, b <= a ? b + 1440 : b];
}

export { DAYS, FULL };
