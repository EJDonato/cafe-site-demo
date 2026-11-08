# Café Context: Señorito Cafe

> Source of truth for content, brand and config values. Built from the owner's Facebook post, the uploaded photos in `cafe images/`, and the two printed menus.
> Anything marked `TBD` must be confirmed with the owner before launch.

## 1. Identity

| Field | Value |
|---|---|
| Café name | Señorito Cafe (logo reads "SEÑORITO CAFE") |
| Tagline | TBD. Menu headings use "Sip & Brew" (drinks) and "Savor & Bite" (food); could be reused |
| Location | Lambakin, Marilao, Bulacan |
| Service modes | For here · To go · Delivery |
| Perks | Free Wi-Fi. No outside food or drink allowed |
| Owner / contact person | TBD |
| Who edits the Google Sheet | TBD |
| About / story | TBD |

## 2. Contact & channels

| Field | Value |
|---|---|
| Facebook | "Señorito Cafe", `https://www.facebook.com/profile.php?id=61563198329329` |
| Messenger | `https://m.me/61563198329329` (numeric page ID, no username found). **Verify on a phone that it opens the page's chat and pre-fills text** |
| Instagram | `senoritocafe_27` |
| TikTok | `senorito.cafe` |
| Phone | TBD |
| Street address | TBD (only "Lambakin, Marilao, Bulacan" known) |
| Google Maps link | TBD |
| Domain | TBD |

## 3. Hours

**Open daily, 12:00 PM – 12:00 AM (midnight).** Source: storefront sign and Facebook post ("Open until 12 midnight").

Edge case: closing time is midnight, so the open/closed logic must treat 12:00 AM as end of the same day (closes at 24:00), not the start of the next.

## 4. Service

| Question | Answer |
|---|---|
| Pickup / dine-in | Yes (for here, to go) |
| Delivery | Yes, three channels: 💚 GrabFood, 💗 Foodpanda, 🛵 in-house rider |
| Delivery area / fee | TBD (fee handled in chat for v1) |
| Payment | GCash (QR on menu, via InstaPay). Cash presumably, TBD |
| Minimum order / lead time | TBD |
| GrabFood / Foodpanda store links | TBD |

Website orders go through Messenger. For delivery, the "in-house rider" is the channel our order form feeds. GrabFood and Foodpanda are shown as secondary links.

## 5. Brand & look

| Field | Value |
|---|---|
| Style | **Minimalist**. Monochrome black on white, lots of whitespace |
| Logo | `cafe images/logo.jpg`: black wordmark + steam swirl on white. Square JPG, so ask for a transparent PNG/SVG if possible |
| Primary color | `#111111` (black, from logo) |
| Background | `#FFFFFF` / off-white `#F2F2F2` (menu bg is light grey) |
| Accent | Optional soft grey `#D9D9D9` (menu section bars). Storefront has light-blue door frames, so a pale blue accent is possible. TBD |
| Typography | Logo is a geometric, wide sans. Menu uses bold sans headings + a script for sub-labels. Proposal: one geometric sans (e.g. Outfit or Poppins) from Google Fonts. TBD |
| Hero photo | `cafe images/840642889_…_n.jpeg`: storefront interior, black chairs, white walls, "Hello! Welcome" decal, 2048×1152 |
| Mood | Clean, modern, cozy, black-and-white interior with warm pendant lights |
| Tone of copy | Short, friendly, simple |

## 6. Menu

Two printed menu images, fully transcribed into `menu.csv` (seed for the Google Sheet):

| Source image | Content |
|---|---|
| `755481883_…_n.jpg` | **Sip & Brew**: Iced Coffee, Hot Coffee, Non-Coffee, Matcha Series, Fruity Soda, Frappuccino, Customize Drinks |
| `739139869_…_n.jpg` | **Savor & Bite**: Classic Croffles, Premium Croffles, Snacks, Rice Meal, Pasta, Sandwich, Pastry, Chicken Wings, Add-ons |

Summary of structure:
- 95 items across 16 categories.
- **Variants:** Iced drinks and Fruity Soda use 16oz / 22oz. Hot coffee is 12oz only. Frappuccino is 22oz only (stored as a plain price).
- **Tags:** the ☕ bean icon (drinks) and fork icon (food) mean "best sellers" → tag `Bestseller`. Red "New" labels → tag `New`.
- **Add-ons** (Customize Drinks, Add-ons) are listed as ordinary items for v1 (no per-drink attachment).
- **No item photos** in the menu data. Menu shows a few product photos embedded in the poster, but none uploaded separately. Layout should work text-only.

### Menu open questions
- **Chicken wings flavors** (Buffalo, Snow Cheese, Sweet Chili, Honey Butter, Soy Garlic, Teriyaki, BBQ): the item has no flavor variant yet. For v1, flavors are in the description and the customer types the flavor in the order Note. Better option: owner confirms whether flavor should be a required choice.
- **Flavored Fries** flavors (Cheese, BBQ, Sour Cream, Salt): same issue.
- Are prices current? The images come from the café's posts.
- Is anything currently unavailable (set `available=FALSE`)?
- Verify the transcription against the owner's latest menu before launch.

## 7. Assets on hand (`cafe images/`)

| File | Use |
|---|---|
| `logo.jpg` | Header/logo, favicon source, OG image base |
| `840642889_2364252527720803_5450566252119977040_n.jpeg` | Hero image |
| `755481883_926747093817351_5450885876790759913_n.jpg` | Menu reference (drinks) |
| `739139869_1956503468337594_2111959209234334098_n.jpg` | Menu reference (food) |

## 8. Discovery checklist

- [x] Menu with prices (transcribed)
- [x] Logo
- [x] Hero photo
- [x] Hours
- [x] Delivery channels
- [x] Instagram, TikTok, Facebook
- [ ] Messenger link verified on a phone
- [ ] Street address + Maps link + phone
- [ ] GrabFood / Foodpanda links
- [ ] Wings and fries flavor handling decided
- [ ] Domain decision
- [ ] Sheet editor named
- [ ] Transparent logo file (nice to have)
- [ ] Owner OK with accounts in their name, developer as admin

## 9. Decisions log

- 2026-11-08: Target café is Señorito Cafe (Marilao, Bulacan). Replaces the PRD's "012 CAFÉ" example.
- 2026-11-08: Facebook page could not be scraped (login wall). Info taken from the owner's post and uploaded images instead.
