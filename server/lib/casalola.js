'use strict';
/**
 * Casa Lola demo, live mode: the server keeps the one real copy of the guest house's data
 * (bookings, guests, requests, messages…) as a JSON document in "DemoState".
 *
 * The booking rules are not duplicated here: they are imported from the demo's own
 * public/js/store.js (pure functions), so the site, the dashboard
 * and the server always agree on availability, prices and policies.
 */
const jwt = require('jsonwebtoken');

const SLUG = 'casalola';

// Vercel compiles traced files to CommonJS, so the import may come back as { default: exports }.
const esm = (m) => (m && m.default && typeof m.default === 'object' && !('seed' in m) && !('ROOMS' in m) ? m.default : m);
// Literal paths on purpose: Vercel's file tracer follows them and ships the demo's ESM files with the function.
let storeModule = null;
/** The demo's ESM data layer (seed, pure ops, views). */
function store() {
  if (!storeModule) storeModule = import('../../public/js/store.js').then(esm).catch((e) => { storeModule = null; throw e; });
  return storeModule;
}
let configModule = null;
function config() {
  if (!configModule) configModule = import('../../public/js/config.js').then(esm).catch((e) => { configModule = null; throw e; });
  return configModule;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
let ensured = null;
function ensureTable(prisma) {
  if (!ensured) {
    const statements = require('../schema');
    ensured = (async () => { for (const sql of statements) await prisma.$executeRawUnsafe(sql); })()
      .catch((err) => { ensured = null; throw err; });
  }
  return ensured;
}

/** Current document, created from the demo seed on first use. → { s, v } */
async function read(prisma) {
  await ensureTable(prisma);
  let rows = await prisma.$queryRaw`SELECT "data", "version" FROM "DemoState" WHERE "slug" = ${SLUG}`;
  if (!rows.length) {
    const { seed } = await store();
    await prisma.$executeRaw`INSERT INTO "DemoState" ("slug", "data", "version") VALUES (${SLUG}, ${JSON.stringify(seed())}::jsonb, 1) ON CONFLICT ("slug") DO NOTHING`;
    rows = await prisma.$queryRaw`SELECT "data", "version" FROM "DemoState" WHERE "slug" = ${SLUG}`;
  }
  return { s: rows[0].data, v: rows[0].version };
}

/**
 * Change the document under a row lock. fn(state, version) mutates `state` and returns a result;
 * return { save: false } to leave the document untouched. → { ...result, s, v }
 */
async function mutate(prisma, fn) {
  await read(prisma);
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`SELECT "data", "version" FROM "DemoState" WHERE "slug" = ${SLUG} FOR UPDATE`;
    const s = rows[0].data;
    let v = rows[0].version;
    const out = (await fn(s, v)) || {};
    if (out.save === false) return { ...out, s, v };
    v += 1;
    await tx.$executeRaw`UPDATE "DemoState" SET "data" = ${JSON.stringify(s)}::jsonb, "version" = ${v}, "updatedAt" = NOW() WHERE "slug" = ${SLUG}`;
    return { ...out, s, v };
  }, { timeout: 20000, maxWait: 10000 });
}

// ─── Tokens (signed with JWT_SECRET, scoped to this demo) ────────────────────
const secret = () => process.env.JWT_SECRET;
const signStaff = (u) => jwt.sign({ p: SLUG, k: 'staff', role: u.role, email: u.email, name: u.name }, secret(), { expiresIn: '12h' });
const signGuest = (guestId) => jwt.sign({ p: SLUG, k: 'guest', g: guestId }, secret(), { expiresIn: '7d' });
function verify(token, kind) {
  try {
    const t = jwt.verify(String(token || ''), secret());
    return t && t.p === SLUG && t.k === kind ? t : null;
  } catch { return null; }
}

// ─── Input cleaning ──────────────────────────────────────────────────────────
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const int = (v, min, max, dflt = min) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt; };
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isEmail = (v) => typeof v === 'string' && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v);

/** Whitelisted booking request from the public site. Prices and payments are always recomputed here. */
async function cleanBooking(body) {
  const C = await config();
  const b = body || {};
  const g = b.guest || {};
  const expIds = new Set(C.EXPERIENCES.map((e) => e.id));
  const ex = b.extras || {};
  const out = {
    room: str(b.room, 40), from: b.from, to: b.to,
    adults: int(b.adults, 1, 3, 1), children: int(b.children, 0, 2, 0), infants: int(b.infants, 0, 1, 0),
    childAges: Array.isArray(b.childAges) ? b.childAges.slice(0, 2).map((a) => int(a, 0, 17, 6)) : [],
    promo: str(b.promo, 30),
    extras: {
      transfer: int(ex.transfer, 0, 2, 0), lateCheckout: ex.lateCheckout === true, occasion: str(ex.occasion, 200),
      experiences: Array.isArray(ex.experiences) ? [...new Set(ex.experiences.filter((x) => expIds.has(x)))] : [],
    },
    payMode: b.payMode === 'deposit' ? 'deposit' : 'arrival',
    arrivalTime: str(b.arrivalTime, 10), notes: str(b.notes, 1000),
    guest: {
      first: str(g.first, 60), last: str(g.last, 60), email: str(g.email, 200).toLowerCase(), phone: str(g.phone, 40),
      country: str(g.country, 2).toUpperCase(), lang: ['fr', 'en', 'es'].includes(g.lang) ? g.lang : 'fr',
      pwHash: /^[a-f0-9]{64}$/.test(g.pwHash || '') ? g.pwHash : undefined,
    },
    source: 'direct', status: 'confirmed', by: 'guest',
  };
  if (!isDate(out.from) || !isDate(out.to)) return { error: 'err.dates' };
  if (!out.guest.first || !out.guest.last || !isEmail(out.guest.email) || out.guest.phone.replace(/\D/g, '').length < 6) return { error: 'err.form' };
  return { payload: out };
}

/** Every live booking keeps its room to itself (a staff save must never create a double booking). */
function doubleBooked(s) {
  const live = (s.bookings || []).filter((b) => !['cancelled', 'no-show'].includes(b.status));
  const byRoom = {};
  live.forEach((b) => { (byRoom[b.room] ||= []).push(b); });
  return Object.values(byRoom).some((list) => list.sort((a, b) => (a.from < b.from ? -1 : 1)).some((b, i) => i > 0 && b.from < list[i - 1].to));
}
function validState(s) {
  if (!s || typeof s !== 'object') return false;
  const arrays = ['rooms', 'bookings', 'guests', 'payments', 'requests', 'messages', 'closures', 'users', 'partners'];
  const objects = ['rates', 'settings', 'reviews', 'housekeeping'];
  return arrays.every((k) => Array.isArray(s[k])) && objects.every((k) => s[k] && typeof s[k] === 'object') && s.rooms.length > 0;
}

module.exports = { SLUG, store, config, read, mutate, ensureTable, signStaff, signGuest, verify, str, int, isDate, isEmail, cleanBooking, doubleBooked, validState };
