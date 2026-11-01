/* Casa Lola — data layer, shared by the browser and the server (backend/src/lib/casalola.js).
   - Live mode (normal): the server keeps the one real copy in Postgres; pages fill `db` with the
     slice they may see (public, one guest, or staff) through js/remote.js.
   - Local mode (no API reachable, e.g. the folder opened on a plain static host): localStorage +
     BroadcastChannel, exactly like a standalone demo.
   The functions ending in `In(s, …)` are pure: they change the state they are given. */
import * as C from './config.js';

const KEY = 'mbn-casalola-v1';
const VERSION = 1;
const clone = (x) => JSON.parse(JSON.stringify(x));

/* ---------- Dates (ISO YYYY-MM-DD, local) ---------- */
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
/** Today in Morocco (the house's time zone), whatever the device or server clock is set to. */
export const today = () => {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch { return iso(new Date()); }
};
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export const nightsList = (from, to) => { const out = []; for (let d = from; d < to; d = addDays(d, 1)) out.push(d); return out; };
const overlaps = (a1, a2, b1, b2) => a1 < b2 && b1 < a2; // half-open [a1,a2) vs [b1,b2)

/* ---------- Statuses & sources ---------- */
export const STATUSES = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'];
export const SOURCES = ['direct', 'whatsapp', 'phone', 'instagram', 'walkin', 'booking', 'airbnb'];
export const OTA = ['booking', 'airbnb'];
const FREEING = ['cancelled', 'no-show'];

/* ---------- Seed (relative to today, deterministic) ---------- */
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

const SEED_GUESTS = [
  ['Elena', 'Martín', 'ES', 'es', 'guest@demo.com', '+34 612 345 678', ['returning']],
  ['Javier', 'Ruiz', 'ES', 'es', 'javier.ruiz@example.es', '+34 655 102 330', ['kiter']],
  ['Lucía', 'Fernández', 'ES', 'es', 'lucia.f@example.es', '+34 699 210 455', ['family']],
  ['Camille', 'Dubois', 'FR', 'fr', 'camille.dubois@example.fr', '+33 6 12 34 56 78', ['kiter']],
  ['Thomas', 'Leroy', 'FR', 'fr', 'thomas.leroy@example.fr', '+33 7 81 22 90 14', ['remote']],
  ['Inès', 'Moreau', 'FR', 'fr', 'ines.moreau@example.fr', '+33 6 40 11 72 09', ['family']],
  ['Youssef', 'El Amrani', 'MA', 'fr', 'youssef.elamrani@example.ma', '+212 661 234 567', ['business']],
  ['Salma', 'Bennani', 'MA', 'fr', 'salma.bennani@example.ma', '+212 662 778 190', []],
  ['Karim', 'Tazi', 'MA', 'fr', 'karim.tazi@example.ma', '+212 670 455 812', ['business']],
  ['Lukas', 'Becker', 'DE', 'en', 'lukas.becker@example.de', '+49 151 2345 6789', ['kiter']],
  ['Anna', 'Schmidt', 'DE', 'en', 'anna.schmidt@example.de', '+49 160 9876 5432', ['remote']],
  ['Oliver', 'Hughes', 'GB', 'en', 'oliver.hughes@example.co.uk', '+44 7700 900123', ['kiter']],
  ['Emily', 'Clarke', 'GB', 'en', 'emily.clarke@example.co.uk', '+44 7700 900456', []],
  ['Giulia', 'Romano', 'IT', 'en', 'giulia.romano@example.it', '+39 347 123 4567', ['family']],
  ['Marco', 'Bianchi', 'IT', 'en', 'marco.bianchi@example.it', '+39 333 765 4321', ['kiter']],
  ['Sanne', 'de Vries', 'NL', 'en', 'sanne.devries@example.nl', '+31 6 1234 5678', ['remote']],
  ['Daan', 'Jansen', 'NL', 'en', 'daan.jansen@example.nl', '+31 6 8765 4321', ['kiter']],
  ['Pablo', 'Navarro', 'ES', 'es', 'pablo.navarro@example.es', '+34 611 908 776', ['remote']],
  ['Claire', 'Petit', 'FR', 'fr', 'claire.petit@example.fr', '+33 6 77 01 45 32', []],
  ['Hamza', 'Alaoui', 'MA', 'fr', 'hamza.alaoui@example.ma', '+212 654 300 111', []],
];
const COUNTRY_NAT = { ES: 'Española', FR: 'Française', MA: 'Marocaine', DE: 'Deutsch', GB: 'British', IT: 'Italiana', NL: 'Nederlandse' };

