# Implementation Plan: Café Menu Site with Messenger Ordering

Based on `PRD.md` v1.0. Café specifics live in `CAFE.md`.

## 1. Stack decision

**Vite + vanilla JS + plain CSS (theme variables), Papa Parse for CSV.** Static build, no framework, no backend.

Why: the PRD allows it, the app is one page with a cart and a form, and a framework adds weight (the 3s mobile target) and template complexity for no gain. Tailwind is skipped; CSS variables from the config cover theming.

Hosting: Cloudflare Pages / Netlify / Vercel (free), on the client's domain.

## 2. Project structure

```
cafe-site-demo/
├── index.html            # shell, meta + Open Graph tags
├── site.config.json      # ALL café-specific values (PRD §8)
├── public/assets/        # logo, hero, og-image, fallback images
├── public/fallback-menu.csv   # bundled menu if sheet + cache both fail
└── src/
    ├── main.js           # boot: load config, apply theme, load menu, render
    ├── config.js         # import config, apply theme CSS vars, fill header/info
    ├── menu.js           # fetch CSV, parse, validate, cache, group by category
    ├── cart.js           # state, localStorage (try/catch), totals
    ├── order.js          # build message, encode, shorten, m.me URL, copy
    ├── hours.js          # open/closed status from config.hours
    ├── ui.js             # render menu, variant picker, cart drawer, checkout form
    └── style.css
```

Small modules, no abstractions beyond this. `order.js` and `menu.js` hold the logic worth testing.

## 3. Key design decisions

| Topic | Decision |
|---|---|
| Config | One `site.config.json`. `Settings` sheet tab is skipped for v1 (PRD marks it optional); revisit if the owner wants to change hours/announcement themselves. |
| Menu cache | `localStorage` entry `{ts, csv}`. Use if younger than 10 min; else fetch; on fetch failure use stale cache; if none, use `fallback-menu.csv`. |
| CSV validation | Per row: require `category`, `name`, `available`. Need either numeric `price` or valid `variants`. Skip bad rows (log to console), never throw. |
| Variants | Parse `label:price` split on `\|`. Cart line key = `name + variant`. |
| Category order | Order of first appearance; items sorted by `sort` within a category. |
| Cart storage | Store only `{name, variant, qty}`, then re-price from the live menu on load. This also handles items that became unavailable or changed price (PRD §11). |
| Message | Exactly the PRD §7 format. `₱` with no decimals unless needed. Omit empty optional fields. |
| Length limit | If encoded text exceeds ~1,800 chars, drop to a compact form (no bullets or per-line prices, a line like "2x Spanish Latte (16oz)"). **Copy order** always copies the full message. |
| Opening Messenger | `window.open` / `location.href` to `https://m.me/<user>?text=<encodeURIComponent>`. Navigating in the same tab is safer in FB/IG in-app browsers. |
| Clipboard | `navigator.clipboard.writeText`, with a `textarea` + `execCommand('copy')` fallback for in-app browsers. |
| Images | `loading="lazy"`, explicit width/height, compressed before commit. |

## 4. Phases

### Phase 0: Discovery (blocking, owner-side)
Fill the `TBD`s in `CAFE.md`. Needed before Phase 3 can be finished. Phases 1–2 can proceed on placeholder data.

### Phase 1: Scaffold + data
1. `npm create vite` (vanilla), add `papaparse`.
2. Write `site.config.json` from `CAFE.md` (placeholders OK).
3. Create the Google Sheet (`Menu` tab per PRD §6) with sample rows, publish as CSV, put the URL in config.
4. `menu.js`: fetch, parse, validate, cache, fallback. Unit tests for parse/validate/variants.

**Done when:** `console.log` shows grouped menu from the live sheet; killing the network shows the cached/fallback menu.

### Phase 2: Core UI
1. Header: name, logo, tagline, hero, View Menu button, open/closed + today's hours (`hours.js`).
2. Menu: sticky category chips with jump links, item cards, tags, sold-out state, variant picker, Add.
3. Cart: floating button (count + total), drawer, qty +/- and remove, localStorage persistence.
4. Mobile-first CSS: 44px tap targets, thumb-reachable cart button, responsive up to desktop.

**Done when:** a full cart can be built on a phone-sized viewport and survives a refresh.

### Phase 3: Checkout → Messenger
1. Form: name, pickup/delivery (address required for delivery; hidden if `delivery: false`), time, note. Labelled fields, inline validation.
2. `order.js`: build message, closed-now note, shorten if long. Unit tests for format, empty-field omission, ₱ formatting, long-order path.
3. **Order via Messenger** + **Copy order** + post-tap note ("Messenger will open with your order. Just tap Send!").
4. Revalidate cart against the latest menu at checkout; flag and remove unavailable items from the total.

**Done when:** tapping the button opens `m.me/<user>` with the exact PRD message on a real phone.

### Phase 4: Info, SEO, polish
1. Info section: address + Maps link, hours per day, contact links (Messenger, phone, IG, FB), optional About.
2. `<title>`, meta description, Open Graph image + tags, `lang`, alt text, focus states, contrast check.
3. Theme from config (colors, font); apply real brand from `CAFE.md`.
4. Image compression pass; Lighthouse mobile check.

