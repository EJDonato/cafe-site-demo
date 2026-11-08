// Browser smoke test for the kiosk menu, search, deep links and the Messenger message.
// Needs Google Chrome (set CHROME_PATH if it is not in the usual place). Run: npm run build && npm run smoke
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4179;
const base = `http://localhost:${PORT}`;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await wait(250); }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && new URL(m.location().url || base).origin === base && errors.push(m.text()));

  await p.goto(`${base}/menu.html`, { waitUntil: 'networkidle0' });
  assert.equal(await p.$eval('#catTitle', (e) => e.textContent), 'Iced Coffee');
  assert.equal(await p.$$eval('.sk-card', (e) => e.length), 0, 'skeleton replaced');

  // size + quantity sheet -> cart
  await p.click('.card:nth-child(3)');
  await p.click('input[value="1"] + .vl');
  await p.click('[data-q="1"]');
  assert.match(await p.$eval('#addBtn', (e) => e.textContent), /₱298/);
  await p.click('#addBtn');
  assert.match(await p.$eval('#cartBtn', (e) => e.textContent), /2/);
  assert.match(await p.$eval('.card:nth-child(3) .badge', (e) => e.textContent), /^2/);

  // category rail, back button, deep link, search
  await p.click('[data-chip="cat-snacks"]');
  assert.equal(await p.$eval('#catTitle', (e) => e.textContent), 'Snacks');
  await p.goBack();
  await p.waitForFunction(() => document.querySelector('#catTitle').textContent === 'Iced Coffee');
  await p.type('#q', 'wings');
  await p.waitForFunction(() => document.querySelector('#catTitle').textContent === 'Search results');
  assert.equal(await p.$$eval('.card', (e) => e.length), 4);
  assert.match(await p.$eval('#listStatus', (e) => e.textContent), /Search results, 4 items/);
  await p.$eval('#q', (e) => (e.value = ''));
  await p.type('#q', 'zzzz');
  await p.waitForFunction(() => !document.querySelector('#noMatch').hidden);
  assert.equal(await p.$eval('#noMatch', (e) => e.hidden), false);

  // checkout builds the Messenger message
  await p.click('#cartBtn');
  await p.type('[name=name]', 'Ana');
  await p.setRequestInterception(true);
  let nav;
  p.on('request', (r) => { if (r.url().startsWith('https://m.me')) { nav = r.url(); r.abort(); } else r.continue(); });
  await p.click('#checkout button[type=submit]');
  await p.waitForFunction(() => true); // let the intercepted request fire
  for (let i = 0; i < 40 && !nav; i++) await wait(50);
  assert.match(decodeURIComponent(nav), /2x Iced Coffee Cafe Latte \(22oz\) – ₱298/);
  await p.close();

  const d = await browser.newPage();
  await d.setViewport({ width: 390, height: 844, isMobile: true });
  await d.goto(`${base}/menu.html#cat-pasta`, { waitUntil: 'networkidle0' });
  await d.waitForFunction(() => document.querySelector('#catTitle').textContent === 'Pasta');
  assert.equal(await d.$eval('#catTitle', (e) => e.textContent), 'Pasta');

  // home: server-rendered content, no third-party fonts
  const h = await browser.newPage();
  const hosts = new Set();
  h.on('request', (r) => hosts.add(new URL(r.url()).host));
  await h.goto(base, { waitUntil: 'networkidle0' });
  assert.ok(await h.$eval('.meta', (e) => e.textContent.includes('Free Wi-Fi')));
  assert.ok((await h.$$eval('#bestList li a', (e) => e.length)) >= 3, 'best sellers loaded');
  assert.equal(hosts.has('fonts.googleapis.com'), false, 'fonts are self-hosted');
  assert.deepEqual(errors, [], 'no console errors from our own pages');
  console.log('smoke: all checks passed');
} finally {
  await browser.close();
  server.kill();
}
