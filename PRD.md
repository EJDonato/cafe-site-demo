# PRD: Café Menu Website with Messenger Ordering

**Owner:** Elton James Donato
**Version:** 1.0, Nov 8, 2026
**Status:** Draft
**Type:** Reusable template, customized per café client

---

## 1. Overview

Many local cafés share their menu as a Canva link, Google Drive file, image, or Facebook post, and take orders through Messenger. That makes it hard for customers to browse the menu and order, and it gives staff messy, incomplete orders.

This product is a **simple, fast, mobile-first website** for a café. It shows the full menu, lets customers build an order in a cart, and sends that order **pre-filled into the café's Messenger chat**. The café updates its menu by editing a **Google Sheet**. There is no admin panel, database or payment system.

It is built as a **reusable template**, so each new café is a quick customization instead of a new build.

## 2. Goals

| Goal | How we measure it |
|---|---|
| Customers can see the full menu instantly on their phone | Menu loads in under 3 seconds on mobile data |
| Customers can order without back-and-forth | Order arrives in Messenger with items, quantities, total, name and pickup/delivery details |
| The café can update the menu without the developer | Owner changes a price in the Google Sheet and the site updates without a redeploy |
| Cheap and easy to maintain | Static hosting. The only recurring cost for the client is the domain. |
| Fast to build for each new client | New café set up from the template in 1–3 days |

### Non-goals (out of scope for v1)
- Online payments (GCash, cards, etc.)
- An order database, order history or an admin dashboard
- User accounts or logins
- Delivery tracking or fee calculation
- Inventory or stock management
- Reservations or event booking

These are possible **Phase 2 paid upgrades** (see Section 12).

## 3. Users

| User | Needs |
|---|---|
| **Customer** (mostly on mobile, via FB/IG link or QR code) | See the menu and prices clearly, pick items, and send an order quickly |
| **Café owner/staff** | Receive clear, complete orders in Messenger and update the menu easily |
| **Developer (Elton)** | Reuse one codebase and set up new cafés quickly with little maintenance |

## 4. User Flows

### 4.1 Customer: browse and order
1. Opens the site from an FB/IG link, Google Maps or a QR code at the counter.
2. Sees the café name, hero photo and an "Order Now" or "View Menu" button.
3. Browses the menu by category (e.g. Coffee, Non-Coffee, Pastries, Meals).
4. Taps **Add** on an item, picks a variant if there is one (size, hot/iced) and adjusts the quantity.
5. Opens the cart and reviews the items and total.
6. Enters their **name**, chooses **Pickup or Delivery**, and adds a **preferred time** and an optional **note**. Delivery orders also need an **address**.
7. Taps **Order via Messenger**. Messenger opens with the order already written.
8. Sends the message. The café confirms availability, total and payment in the chat.

### 4.2 Owner: update the menu
1. Opens the shared Google Sheet.
2. Edits a price, adds an item or marks an item unavailable.
3. The site shows the change the next time someone loads it, within the cache window.

## 5. Features & Requirements

### 5.1 Home / header
- Café name, logo, one hero image and a short tagline.
- Primary button: **View Menu / Order Now**.
- Quick info: today's hours with an open/closed indicator, and the location.

### 5.2 Menu
- Items grouped by **category**, with sticky category tabs or chips that jump to each section.
- Each item shows: **name, price, optional photo, optional short description, optional tags** (e.g. "Bestseller", "New").
- **Variants** (optional), e.g. size (12oz / 16oz) or temperature (Hot / Iced), each with its own price.
- Unavailable items are greyed out with a "Sold out" label and can't be added.
- Optional search box (nice to have).

### 5.3 Cart
- Add, remove and change quantity.
- Shows the line totals and the **grand total** in ₱.
- The cart is saved in the browser (localStorage), so it survives a page refresh. Wrap storage reads and writes in try/catch.
- A floating cart button shows the item count and total.

### 5.4 Checkout → Messenger
- Form fields:
  - **Name** (required)
  - **Pickup or Delivery** (required)
  - **Address** (required if Delivery)
  - **Preferred time** (optional)
  - **Note** (optional)