function baseState() {
  return {
    v: VERSION,
    seq: 43,
    rooms: clone(C.ROOMS).map((r) => ({ ...r, desc: r.desc || { fr: `${r.floor.fr}. ${r.decor.fr}.`, en: `${r.floor.en}. ${r.decor.en}.`, es: `${r.floor.es}. ${r.decor.es}.` } })),
    rates: { seasons: clone(C.SEASONS), longStay: clone(C.OFFERS.longStay), promoCodes: clone(C.OFFERS.promoCodes), ...clone(C.PRICING), extras: clone(C.EXTRAS) },
    settings: { ...clone(C.POLICIES), contact: clone(C.CONTACT), templates: clone(C.TEMPLATES), ical: { export: 'https://kitehousedakhla.com/ical/casa-lola.ics', imports: [{ name: 'Booking.com', url: '' }, { name: 'Airbnb', url: '' }] }, langs: ['fr', 'en', 'es'] },
    reviews: { google: clone(C.REVIEWS.google), selected: clone(C.REVIEWS.selected), asked: [] },
    partners: clone(C.PARTNERS),
    users: clone(C.USERS),
    bookings: [], guests: [], payments: [], requests: [], messages: [], closures: [], housekeeping: {}, log: [],
  };
}

export function seed() {
  const s = baseState();
  const r = rng(424242);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const t0 = today();
  s.guests = SEED_GUESTS.map(([first, last, country, lang, email, phone, tags], i) => ({
    id: `g${i + 1}`, first, last, country, lang, email, phone, tags, notes: '', marketing: r() > 0.4, createdAt: addDays(t0, -60 - i),
  }));
  s.guests[0].notes = 'Prefers Dune Blanche. Coffee without sugar.';
  s.rooms.forEach((rm) => { s.housekeeping[rm.slug] = 'clean'; });
  s.closures = [{ id: 'c1', room: 'rio-de-oro', from: addDays(t0, 20), to: addDays(t0, 22), reason: 'Maintenance — painting' }];

  const list = [];
  // The demo guest booking (guest portal login) — Dune Blanche in 9 days, 4 nights.
  list.push({ ref: 'CL-2026-0042', room: 'dune-blanche', from: addDays(t0, 9), to: addDays(t0, 13), guestId: 'g1', adults: 2, children: 0, source: 'direct', payMode: 'deposit', fixed: true });
  const busy = (room, from, to) => list.some((b) => b.room === room && overlaps(from, to, b.from, b.to)) || s.closures.some((c) => (c.room === room || c.room === 'all') && overlaps(from, to, c.from, addDays(c.to, 1)));
  for (const rm of s.rooms) {
    let d = addDays(t0, -180 + Math.floor(r() * 6)); // ~6 months of history so the KPIs have something to compare
    while (d < addDays(t0, 60)) {
      const n = 2 + Math.floor(r() * 6);
      const to = addDays(d, n);
      if (!busy(rm.slug, d, to)) {
        const fam = rm.slug === 'porto-rico' && r() > 0.4;
        list.push({ ref: null, room: rm.slug, from: d, to, guestId: `g${2 + Math.floor(r() * 19)}`, adults: fam ? 2 : (r() > 0.25 ? 2 : 1), children: fam ? 1 : 0, source: pick(['direct', 'direct', 'whatsapp', 'whatsapp', 'booking', 'airbnb', 'instagram', 'phone', 'walkin']), payMode: r() > 0.5 ? 'deposit' : 'arrival' });
      }
      d = addDays(to, 9 + Math.floor(r() * 20));
    }
  }
  list.sort((a, b) => a.from.localeCompare(b.from));
  let n = 1;
  let noShows = 0;
  const now = new Date().toISOString();
  for (const b of list) {
    if (!b.ref) { if (n === 42) n++; b.ref = `CL-2026-${String(n++).padStart(4, '0')}`; }
    const g = s.guests.find((x) => x.id === b.guestId);
    let status;
    if (b.to <= t0) status = r() > 0.9 && b.to > addDays(t0, -30) && noShows++ < 1 ? 'no-show' : 'checked-out';
    else if (b.from <= t0) status = 'checked-in';
    else status = b.fixed ? 'confirmed' : (r() > 0.82 ? 'pending' : r() > 0.93 ? 'cancelled' : 'confirmed');
    const q = quoteWith(s, { room: b.room, from: b.from, to: b.to, adults: b.adults, children: b.children });
    const createdAt = addDays(b.from < t0 ? b.from : t0, -(3 + Math.floor(r() * 35)));
    const bk = {
      ref: b.ref, room: b.room, from: b.from, to: b.to, adults: b.adults, children: b.children, childAges: b.children ? [7] : [], infants: 0,
      guestId: b.guestId, status, source: b.source, payMode: OTA.includes(b.source) ? 'ota' : b.payMode, promo: null,
      quote: q, total: q.total, extras: { transfer: 0, lateCheckout: false, occasion: '' }, arrivalTime: pick(['13:00', '15:30', '18:00', '21:00', '']),
      notes: '', createdAt: `${createdAt}T10:00:00.000Z`, prearrival: null, modifyRequest: null,
      log: [{ at: `${createdAt}T10:00:00.000Z`, by: 'system', text: `Created (${b.source})` }],
    };
    if (['checked-in', 'checked-out', 'no-show'].includes(status) || b.fixed) {
      bk.prearrival = { arrivalTime: bk.arrivalTime || '15:00', flight: pick(['AT 1427', '3O 471', 'TO 3080', '']), nationality: COUNTRY_NAT[g.country], idType: 'passport', idNumber: `${g.country}${100000 + Math.floor(r() * 899999)}`, birthDate: `19${70 + Math.floor(r() * 25)}-0${1 + Math.floor(r() * 9)}-1${Math.floor(r() * 9)}`, requests: '', dietary: '' };
    }
    s.bookings.push(bk);
    // Payments
    const dep = Math.round(q.total * s.settings.depositPct / 100);
    if (bk.payMode === 'ota' && status === 'checked-out') s.payments.push({ id: `p${s.payments.length + 1}`, ref: b.ref, amount: q.total, kind: 'balance', method: 'ota', at: `${b.to}T11:00:00.000Z`, note: b.source });
    else if (bk.payMode === 'deposit' && status !== 'pending') {
      s.payments.push({ id: `p${s.payments.length + 1}`, ref: b.ref, amount: dep, kind: 'deposit', method: 'card', at: bk.createdAt, note: '' });
      if (status === 'checked-out') s.payments.push({ id: `p${s.payments.length + 1}`, ref: b.ref, amount: q.total - dep, kind: 'balance', method: pick(['cash', 'card']), at: `${b.to}T10:30:00.000Z`, note: '' });
      if (status === 'cancelled') s.payments.push({ id: `p${s.payments.length + 1}`, ref: b.ref, amount: -dep, kind: 'refund', method: 'card', at: now, note: 'Free cancellation' });
    } else if (bk.payMode === 'arrival' && status === 'checked-out') s.payments.push({ id: `p${s.payments.length + 1}`, ref: b.ref, amount: q.total, kind: 'balance', method: pick(['cash', 'card']), at: `${b.to}T10:30:00.000Z`, note: '' });
    if (status === 'checked-out' && b.to === t0) s.housekeeping[b.room] = 'dirty';
  }
  // Always show one cancellation and one no-show at most in the demo.
  const fut = s.bookings.filter((b) => b.status === 'pending');
  if (!s.bookings.some((b) => b.status === 'cancelled') && fut.length) { const c = fut[fut.length - 1]; c.status = 'cancelled'; logTo(c, 'guest', 'Cancelled — refund 0 €'); }
  const inHouse = s.bookings.filter((b) => b.status === 'checked-in');
  if (inHouse[0]) s.housekeeping[inHouse[0].room] = 'progress';
  const ih = inHouse[0];
  s.requests = [
    ih && { id: 'r1', ref: ih.ref, type: 'experience', exp: 'catamaran', date: addDays(t0, 1), people: ih.adults, notes: 'Morning if possible', status: 'arranged', partner: 'p3', price: 45, at: `${addDays(t0, -1)}T09:00:00.000Z` },
    { id: 'r2', ref: 'CL-2026-0042', type: 'transfer', exp: null, date: addDays(t0, 9), people: 2, notes: 'Flight AT 1427, lands 14:20', status: 'new', partner: null, price: null, at: `${addDays(t0, -2)}T18:00:00.000Z` },
    { id: 'r3', ref: s.bookings.find((b) => b.status === 'confirmed' && b.ref !== 'CL-2026-0042')?.ref || null, type: 'experience', exp: 'yoga', date: addDays(t0, 5), people: 1, notes: '', status: 'new', partner: null, price: null, at: `${t0}T08:15:00.000Z` },
    ih && { id: 'r4', ref: ih.ref, type: 'late', exp: null, date: ih.to, people: ih.adults, notes: 'Flight at 19:00', status: 'done', partner: null, price: 20, at: `${addDays(t0, -1)}T20:00:00.000Z` },
  ].filter(Boolean);
  s.messages = [
    { id: 'm1', thread: 'CL-2026-0042', from: 'guest', name: 'Elena Martín', text: '¡Hola Lola! ¿Hay sitio para guardar dos tablas de kite?', at: `${addDays(t0, -3)}T19:12:00.000Z`, read: true },
    { id: 'm2', thread: 'CL-2026-0042', from: 'house', name: 'Lola', text: '¡Claro Elena! Tenemos un local seguro para el material. ¡Hasta pronto!', at: `${addDays(t0, -3)}T19:40:00.000Z`, read: true },
    { id: 'm3', thread: 'contact-1', from: 'guest', name: 'Martin Keller', email: 'martin.keller@example.ch', phone: '+41 79 123 45 67', subject: 'Long stay in February', text: 'Hello, I work remotely and would like to stay 3 weeks in February. Is the long-stay offer available for Imlili?', at: `${t0}T07:45:00.000Z`, read: false },
  ];
  s.seq = Math.max(43, n);
  s.log.push({ at: now, by: 'system', text: 'Demo data generated' });
  return s;
}

