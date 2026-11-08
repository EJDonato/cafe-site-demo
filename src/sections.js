import { esc } from './html.js';
import { DAYS, FULL, parseRange } from './hours.js';

const link = (href, text, cls = 'btn') => href && `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;

export const heroMeta = (cfg) => [cfg.address, ...(cfg.perks || [])].join(' · ');

export const heroLinks = (cfg) => [link(cfg.grabfoodUrl, 'GrabFood', 'btn ghost'), link(cfg.foodpandaUrl, 'Foodpanda', 'btn ghost')].filter(Boolean).join('');

/** Looping ticker of the real menu categories (config.categoryGroups order). */
export function marquee(cfg) {
  const names = Object.values(cfg.categoryGroups || {}).flat();
  if (!names.length) return '';
  const run = (hidden) => `<div class="marquee-run"${hidden ? ' aria-hidden="true"' : ''}>${names.map((n) => `<span>${esc(n)}</span>`).join('')}</div>`;
  const pause = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const play = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  return `<div class="marquee-track">${run(false)}${run(true)}</div><button type="button" class="marq-toggle" id="marqToggle" aria-pressed="false" aria-label="Pause scrolling categories"><span class="i-pause">${pause}</span><span class="i-play">${play}</span></button>`;
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
    ? `<div class="reels" tabindex="0" role="region" aria-label="Facebook reels, scroll sideways">${reels.map((u, i) => `<iframe title="Facebook reel ${i + 1}" src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&width=267&height=476" width="267" height="476" loading="lazy" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`).join('')}</div>`
    : fb ? `<div class="fb-page"><iframe title="${esc(cfg.cafeName)} on Facebook" src="https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fb)}&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=false" width="500" height="640" loading="lazy" allow="encrypted-media"></iframe></div>` : '';
  if (!frames) return '';
  return `<section id="reels" class="social"><h2>Watch us on Facebook</h2><p class="lead">We share our drinks, food and café moments on Facebook.</p>${frames}${fb ? link(fb, 'Follow on Facebook') : ''}</section>`;
}

/** schema.org CafeOrCoffeeShop for search engines. Only facts present in the config. */
export function jsonLd(cfg) {
  const to24 = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const long = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  const hours = Object.entries(cfg.hours || {}).map(([d, v]) => ({ d, r: parseRange(v) })).filter((x) => x.r)
    .map(({ d, r }) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: long[d], opens: to24(r[0]), closes: to24(r[1]) }));
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: cfg.cafeName,
    description: cfg.description,
    url: cfg.siteUrl,
    image: `${cfg.siteUrl}${cfg.ogImage}`,
    address: { '@type': 'PostalAddress', streetAddress: cfg.address, addressCountry: 'PH' },
    ...(cfg.phone ? { telephone: cfg.phone } : {}),
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    sameAs: Object.values(cfg.socials || {}).filter(Boolean),
    hasMenu: `${cfg.siteUrl}/menu.html`,
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