- The **Order via Messenger** button builds the order message (format in Section 7), URL-encodes it and opens:
  `https://m.me/<PAGE_USERNAME>?text=<ENCODED_MESSAGE>`
- A **Copy order** button copies the same message to the clipboard, as a fallback in case the pre-fill doesn't appear on a device.
- After the button is tapped, show a short note: *"Messenger will open with your order. Just tap Send! The café will confirm your order and payment."*

### 5.5 Info section
- Address with a Google Maps link or embed
- Opening hours for each day
- Contact: Messenger, phone, Instagram, Facebook
- Optional: an "About us" paragraph and a few photos

### 5.6 Menu management (Google Sheet)
- The menu lives in **one Google Sheet** owned by the café.
- The site reads the sheet's **published CSV** (File → Share → Publish to web → CSV).
- Cache the result for a short time (e.g. 5–10 minutes) so the site stays fast.
- If the sheet can't be reached, show the **last cached menu**, or a bundled fallback menu, rather than an empty page.

## 6. Data Model (Google Sheet)

**Tab: `Menu`**

| Column | Type | Required | Example | Notes |
|---|---|---|---|---|
| `category` | text | Yes | Coffee | Sections appear in the order they first appear in the sheet |
| `name` | text | Yes | Spanish Latte | |
| `description` | text | No | Espresso, milk, condensed milk | |
| `price` | number | Yes* | 140 | Base price. Leave blank if the item uses variants |
| `variants` | text | No | 12oz:140 \| 16oz:160 | `label:price` pairs separated by `\|` |
| `image_url` | url | No | https://… | A hosted image link |
| `tags` | text | No | Bestseller, Iced | Comma-separated |
| `available` | TRUE/FALSE | Yes | TRUE | FALSE shows "Sold out" |
| `sort` | number | No | 1 | Optional order within a category |

**Tab: `Settings`** (optional, otherwise use the config file)

| key | value |
|---|---|
| `messenger_username` | 012Cafe |
| `hours_mon` … `hours_sun` | 8:00 AM – 9:00 PM |
| `delivery_enabled` | TRUE |
| `announcement` | Closed on Nov 30 for a private event |

## 7. Messenger Order Message Format

```
Hi [Café Name]! I'd like to order:

• 2x Spanish Latte (16oz) – ₱320
• 1x Ham & Cheese Croissant – ₱120

Total: ₱440

Name: Ana
Type: Pickup
Time: 3:00 PM
Note: Less ice please

(Sent from [cafe-website.com])
```

**Rules:**
- Format prices as `₱` with no decimals unless needed.
- Leave out empty optional fields.
- Keep the encoded message well under the m.me text parameter limit (about 2,000 characters). If an order is very large, shorten it (e.g. drop descriptions) and still offer **Copy order**.
- Add the source line so the café knows the order came from the website.

## 8. Per-Client Configuration

Everything café-specific lives in **one config file** (e.g. `site.config.json`), so a new client doesn't need code changes:

```json
{
  "cafeName": "012 CAFÉ",
  "tagline": "Your daily cup in Ema Town",
  "logo": "/assets/logo.png",
  "heroImage": "/assets/hero.jpg",
  "messengerUsername": "012Cafe",
  "menuCsvUrl": "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
  "address": "…",
  "mapsUrl": "https://maps.google.com/…",
  "phone": "…",
  "socials": { "facebook": "…", "instagram": "…" },
  "hours": { "mon": "8:00 AM – 9:00 PM", "sun": "Closed" },
  "delivery": true,
  "theme": { "primary": "#6B4226", "accent": "#F4E1C1", "font": "…" }
}
```

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | Fast on mobile data. Load the first screen in under 3s. Compress and lazy-load images. |
| **Mobile-first** | Designed for phones first. Tap targets at least 44px. Cart reachable with one thumb. |
| **Responsive** | Works on phones, tablets and desktop. |
| **Accessibility** | Readable contrast, alt text on images, labelled form fields, keyboard navigable. |
| **Browser support** | Latest Chrome, Safari (iOS), Samsung Internet and Facebook/Instagram in-app browsers. |
| **SEO basics** | Page title, meta description, Open Graph image (for nice FB/Messenger link previews), café name and location in the content. |
| **Reliability** | No backend. A cached or fallback menu if the sheet is unreachable. |
| **Privacy** | No customer data stored on a server. Order details only go into the customer's own Messenger message. |