/* ---------- Store ---------- */
let S = null;
let remoteMode = null; // null = local; 'public' | 'guest' | 'staff' = cache of server data
let syncHook = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const bc = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mbn-casalola') : null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const x = JSON.parse(raw); if (x && x.v === VERSION) return x; }
  } catch { /* private mode / bad JSON */ }
  const x = seed(); save(x); return x;
}
function save(x) { try { localStorage.setItem(KEY, JSON.stringify(x)); } catch { /* quota / private mode */ } }

export const db = {
  get s() { if (!S) S = load(); return S; },
  get remote() { return remoteMode; },
  /** Change the data. Local mode saves it; staff live mode hands the change to the server (js/remote.js). */
  update(fn) { fn(this.s); if (remoteMode) syncHook?.(fn); else { save(S); bc?.postMessage('sync'); } emit(); },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  reset() { S = seed(); save(S); bc?.postMessage('sync'); emit(); },
  /** Live mode: show data that came from the server (never written to localStorage). */
  replace(state, mode) { S = state; remoteMode = mode; emit(); },
  onSync(fn) { syncHook = fn; },
};
bc && (bc.onmessage = () => { if (!remoteMode) { S = load(); emit(); } });
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === KEY && !remoteMode) { S = load(); emit(); } });

/* ---------- Lookups ---------- */
export const room = (slug, s = db.s) => s.rooms.find((r) => r.slug === slug);
export const guest = (id, s = db.s) => s.guests.find((g) => g.id === id);
export const booking = (ref, s = db.s) => s.bookings.find((b) => b.ref === ref);
export const paidFor = (ref, s = db.s) => s.payments.filter((p) => p.ref === ref).reduce((a, p) => a + p.amount, 0);
export const guestName = (g) => (g ? `${g.first} ${g.last}` : '—');

