import { esc } from './html.js';
import { DAYS, FULL } from './hours.js';

const link = (href, text, cls = 'btn') => href && `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;

export const heroMeta = (cfg) => [cfg.address, ...(cfg.perks || [])].join(' · ');

export const heroLinks = (cfg) => [link(cfg.grabfoodUrl, 'GrabFood', 'btn ghost'), link(cfg.foodpandaUrl, 'Foodpanda', 'btn ghost')].filter(Boolean).join('');

/** Looping ticker of the real menu categories (config.categoryGroups order). */
export function marquee(cfg) {
  const names = Object.values(cfg.categoryGroups || {}).flat();
  if (!names.length) return '';
  const run = (hidden) => `<div class="marquee-run"${hidden ? ' aria-hidden="true"' : ''}>${names.map((n) => `<span>${esc(n)}</span>`).join('')}</div>`;
  return `<div class="marquee-track">${run(false)}${run(true)}</div>`;
}

/** Map + address + hours + contact. Hours rows carry data-day so the page can bold today at runtime. */
export function find(cfg) {
  const rows = DAYS.slice(1).concat('sun').map((d) => `<dt data-day="${d}">${FULL[d]}</dt><dd data-day="${d}">${esc(cfg.hours[d] || 'Closed')}</dd>`).join('');
  const q = encodeURIComponent(cfg.mapQuery || cfg.address);
  const s = cfg.socials || {};
  const msg = `https://m.me/${encodeURIComponent(cfg.messengerUsername)}`;
  return `
    <h2>Find us</h2>
    <div class="find-grid">
      <div class="map"><iframe title="Map showing ${esc(cfg.cafeName)}" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
      <div class="find-info">
        <h3>Address</h3>
        <p>${esc(cfg.address)}</p>
        <div class="links">${link(cfg.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${q}`, 'Open in Maps')}${link(`https://www.google.com/maps/dir/?api=1&destination=${q}`, 'Directions')}</div>
        <h3>Hours</h3>
        <dl>${rows}</dl>
        <h3>Contact</h3>
        <div class="links">${[link(msg, 'Messenger'), cfg.phone && link(`tel:${cfg.phone}`, esc(cfg.phone)), link(s.facebook, 'Facebook'), link(s.instagram, 'Instagram'), link(s.tiktok, 'TikTok')].filter(Boolean).join('')}</div>
      </div>
    </div>`;
}

/** Facebook reels: embed each URL in cfg.reels, else the page's timeline (needs a public Facebook Page). */
export function reelsSection(cfg) {
  const fb = cfg.socials?.facebook;
  const reels = cfg.reels || [];
  const frames = reels.length
    ? `<div class="reels">${reels.map((u, i) => `<iframe title="Facebook reel ${i + 1}" src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&width=267&height=476" width="267" height="476" loading="lazy" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`).join('')}</div>`
    : fb ? `<div class="fb-page"><iframe title="${esc(cfg.cafeName)} on Facebook" src="https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fb)}&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false" width="500" height="640" loading="lazy" allow="encrypted-media"></iframe></div>` : '';
  if (!frames) return '';
  return `<section id="reels" class="social"><h2>Watch us on Facebook</h2><p class="lead">We share our drinks, food and café moments on Facebook.</p>${frames}${fb ? link(fb, 'Follow on Facebook') : ''}</section>`;
}
