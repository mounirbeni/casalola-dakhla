# Casa Lola · Kite House Dakhla

Sales prototype by MBN DEV: public direct-booking site, guest portal and admin dashboard.
Static HTML/CSS/JS, no build step, no backend: all data lives in the visitor's browser (`localStorage`),
and open tabs stay in sync through `BroadcastChannel`.

## Live data (shared by every device)
Deployed on Vercel, the demo runs **live**: the server (`server/`, Express as a Vercel function) keeps one real copy
of the data in Postgres (table `DemoState`, created automatically) and every page talks to `/api`:
- a booking made on the site (any phone) appears on the dashboard of the owner on any other device
  (the dashboard refreshes every few seconds), and the room is blocked for everyone at once;
- guest-portal actions (pre-arrival / police form, requests, date change, cancel, messages) reach the dashboard;
- dashboard changes (status, payments, replies, rooms, rates, closures, housekeeping, settings…) are saved on
  the server and seen by the guest and by other staff devices; two staff saving at once never overwrite each
  other, and a save can never create a double booking;
- dashboard login is checked on the server (PIN), sessions last 12 h; reception cannot change rates, users
  or reset; the public site never receives names, contacts, payments or PINs.
- "Reset demo data" (owner) re-creates the demo data on the server and keeps the PINs.
Still simulated: card payment (no real card is charged), confirmation emails (preview only), Booking/Airbnb
iCal sync. If `/api` cannot be reached, the pages fall back to the browser-only demo below.

## Run it
- Live: `/` (site), `/admin` (dashboard), `/guest` (guest portal). Locally: `npm install`, copy `.env.example` to `.env`,
  `npm run dev` → http://localhost:3000. `npm test` runs the rules/views tests (no DB).
- Without the server: serve `public/` with any static server (`npx serve public`) — the pages fall back to the
  browser-only demo. All asset paths are relative; `<base href="/">` at the top of the three HTML files.

## Demo logins
Dashboard and demo-guest logins are not published: MBN DEV hands them out privately. On the live site they are
stored in the database only (the owner can change them in Dashboard → Settings → Users).

| Test cards (simulated payment) | `4242 4242 4242 4242` accepted · `4000 0000 0000 0002` declined |
|---|---|

"Reset demo data" (circular-arrow button in the admin top bar) regenerates everything; bookings are always generated
relative to today, so the demo never looks stale.

## Where to change content
- `js/config.js` — **the only content file**: brand, contacts, the 7 rooms (facts, prices, amenities), seasons,
  policies, offers, extras, experiences, Dakhla guide, FAQ, page texts, legal texts, WhatsApp templates, demo accounts,
  and the `PHOTOS` list. Texts are `{ fr, en, es }`.
- `js/i18n.js` — interface strings (buttons, labels) in French, English and Spanish.
- `css/base.css` — brand colours and fonts as CSS variables at the top (`--ocean`, `--ink`, `--sand`, `--shell`, `--sun`).
- Once the demo is opened, the owner's edits made in the admin (rooms, rates, policies, templates…) are stored in the
  browser; "Reset demo data" goes back to `config.js`.

## Values to confirm (`TODO_CONFIRM` in config.js)
Shown normally on the site. Turn on **Aperçu / Preview** in the admin top bar: every one of them gets a dotted
underline and a "?" on the public site, and a table lists their current values.
- Nightly prices of every room, single-use price, 3rd-adult supplement (Porto Rico)
- Size and bed of La Pointe d'Or, size of Río de Oro
- Child supplement, tourist tax (€/adult/night), EUR→MAD rate
- Seasons and multipliers, minimum stay
- Check-in / check-out times, cancellation days, deposit %, pay-on-arrival, house rules
- Long-stay offer, promo codes, airport-transfer and late-checkout prices
- Selected reviews (texts to be supplied by the owner — no testimonial is invented), activity partners

## Photos to provide
Drop each file in `img/` with exactly this path, then add the path to `PHOTOS` in `js/config.js`
(e.g. `'rooms/dune-blanche-1.jpg'`). Until then the site shows a sand-coloured placeholder with the file name.

| File | Ratio | Where |
|---|---|---|
| `brand/logo.png` | 1:1 | header, footer |
| `home/hero-sunrise.jpg` | 16:9 (mobile crop 4:5) | home hero |
| `home/lola-portrait.jpg` | 4:5 | welcome block |
| `house/breakfast-table.jpg` | 3:2 | La maison |
| `house/terrace.jpg` | 3:2 | La maison |
| `house/rooftop.jpg` | 3:2 | La maison |
| `house/garden.jpg` | 3:2 | La maison |
| `house/kitchen.jpg` | 3:2 | La maison |
| `house/lounge.jpg` | 3:2 | La maison |
| `rooms/dune-blanche-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/dune-blanche-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/dune-blanche-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/dune-blanche-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/dune-blanche-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/imlili-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/imlili-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/imlili-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/imlili-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/imlili-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-pointe-dor-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-pointe-dor-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-pointe-dor-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-pointe-dor-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-pointe-dor-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-sarga-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-sarga-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-sarga-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-sarga-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/la-sarga-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/ile-du-dragon-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/ile-du-dragon-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/ile-du-dragon-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/ile-du-dragon-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/ile-du-dragon-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/porto-rico-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/porto-rico-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/porto-rico-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/porto-rico-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/porto-rico-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/rio-de-oro-1.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/rio-de-oro-2.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/rio-de-oro-3.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/rio-de-oro-4.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `rooms/rio-de-oro-5.jpg` | 3:2 (n°1 also 4:3 card crop) | room cards & room page |
| `experiences/kitesurf.jpg` | 4:3 | experiences |
| `experiences/4x4.jpg` | 4:3 | experiences |
| `experiences/catamaran.jpg` | 4:3 | experiences |
| `experiences/quad.jpg` | 4:3 | experiences |
| `experiences/camel.jpg` | 4:3 | experiences |
| `experiences/fishing.jpg` | 4:3 | experiences |
| `experiences/diving.jpg` | 4:3 | experiences |
| `experiences/yoga-terrace.jpg` | 4:3 | experiences |
| `experiences/horse.jpg` | 4:3 | experiences |
| `experiences/dakhla-city.jpg` | 4:3 | experiences |
| `dakhla/white-dune.jpg` | 16:9 | Dakhla guide |
| `dakhla/dragon-island.jpg` | 16:9 | Dakhla guide |
| `dakhla/lagoon.jpg` | 16:9 | Dakhla guide |
| `dakhla/surf-spot.jpg` | 16:9 | Dakhla guide |
| `gallery/01.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/02.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/03.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/04.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/05.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/06.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/07.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/08.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/09.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/10.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/11.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/12.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/13.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/14.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/15.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/16.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/17.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/18.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/19.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/20.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/21.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/22.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/23.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `gallery/24.jpg` | mixed 3:2 / 4:5 / 1:1 | gallery |
| `instagram/01.jpg` | 1:1 | Instagram strip |
| `instagram/02.jpg` | 1:1 | Instagram strip |
| `instagram/03.jpg` | 1:1 | Instagram strip |
| `instagram/04.jpg` | 1:1 | Instagram strip |
| `instagram/05.jpg` | 1:1 | Instagram strip |
| `instagram/06.jpg` | 1:1 | Instagram strip |

## What is simulated in the demo
Payment (no card data is stored), confirmation email (preview only), channel sync with Booking.com / Airbnb (iCal
settings screen only), map embed (placeholder). Everything else — availability, pricing, no double booking, manual
WhatsApp bookings, requests, messages, housekeeping, police-register export, CSV export — works on the local data.
