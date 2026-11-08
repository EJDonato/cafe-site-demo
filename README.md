# Señorito Cafe: menu site with Messenger ordering

Static site (Vite + vanilla JS). Menu comes from a published Google Sheet; orders open Messenger pre-filled. See `PRD.md`, `PLAN.md`, `CAFE.md`.

```
npm install
npm run dev      # local dev
npm test         # unit tests (menu parsing, cart, order message, hours)
npm run build    # outputs dist/
```

## Per-café setup
Everything café-specific is in `site.config.json` (name, hours, links, theme, Messenger ID) plus `public/assets/`. `index.html` fills its tags from the config.

## Connect the Google Sheet (needed before launch)
1. Create a Google Sheet, tab named `Menu`, and paste `menu.csv` (columns: `category,name,description,price,variants,image_url,tags,available,sort`). Give the owner edit access.
2. File → Share → Publish to web → `Menu` tab → CSV → Publish.
3. Put the URL in `menuCsvUrl` in `site.config.json`, rebuild, deploy.

Until `menuCsvUrl` is set, the site uses the bundled `menu.csv`. If the sheet is unreachable it uses the last cached menu, then the bundled one.
Owner rules: `price` is a number; `variants` is `16oz:119|22oz:139`; `available` is TRUE/FALSE; bad rows are skipped.

## Before launch checklist
- [ ] Replace `siteUrl` in `site.config.json` with the real domain (Open Graph link previews need it)
- [ ] Add `phone`, `grabfoodUrl`, `foodpandaUrl` (buttons stay hidden while empty); confirm the address and Maps link
- [ ] Open `https://m.me/61563198329329` on a phone and confirm it opens the café's chat and pre-fills the text
- [ ] Test on Android Chrome, iPhone Safari, Samsung Internet, and the FB and IG in-app browsers (m.me link, Copy order)
- [ ] Confirm the menu against the café's current prices
- [ ] Deploy to Cloudflare Pages / Netlify / Vercel (build `npm run build`, output `dist`), connect the domain, accounts in the client's name
- [ ] Check the link preview in the Facebook Sharing Debugger

## Menu photos
Each menu item shows a photo. Put a hosted image link in the `image_url` column of the sheet and it replaces the placeholder (the logo on a grey tile, `public/assets/logo-wide.jpg`). Use roughly square photos at least 400px wide.

## Checks
- `npm test`: unit tests (menu parsing, cart, order message, page builders, hours, launch checks).
- `npm run build && npm run smoke`: browser smoke test of the kiosk menu, search, deep links and the Messenger message (needs Google Chrome; set `CHROME_PATH` if it is not in the usual place).
- `npm run build` prints **[launch check]** warnings while placeholders remain: `siteUrl`, the invented story (`storyIsPlaceholder`), `phone`, delivery links and `menuCsvUrl`. The site is not ready to launch until the build prints none.

## Assets
- Fonts are self-hosted in `public/fonts/` (Outfit, SIL OFL). No third-party font request.
- Hero and food photos have WebP sizes next to the JPG fallback (`hero-800/1200/1600.webp`, `food-N-500/1000.webp`). Regenerate with `cwebp -q 72 -resize <w> 0 in.jpg -o out.webp` when a photo changes.
- `site.config.json` colors are written into the HTML at build time; there is no `theme.font` any more (the font is in `src/style.css`).
- The build also writes `robots.txt`, `sitemap.xml`, canonical links and schema.org `CafeOrCoffeeShop` data from the config.