/* ---------- Seasons & rules ---------- */
export function seasonOn(date, s = db.s) {
  const md = date.slice(5);
  const inRange = ([a, b]) => (a <= b ? md >= a && md <= b : md >= a || md <= b);
  return s.rates.seasons.find((x) => x.ranges.some(inRange)) || s.rates.seasons[s.rates.seasons.length - 1];
}
export const minStayFor = (from, s = db.s) => seasonOn(from, s).minStay || 1;

/** party: { adults, children } (infants never count). */
export function fits(rm, { adults = 1, children = 0 }) {
  return rm.active && adults >= 1 && adults <= rm.maxAdults && adults + children <= rm.capacity;
}

export function isFree(slug, from, to, ignoreRef = null, s = db.s) {
  if (s.bookings.some((b) => b.room === slug && b.ref !== ignoreRef && !FREEING.includes(b.status) && overlaps(from, to, b.from, b.to))) return false;
  return !s.closures.some((c) => (c.room === slug || c.room === 'all') && overlaps(from, to, c.from, addDays(c.to, 1)));
}
/** Per-night occupancy for a calendar: { 'YYYY-MM-DD': 'booked' | 'closed' } */
export function busyNights(slug, ignoreRef = null, s = db.s) {
  const m = {};
  s.bookings.forEach((b) => { if (b.room === slug && b.ref !== ignoreRef && !FREEING.includes(b.status)) nightsList(b.from, b.to).forEach((d) => { m[d] = 'booked'; }); });
  s.closures.forEach((c) => { if (c.room === slug || c.room === 'all') nightsList(c.from, addDays(c.to, 1)).forEach((d) => { m[d] = 'closed'; }); });
  return m;
}

