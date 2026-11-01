# CLAUDE.md

Casa Lola · Kite House Dakhla — real boutique guest house; sales prototype by MBN DEV, split out of `mounirbeni/mbndev`.

## Commands
```bash
npm install
npm run dev       # http://localhost:3000 — site /, dashboard /admin, guest portal /guest (needs .env, see .env.example)
npm run migrate   # create the DemoState table (also done on first API call)
npm test          # node --test: views/rules, no DB
```

## Layout
- `public/` — static site, no build, `<base href="/">`. Hash-router SPA `js/site.js` (FR/EN/ES, EUR/MAD), `admin.html` + `js/admin.js` (owner + reception roles), `guest.html` + `js/guest.js`.
  **All content is in `public/js/config.js`** (unverified values in `TODO_CONFIRM`, highlighted when the admin "Preview" toggle is on; photos are named placeholders until listed in `PHOTOS`); UI strings `js/i18n.js` (`[fr,en,es]` tuples); data/pricing/availability `js/store.js` (pure `*In(s, …)` ops, `publicView`/`guestView`/`staffView`, seeded relative to today, `mbn-casalola-v1` in localStorage).
- `api/index.js` → `server/app.js` (Express). `server/lib/casalola.js` imports `public/js/store.js` + `config.js` (literal `import()` paths; `includeFiles: public/js/**` in `vercel.json` ships them with the function) so rules are never duplicated. `server/db.js` = `pg` with a Prisma-like API.
- Data: one JSON document in table `DemoState` (slug `casalola`, JSONB, optimistic `version`).

## API (`/api`)
Public `GET /public` (sanitized), `POST /book|request|contact`; guest `POST /guest/login|account`, `GET /guest/state`, `POST /guest/op` (7-day JWT); staff `POST /admin/login` (PIN → 12 h JWT), `GET/PUT /admin/state` (whole-document save, 409 on version conflict → client re-applies its change), `POST /admin/reset` (owner only).
Client: `public/js/remote.js` (polling, save queue); if the API is unreachable every page falls back to the localStorage demo.

## Rules
- Live logins/PINs live only in the database — never put them on the pages or in the README (the `USERS` PINs in `config.js` are offline-seed values only).

## Deploy
Vercel project `casalola-dakhla`, production = `main`; Neon DB `casalola-dakhla`. Env: `DATABASE_URL`, `JWT_SECRET`.
