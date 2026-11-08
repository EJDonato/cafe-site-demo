import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const cfg = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf8'));

// Fill {{key}} placeholders in index.html from site.config.json so each café needs no HTML edits.
import { esc } from './src/html.js';
import { heroMeta, heroLinks, marquee, find, reelsSection } from './src/sections.js';

// Everything visible on first paint is rendered into the HTML here, not by JavaScript.
// {{key}} is escaped text; {{{key}}} is trusted HTML built by src/sections.js.
const html = { heroLinks: heroLinks(cfg), marquee: marquee(cfg), find: find(cfg), reelsSection: reelsSection(cfg) };
const text = { heroMeta: heroMeta(cfg) };
const configHtml = () => ({
  name: 'config-html',
  transformIndexHtml: (src) =>
    src
      .replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => html[k] ?? '')
      .replace(/\{\{([\w.]+)\}\}/g, (_, k) => {
        const v = text[k] ?? k.split('.').reduce((o, p) => o?.[p], cfg) ?? cfg.theme?.[k] ?? '';
        return Array.isArray(v) ? v.map((x) => `<p>${esc(x)}</p>`).join('') : esc(v);
      }),
});

export default defineConfig({
  plugins: [configHtml()],
  build: { rollupOptions: { input: { main: 'index.html', menu: 'menu.html' } } },
});