export function findPromo(code, from, s = db.s) {
  if (!code) return null;
  const p = s.rates.promoCodes.find((x) => x.code.toLowerCase() === String(code).trim().toLowerCase());
  if (!p) return null;
  if ((p.from && from < p.from) || (p.to && from > p.to) || (p.maxUses && p.uses >= p.maxUses)) return null;
  return p;
}

/** Validation for a stay. Returns an i18n error key or null. */
export function checkStay({ room: slug, from, to, adults, children = 0 }, ignoreRef = null, s = db.s) {
  if (!from || !to || to <= from) return 'err.dates';
  if (!ignoreRef && from < today()) return 'err.past';
  const rm = room(slug, s);
  if (!rm) return 'err.room';
  if (!fits(rm, { adults, children })) return 'err.capacity';
  if (diffDays(from, to) < minStayFor(from, s)) return 'err.minStay';
  if (!isFree(slug, from, to, ignoreRef, s)) return 'err.taken';
  return null;
}

/* ---------- Pricing ---------- */
function quoteWith(s, { room: slug, from, to, adults = 2, children = 0, promo = null, transfer = 0, lateCheckout = false }) {
  const rm = room(slug, s); const R = s.rates;
  const nights = nightsList(from, to).map((d) => {
    const season = seasonOn(d, s);
    let base = adults + children === 1 ? rm.single : rm.price;
    let extra = 0;
    if (adults + children === 3) extra = adults === 3 ? (rm.extra || R.extraAdultPerNight) : R.childPerNight;
    return { date: d, season: season.id, price: Math.round(base * season.mult) + extra };
  });
  const accommodation = nights.reduce((a, n) => a + n.price, 0);
  const lines = [];
  let sub = accommodation;
  let longStay = 0;
  if (R.longStay?.nights && nights.length >= R.longStay.nights) { longStay = Math.round(sub * R.longStay.pct / 100); sub -= longStay; }
  const p = promo ? findPromo(promo, from, s) : null;
  const promoAmt = p ? Math.round(sub * p.pct / 100) : 0;
  sub -= promoAmt;
  const tax = Math.round(adults * nights.length * R.touristTax * 100) / 100;
  const transferAmt = (transfer || 0) * R.extras.transfer.price;
  const lateAmt = lateCheckout ? R.extras.lateCheckout.price : 0;
  const total = Math.round((sub + tax + transferAmt + lateAmt) * 100) / 100;
  lines.push({ key: 'q.nights', n: nights.length, amount: accommodation });
  if (longStay) lines.push({ key: 'q.longStay', pct: R.longStay.pct, amount: -longStay });
  if (promoAmt) lines.push({ key: 'q.promo', code: p.code, pct: p.pct, amount: -promoAmt });
  lines.push({ key: 'q.breakfast', amount: 0 });
  if (tax) lines.push({ key: 'q.tax', amount: tax });
  if (transferAmt) lines.push({ key: 'q.transfer', n: transfer, amount: transferAmt });
  if (lateAmt) lines.push({ key: 'q.late', amount: lateAmt });
  return { nights, lines, accommodation, total, deposit: Math.round(total * s.settings.depositPct / 100), promo: p ? p.code : null, promoInvalid: !!promo && !p };
}
export const quote = (params) => quoteWith(db.s, params);
export const quoteIn = quoteWith;
/** Lowest nightly price for a room, for "from X €" labels. */
export function fromPrice(rm, s = db.s) { const m = Math.min(...s.rates.seasons.map((x) => x.mult)); return Math.round(rm.price * m); }

