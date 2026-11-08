import test from 'node:test';
import assert from 'node:assert/strict';
import { heroMeta, heroLinks, marquee, find, reelsSection, jsonLd } from '../src/sections.js';
import { today, parseRange } from '../src/hours.js';
import { placeholderWarnings } from '../src/checks.js';
import { esc } from '../src/html.js';

const cfg = {
  cafeName: 'A & B "Cafe"', address: 'Lot <1>, Town', perks: ['Wi-Fi', 'To go'], messengerUsername: '123', description: 'd',
  siteUrl: 'https://x.test', ogImage: '/og.jpg', phone: '', grabfoodUrl: '', foodpandaUrl: '', menuCsvUrl: '',
  hours: { mon: '12:00 PM – 12:00 AM', tue: 'Closed' }, socials: { facebook: 'https://fb.test/p?id=1', instagram: '' },
  categoryGroups: { G: ['Iced <Coffee>', 'Pasta'] }, reels: ['https://www.facebook.com/reel/1/'],
};

test('hero text and links: perks joined, empty delivery links omitted, urls escaped', () => {
  assert.equal(heroMeta(cfg), 'Lot <1>, Town · Wi-Fi · To go');
  assert.equal(heroLinks(cfg), '');
  assert.match(heroLinks({ ...cfg, grabfoodUrl: 'https://g.test/?a=1&b=2' }), /href="https:\/\/g\.test\/\?a=1&amp;b=2"/);
});

test('marquee: escapes names, second run hidden from assistive tech, has a pause button', () => {
  const h = marquee(cfg);
  assert.match(h, /Iced &lt;Coffee&gt;/);
  assert.equal((h.match(/aria-hidden="true"><span/g) || []).length >= 1, true);
  assert.match(h, /id="marqToggle"[^>]*aria-pressed="false"/);
  assert.equal(marquee({ ...cfg, categoryGroups: {} }), '');
});

test('find: one hours row per day with data-day, closed days labelled, cafe name escaped in map title', () => {
  const h = find(cfg);
  assert.equal((h.match(/<dt data-day=/g) || []).length, 7);
  assert.match(h, /<dd data-day="tue">Closed<\/dd>/);
  assert.match(h, /<dd data-day="wed">Closed<\/dd>/); // missing day -> Closed
  assert.match(h, /Map showing A &amp; B &quot;Cafe&quot;/);
  assert.doesNotMatch(h, /Lot <1>/);
});

test('reels: focusable labelled region; falls back to page plugin; empty when nothing to show', () => {
  assert.match(reelsSection(cfg), /tabindex="0" role="region" aria-label="Facebook reels/);
  assert.match(reelsSection({ ...cfg, reels: [] }), /plugins\/page\.php/);
  assert.equal(reelsSection({ ...cfg, reels: [], socials: {} }), '');
});

test('json-ld: valid JSON, opening hours as 24h, no phone key when empty, "<" cannot break out of the script tag', () => {
  const h = jsonLd(cfg);
  const body = h.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  assert.doesNotMatch(body, /</);
  const j = JSON.parse(body);
  assert.deepEqual(j.openingHoursSpecification, [{ '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '12:00', closes: '00:00' }]);
  assert.equal('telephone' in j, false);
  assert.deepEqual(j.sameAs, ['https://fb.test/p?id=1']);
});

test('hours helpers', () => {
  assert.deepEqual(parseRange('12:00 PM – 12:00 AM'), [720, 1440]);
  assert.equal(parseRange('Closed'), null);
  // 2026-11-08 is a Sunday in Manila; 2026-11-07T17:00Z is already Sunday 01:00 there
  assert.equal(today(new Date('2026-11-07T17:00:00Z'), 'Asia/Manila'), 'sun');
  assert.equal(today(new Date('2026-11-07T15:00:00Z'), 'Asia/Manila'), 'sat');
});

test('launch checks flag placeholders and pass a finished config', () => {
  assert.equal(placeholderWarnings({ ...cfg, siteUrl: 'https://x.example', storyIsPlaceholder: true }).length, 5);
  const ok = { siteUrl: 'https://senorito.ph', storyIsPlaceholder: false, phone: '0917', grabfoodUrl: 'g', foodpandaUrl: '', menuCsvUrl: 'u' };
  assert.deepEqual(placeholderWarnings(ok), []);
});

test('esc handles quotes and ampersands', () => assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;'));
