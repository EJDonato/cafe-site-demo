# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Customers of Señorito Cafe in Lambakin, Marilao, Bulacan, almost all on phones. They arrive from the café's Facebook/Instagram/TikTok, a link shared in chat, or a QR code at the counter. Confirmed groups:
- **Students and young adults**, often ordering for a group.
- **Locals ordering delivery** to their home (in-house rider).
- **Dine-in regulars** already at or near the café, browsing the menu on their phone.

Their job: see the full menu and prices quickly, build an order, and send it to the café without back-and-forth. Secondary users: café staff who receive the order in Messenger, and the owner, who edits the menu in a Google Sheet.

## Product Purpose

A fast, mobile-first menu website that replaces menu images and Facebook posts. Customers browse by category, add items (with sizes) to a cart, enter name, pickup/delivery and optional time/note, and the site opens the café's Messenger chat with the order pre-written. The café confirms availability, total and payment in the chat. Success: orders arrive complete and clear, the menu loads quickly on mobile data, and the owner updates prices without the developer.

## Positioning

Not an ordering platform: no payments, accounts, order database or admin panel. The distinct mechanism is "order goes straight into the café's own Messenger chat, menu edited in a Google Sheet", with no per-order fees and no backend, on the café's own domain. Built as a reusable template for local cafés (PRD.md).

## Operating Context

- Orders and payment confirmation happen in Messenger. GCash is accepted (QR on the printed menu).
- Delivery channels: in-house rider (this site's orders), GrabFood, Foodpanda. Delivery fee is settled in chat.
- Hours: open daily 12:00 PM – 12:00 AM (midnight). For here, to go, delivery. Free Wi-Fi. No outside food or drink.
- Menu source: published Google Sheet CSV with a bundled fallback (`menu.csv`). About 95 items in 16 categories, sizes 16oz/22oz (hot 12oz), tags Bestseller and New.
- Must work in the Facebook and Instagram in-app browsers, Android Chrome, iPhone Safari and Samsung Internet.
- Time zone Asia/Manila; currency ₱.

## Capabilities and Constraints

- Static site, no backend, no customer data stored on a server.
- Messenger link uses the page's numeric ID (`m.me/61563198329329`); pre-fill on real devices is **not yet verified**, so "Copy order" always accompanies it.
- Wing and flavored-fries flavors are not a structured choice yet; customers write the flavor in the note. Owner decision pending.
- Undecided: street address, phone, GrabFood/Foodpanda links, domain, who edits the sheet, tagline.
- Out of scope (v1): payments, order history, accounts, delivery tracking or fees, inventory, reservations.

## Brand Commitments

- Name: **Señorito Cafe** (with ñ). Logo: `cafe images/logo.jpg`, a black wordmark with steam swirl. **Keep the logo as-is**: never recolor, redraw or crop it beyond sizing and the wide header crop already made.
- **Minimalist black and white** identity (logo, interior, printed menus). Binding.
- Menu section names from the printed menus: "Sip & Brew" (drinks) and "Savor & Bite" (food).
- Not binding: the soft blue accent (taken from the storefront door frames) is currently used for tags and selected states; it may be changed.

## Evidence on Hand

- Printed menus (`cafe images/755481883_…jpg`, `cafe images/739139869_…jpg`), transcribed in `menu.csv`.
- Logo and one storefront/interior photo (`cafe images/840642889_…jpeg`, used as hero).
- The café's Facebook post with delivery channels and hours; Instagram `senoritocafe_27`, TikTok `senorito.cafe`.
- **Absent, do not fabricate:** food/drink photos, testimonials, reviews, owner story or "about" copy, phone number, street address, awards or press.

## Product Principles

1. **The order is the product.** Every screen shortens the path from "I want that" to "message sent."
2. **Phone first, thumb first.** Design for one hand on a mid-range phone on mobile data, inside an in-app browser.
3. **The menu is the content.** Prices, sizes and availability must be instantly scannable; nothing decorative competes with them.
4. **No broken moments.** A bad sheet row, offline network or failed pre-fill degrades gracefully (cache, fallback, Copy order).
5. **Template-minded.** Café-specific values stay in `site.config.json` and the sheet, not in code.

## Accessibility & Inclusion

Readable contrast (WCAG AA), alt text on images, labelled form fields, keyboard navigability, tap targets at least 44px, and reduced-motion support. Prices and quantities must stay legible for a broad age range on small screens.