/** Rooms that fit the party, with free/taken flag for the dates. */
export function searchRooms({ from, to, adults, children }, s = db.s) {
  return s.rooms.filter((r) => r.active).map((r) => ({ room: r, fits: fits(r, { adults, children }), free: from && to ? isFree(r.slug, from, to, null, s) : true }));
}

/* ---------- Writes ---------- */
const stamp = () => new Date().toISOString();
const nextRef = (s) => { const y = new Date().getFullYear(); let ref; do { ref = `CL-${y}-${String(s.seq++).padStart(4, '0')}`; } while (s.bookings.some((b) => b.ref === ref)); return ref; };

export function upsertGuest(s, g) {
  const email = (g.email || '').trim().toLowerCase();
  let x = email && s.guests.find((y) => y.email.toLowerCase() === email);
  if (x) { Object.assign(x, Object.fromEntries(Object.entries(g).filter(([, v]) => v !== undefined && v !== ''))); return x; }
  x = { id: `g${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`, tags: [], notes: '', marketing: false, createdAt: today(), ...g, email };
  s.guests.push(x); return x;
}

/** payload: { room, from, to, adults, children, childAges, infants, promo, extras, guest:{...}, source, payMode, payNow, arrivalTime, notes, status, by } */
export function createBookingIn(s, payload) {
  const err = checkStay(payload, null, s);  // re-checked at confirmation: no double booking
  if (err) return { ok: false, error: err };
  const q = quoteWith(s, { ...payload, transfer: payload.extras?.transfer || 0, lateCheckout: payload.extras?.lateCheckout });
  const g = upsertGuest(s, payload.guest);
  const ref = nextRef(s);
  const by = payload.by || 'guest';
  const b = {
    ref, room: payload.room, from: payload.from, to: payload.to, adults: payload.adults, children: payload.children || 0, childAges: payload.childAges || [], infants: payload.infants || 0,
    guestId: g.id, status: payload.status || 'confirmed', source: payload.source || 'direct', payMode: payload.payMode || 'arrival', promo: q.promo,
    quote: q, total: q.total, extras: { transfer: 0, lateCheckout: false, occasion: '', ...(payload.extras || {}) }, arrivalTime: payload.arrivalTime || '', notes: payload.notes || '',
    createdAt: stamp(), prearrival: null, modifyRequest: null, log: [{ at: stamp(), by, text: `Created (${payload.source || 'direct'})` }],
  };
  s.bookings.push(b);
  if (q.promo) { const p = s.rates.promoCodes.find((x) => x.code === q.promo); if (p) p.uses = (p.uses || 0) + 1; }
  if (payload.payNow) s.payments.push({ id: `p${Date.now()}`, ref, amount: payload.payNow, kind: payload.payNow >= q.total ? 'balance' : 'deposit', method: 'card', at: stamp(), note: 'Online (demo)' });
  const ex = payload.extras || {};
  if (ex.transfer) s.requests.push({ id: `r${Date.now()}t`, ref, type: 'transfer', exp: null, date: payload.from, people: payload.adults + (payload.children || 0), notes: ex.transfer === 2 ? 'Arrival + departure' : 'Arrival', status: 'new', partner: null, price: ex.transfer * s.rates.extras.transfer.price, at: stamp() });
  if (ex.lateCheckout) s.requests.push({ id: `r${Date.now()}l`, ref, type: 'late', exp: null, date: payload.to, people: payload.adults, notes: '', status: 'new', partner: null, price: s.rates.extras.lateCheckout.price, at: stamp() });
  (ex.experiences || []).forEach((id, i) => s.requests.push({ id: `r${Date.now()}e${i}`, ref, type: 'experience', exp: id, date: payload.from, people: payload.adults + (payload.children || 0), notes: '', status: 'new', partner: null, price: null, at: stamp() }));
  return { ok: true, booking: b };
}
export function createBooking(payload) { let out; db.update((s) => { out = createBookingIn(s, payload); }); return out; }

