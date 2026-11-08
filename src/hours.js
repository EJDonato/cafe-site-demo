const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const FULL = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };

/** Current weekday key ('mon'...) in the café's time zone, used to bold today in the hours list. */
export function today(date = new Date(), timeZone = 'Asia/Manila') {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date).toLowerCase().slice(0, 3);
}

export { DAYS, FULL };
