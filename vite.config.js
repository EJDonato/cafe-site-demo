import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const cfg = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf8'));

// Fill {{key}} placeholders in index.html from site.config.json so each café needs no HTML edits.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const configHtml = () => ({
  name: 'config-html',
  transformIndexHtml: (html) =>
    html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = cfg[k] ?? cfg.theme?.[k] ?? '';
      return Array.isArray(v) ? v.map((x) => `<p>${esc(x)}</p>`).join('') : esc(v);
    }),
});

export default defineConfig({
  plugins: [configHtml()],
  build: { rollupOptions: { input: { main: 'index.html', menu: 'menu.html' } } },
});
