import cfg from '../site.config.json';
import seedCsv from '../menu.csv?raw';
import { loadMenu } from './menu.js';
import { today } from './hours.js';
import { renderBest } from './ui.js';

const root = document.documentElement.style;
root.setProperty('--primary', cfg.theme.primary);
root.setProperty('--accent', cfg.theme.accent);
root.setProperty('--tint', cfg.theme.tint);

// The page is fully rendered in HTML; JavaScript only adds what depends on the visitor's clock and live menu.
document.querySelectorAll(`[data-day="${today(new Date(), cfg.timezone)}"]`).forEach((e) => e.classList.add('today'));
loadMenu({ url: cfg.menuCsvUrl, fallbackCsv: seedCsv, ttlMs: cfg.menuCacheMinutes * 60000 }).then(({ menu }) => renderBest(menu));