### Phase 5: Test + launch
1. Device testing (PRD §13): Android Chrome, iPhone Safari, Samsung Internet, **FB and IG in-app browsers** (m.me link + clipboard).
2. Verify the owner edit loop: change a price in the sheet, see it on the site after the cache window, no redeploy.
3. Deploy to the host, connect the client's domain, accounts in the client's name with the developer as admin.
4. Verify the OG preview with the Facebook Sharing Debugger.
5. Handover: short video on editing the sheet, access list, 30-day bug-fix window.

## 5. Risks

| Risk | Mitigation |
|---|---|
| m.me `text` pre-fill is unreliable on some devices/in-app browsers | Copy order always available + hint; test early in Phase 3, not at the end |
| Published CSV is slow or rate-limited | 10-min cache, stale-on-error, bundled fallback |
| Owner breaks the sheet format | Row-level validation that skips bad rows; short editing guide; data-validation dropdown on `available` |
| Messenger username wrong or page messaging disabled | Verify in Phase 0 by opening `m.me/<user>` on a phone |
| Images too heavy for mobile data | Compress at commit time, lazy-load, size caps in the checklist |

## 6. Out of scope (v1)

Per PRD §2: payments, order DB/admin, accounts, delivery fees, inventory, reservations. Also skipped for now: menu search (nice-to-have), `Settings` sheet tab, analytics.

## 7. Señorito Cafe adjustments

Target café is Señorito Cafe (see `CAFE.md`). These change the generic plan:

| Area | Adjustment |
|---|---|
| Menu seed | `menu.csv` (95 items, 16 categories) is already transcribed. Phase 1 uploads it to the Google Sheet and also copies it to `public/fallback-menu.csv`. |
| Messenger | No username found. Use the numeric page ID: `https://m.me/61563198329329`. Verify pre-fill on a phone in Phase 0, before building checkout. |
| Hours | Daily 12:00 PM – 12:00 AM. `hours.js` must treat 12:00 AM as closing at 24:00 the same day. Test at 11:59 PM, 12:00 AM and 11:59 AM. |
| Delivery | Three channels: in-house rider (the website order), GrabFood, Foodpanda. Show GrabFood and Foodpanda as secondary buttons in the header and checkout. Add `grabfoodUrl` and `foodpandaUrl` to `site.config.json` (hide the button if empty). |
| Payment | GCash is accepted. Mention it in the post-order note ("the café will confirm your order and payment"). No GCash number is stored on the site. |
| Look | Minimalist monochrome: black `#111`, white, light grey `#F2F2F2`. One geometric sans font. Hero: the storefront photo. Logo: `logo.jpg` (ask for a transparent PNG; until then use `mix-blend-mode: multiply` on light backgrounds). |
| No item photos | Cards are text-only by default. Layout must look good without images (PRD treats photos as optional). |
| Long category list | 16 categories won't fit in sticky chips. Use a horizontally scrolling chip row, and group the chips under two headings, **Sip & Brew** (drinks) and **Savor & Bite** (food), matching the printed menus. |
| Flavors | Wings and Flavored Fries need a flavor. v1: flavors listed in the description, customer writes the flavor in the Note field, and the cart shows a hint. If the owner wants required flavors, add a `options` column in v2. |
| Add-ons | Extra Shot, Sub Oatmilk, etc. are separate items for v1. No per-drink attachment. |
| Assets | Compress and move the hero + logo into `public/assets/`. Menu poster images are reference only and are not shipped. |

## 8. Open items

- Remaining `TBD`s in `CAFE.md`: street address, Maps link, phone, GrabFood/Foodpanda links, domain, sheet editor.
- Owner decision on wings/fries flavor handling.
- Confirm the stack (Vite + vanilla) before Phase 1.

## 9. Status (2026-11-08)

| Phase | Status |
|---|---|
| 1 Scaffold + data | Done. Menu parse/validate/cache/fallback with tests. Google Sheet not created yet (needs the owner's account); see `README.md` |
| 2 Core UI | Done. Header, status, chips, menu, variants, cart drawer, localStorage |
| 3 Checkout → Messenger | Done. Form, message, shortening, Copy order, recheck at checkout. Verified in headless Chrome (m.me URL contents) |
| 4 Info, SEO, polish | Done. Info section, OG/meta from config, theme. Lighthouse not run |
| 5 Test + launch | Not done: real-device and FB/IG in-app testing, deploy, domain, handover. See the checklist in `README.md` |

## 10. Changes after review (2026-11-08)

- **Two pages:** `index.html` (hero, about, how ordering works, visit info) and `menu.html` (menu, cart, checkout). Entry scripts `src/home.js` and `src/menu-page.js`. The cart is shared through localStorage.
- **Open/closed indicator removed** at the owner's request (PRD §5.1 and §11 "closed now" note no longer apply). The hours list stays, with today in bold.
- Hero photo is now the full-bleed background of the hero section; the logo in the header is larger (52px).
