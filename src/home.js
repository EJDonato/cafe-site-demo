import cfg from '../site.config.json';
import seedCsv from '../menu.csv?raw';
import { loadMenu } from './menu.js';
import { today } from './hours.js';
import { renderBest } from './ui.js';

// The page is fully rendered in HTML; JavaScript only adds what depends on the visitor's clock, taps and the live menu.
document.querySelectorAll(`[data-day="${today(new Date(), cfg.timezone)}"]`).forEach((e) => e.classList.add('today'));

const marquee = document.querySelector('.marquee');
const toggle = document.querySelector('#marqToggle');
toggle?.addEventListener('click', () => {
  const paused = marquee.classList.toggle('paused');
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? 'Resume scrolling categories' : 'Pause scrolling categories');
});

loadMenu({ url: cfg.menuCsvUrl, fallbackCsv: seedCsv, ttlMs: cfg.menuCacheMinutes * 60000 }).then(({ menu }) => renderBest(menu));