## 10. Suggested Tech Stack

- **Frontend:** a static site (e.g. Astro, Vite + vanilla JS, or Next.js static export). Pick whichever is fastest for you to template.
- **Styling:** Tailwind CSS or plain CSS with theme variables from the config.
- **Menu data:** the published Google Sheet CSV, parsed in the browser (e.g. with Papa Parse) with a short cache.
- **Hosting:** free static hosting (e.g. Netlify, Vercel, Cloudflare Pages or GitHub Pages), connected to the **client's own domain**.
- **Analytics (optional):** a lightweight, privacy-friendly tool to count visits and "Order via Messenger" taps for the case study.

## 11. Edge Cases

| Case | Expected behavior |
|---|---|
| Messenger pre-fill doesn't appear on a device | Customer uses **Copy order** and pastes it. Show a hint. |
| Customer has no Messenger app | The m.me link opens Messenger on the web. Copy order is still available. |
| Item marked unavailable after it's in a cart | On checkout, flag it and remove it from the total |
| Sheet has a typo (e.g. price not a number) | Skip or hide that item. Don't break the page. |
| Very large order | Message shortened. Copy order still offered. |
| Café is closed now | Show "Closed. Opens at X." Ordering is still allowed, with a note that the café will reply when open (configurable). |
| In-app browser (FB/IG) | Test that the m.me link and clipboard work inside it |

## 12. Phase 2 (Paid Upgrades)

- Online ordering with an **order database** and an **admin dashboard** (view, accept and complete orders)
- **Online payment** (e.g. GCash or payment links)
- **Pre-orders** for cakes and bulk orders, with pickup dates
- **Reservations and event booking**
- **Loyalty** points or stamps
- **Multi-branch** support (choose a branch, with branch-specific menus)
- Simple **sales reports** from website orders

## 13. Acceptance Criteria (v1)

- [ ] Menu loads from the café's Google Sheet, grouped by category, with prices in ₱
- [ ] Owner edits the sheet and the site shows the change within the cache window, without a redeploy
- [ ] Sold-out items can't be added to the cart
- [ ] Cart supports add, remove and quantity changes, and keeps its contents after a refresh
- [ ] Checkout requires a name and pickup/delivery, plus an address for delivery
- [ ] "Order via Messenger" opens the café's chat with the correctly formatted order message
- [ ] "Copy order" copies the same message
- [ ] Tested on Android Chrome, iPhone Safari, and the FB and IG in-app browsers
- [ ] Hours, location and contact info are shown and correct
- [ ] Link preview (Open Graph) shows the café name and image when shared on Facebook or Messenger
- [ ] Deployed on the client's domain, with accounts in the client's name and the developer as admin

## 14. Milestones (per client)

| Step | Output | Time |
|---|---|---|
| 1. Discovery | Menu, photos, logo, hours, Messenger username, domain | Day 0 |
| 2. Setup | Config filled, Google Sheet created and shared with the owner | Day 1 |
| 3. Build & theme | Branded site on a preview link | Day 1–2 |
| 4. Review | 1 round of revisions | Day 2–4 |
| 5. Launch | Live on the domain, tested on devices | Day 4–5 |
| 6. Handover | Sheet editing guide (short video), access, 30-day bug-fix period | Launch day |

## 15. Open Questions

- Does the café do delivery, and if so, within what area? (The delivery fee is handled in chat for v1.)
- Do they want item photos for every item, or text only for some categories?
- Is there an existing domain, or do we register a new one?
- Who on the café side will update the Google Sheet?
