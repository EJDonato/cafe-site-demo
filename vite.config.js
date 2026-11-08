import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { esc } from './src/html.js';
import { heroMeta, heroLinks, marquee, find, reelsSection, jsonLd } from './src/sections.js';
import { placeholderWarnings } from './src/checks.js';

const cfg = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf8'));
const siteUrl = String(cfg.siteUrl || '').replace(/\/$/, '');

// Everything visible on first paint is rendered into the HTML here, not by JavaScript.
// {{key}} is escaped text; {{{key}}} is trusted HTML built by src/sections.js.
const html = {
  heroLinks: heroLinks(cfg),
  marquee: marquee(cfg),
  find: find(cfg),
  reelsSection: reelsSection(cfg),
  jsonLd: jsonLd(cfg),
  themeStyle: `<style>:root{--primary:${cfg.theme.primary};--accent:${cfg.theme.accent};--tint:${cfg.theme.tint}}</style>`,
};
const text = {
  heroMeta: heroMeta(cfg),
  heroSrcset: ['800', '1200', '1600'].map((w) => `${cfg.heroImage.replace(/\.\w+$/, '')}-${w}.webp ${w}w`).join(', '),
};

const configHtml = () => ({
  name: 'config-html',
  buildStart() {
    for (const m of placeholderWarnings(cfg)) this.warn(`[launch check] ${m}`);
  },
  transformIndexHtml: (src) =>
    src
      .replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => html[k] ?? '')
      .replace(/\{\{([\w.]+)\}\}/g, (_, k) => {
        const v = text[k] ?? k.split('.').reduce((o, p) => o?.[p], cfg) ?? cfg.theme?.[k] ?? '';
        return Array.isArray(v) ? v.map((x) => `<p>${esc(x)}</p>`).join('') : esc(v);
      }),
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n` });
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n  <url><loc>${siteUrl}/menu.html</loc></url>\n</urlset>\n` });
  },
});

export default defineConfig({
  plugins: [configHtml()],
  build: { rollupOptions: { input: { main: 'index.html', menu: 'menu.html' } } },
});