export function logTo(b, by, text) { b.log.push({ at: stamp(), by, text }); }

export function setStatus(ref, status, by = 'admin') {
  db.update((s) => {
    const b = booking(ref, s); if (!b) return;
    logTo(b, by, `Status: ${b.status} → ${status}`);
    b.status = status;
    if (status === 'checked-out') s.housekeeping[b.room] = 'dirty';
  });
}

/** Change dates / room / party with availability check and price recalculation. */
export function modifyBookingIn(s, ref, change, by = 'admin') {
  const b = booking(ref, s); if (!b) return { ok: false, error: 'err.room' };
  const next = { room: b.room, from: b.from, to: b.to, adults: b.adults, children: b.children, ...change };
  const err = checkStay(next, ref, s);
  if (err) return { ok: false, error: err };
  const q = quoteWith(s, { ...next, promo: b.promo, transfer: b.extras.transfer, lateCheckout: b.extras.lateCheckout });
  logTo(b, by, `Modified: ${b.room} ${b.from}→${b.to} ⇒ ${next.room} ${next.from}→${next.to} (${b.total} → ${q.total} €)`);
  Object.assign(b, next, { quote: q, total: q.total, modifyRequest: null });
  return { ok: true, booking: b };
}
export function modifyBooking(ref, change, by = 'admin') { let out; db.update((s) => { out = modifyBookingIn(s, ref, change, by); }); return out; }

/** Refund owed if cancelled now, per policy. */
export function refundIfCancelled(b, s = db.s) {
  const paid = paidFor(b.ref, s);
  return diffDays(today(), b.from) >= s.settings.cancellationDays ? Math.max(0, paid) : 0;
}
export function cancelIn(s, ref, by = 'admin', refundOverride = null) {
  const b = booking(ref, s); if (!b) return 0;
  const refund = refundOverride ?? refundIfCancelled(b, s);
  if (refund > 0) s.payments.push({ id: `p${Date.now()}`, ref, amount: -refund, kind: 'refund', method: 'card', at: stamp(), note: 'Cancellation (demo)' });
  logTo(b, by, `Cancelled — refund ${refund} €`);
  b.status = 'cancelled';
  return refund;
}
export function cancelBooking(ref, by = 'admin', refundOverride = null) { let refund = 0; db.update((s) => { refund = cancelIn(s, ref, by, refundOverride); }); return refund; }

