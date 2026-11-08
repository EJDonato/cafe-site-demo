/** Things that must be real before the site goes live. Returned as human-readable warnings. */
export function placeholderWarnings(cfg) {
  const w = [];
  if (!cfg.siteUrl || /example|localhost/i.test(cfg.siteUrl)) w.push('siteUrl is a placeholder: link previews, canonical links and the sitemap point to the wrong domain.');
  if (cfg.storyIsPlaceholder) w.push('The "Our story" text is invented placeholder copy. Replace `story` and set `storyIsPlaceholder` to false.');
  if (!cfg.phone) w.push('phone is empty.');
  if (!cfg.grabfoodUrl && !cfg.foodpandaUrl) w.push('grabfoodUrl and foodpandaUrl are empty, so the delivery-app buttons are hidden.');
  if (!cfg.menuCsvUrl) w.push('menuCsvUrl is empty: the site uses the bundled menu.csv, so Google Sheet edits will not show.');
  return w;
}