export function addPayment(ref, amount, method, kind, note = '', by = 'admin') {
  db.update((s) => {
    s.payments.push({ id: `p${Date.now()}`, ref, amount: Number(amount), kind, method, at: stamp(), note });
    const b = booking(ref, s); if (b) logTo(b, by, `Payment ${kind} ${amount} € (${method})`);
  });
}

export function addRequestIn(s, req) { const id = `r${Date.now()}${Math.floor(Math.random() * 1e3)}`; s.requests.push({ id, status: 'new', partner: null, price: null, people: 1, notes: '', ...req, at: stamp() }); return id; }
export function addRequest(req) { let id; db.update((s) => { id = addRequestIn(s, req); }); return id; }
export function addMessageIn(s, msg) { s.messages.push({ read: false, ...msg, id: `m${Date.now()}${Math.floor(Math.random() * 1e3)}`, at: stamp() }); }
export function addMessage(msg) { db.update((s) => { addMessageIn(s, msg); }); }
export function prearrivalIn(s, ref, data) { const b = booking(ref, s); if (!b) return false; b.prearrival = data; b.arrivalTime = data.arrivalTime || b.arrivalTime; logTo(b, 'guest', 'Pre-arrival form completed'); return true; }
export function requestModifyIn(s, ref, from, to) { const b = booking(ref, s); if (!b) return false; b.modifyRequest = { from, to, status: 'pending', at: stamp() }; logTo(b, 'guest', `Date change requested: ${from} → ${to}`); return true; }

/* ---------- What each kind of visitor may see (live mode) ---------- */
const LIVE_ST = (b) => !FREEING.includes(b.status);
/** Public site: rooms, prices, rules and which nights are taken — no names, contacts or staff accounts. */
export function publicView(s) {
  return {
    v: s.v, seq: 0, rooms: s.rooms, rates: s.rates, settings: s.settings, reviews: { google: s.reviews.google, selected: s.reviews.selected, asked: [] },
    partners: [], users: [], guests: [], payments: [], requests: [], messages: [], housekeeping: {}, log: [],
    bookings: s.bookings.filter(LIVE_ST).map((b) => ({ ref: '', room: b.room, from: b.from, to: b.to, status: b.status })),
    closures: s.closures.map((c) => ({ id: c.id, room: c.room, from: c.from, to: c.to, reason: '' })),
  };
}
/** Guest portal: the public view plus everything that belongs to this guest. */
export function guestView(s, guestId) {
  const v = publicView(s);
  const mine = s.bookings.filter((b) => b.guestId === guestId);
  const refs = new Set(mine.map((b) => b.ref));
  v.bookings = s.bookings.filter((b) => b.guestId !== guestId && LIVE_ST(b)).map((b) => ({ ref: '', room: b.room, from: b.from, to: b.to, status: b.status })).concat(mine);
  v.guests = s.guests.filter((g) => g.id === guestId).map(({ pwHash, ...g }) => g);
  v.payments = s.payments.filter((p) => refs.has(p.ref));
  v.requests = s.requests.filter((r) => refs.has(r.ref));
  v.messages = s.messages.filter((m) => refs.has(m.thread));
  return v;
}
/** Dashboard: everything, without guest password hashes; reception does not see PINs. */
export function staffView(s, role) {
  const v = clone(s);
  v.guests.forEach((g) => { delete g.pwHash; });
  if (role !== 'owner') v.users = v.users.map((u) => ({ ...u, pin: '' }));
  return v;
}

export function findBooking(ref, email, s = db.s) {
  const b = booking(String(ref || '').trim().toUpperCase(), s);
  if (!b) return null;
  const g = guest(b.guestId, s);
  return g && g.email.toLowerCase() === String(email || '').trim().toLowerCase() ? b : null;
}

export async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`casalola:${pw}`));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
