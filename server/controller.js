'use strict';
const prisma = require('./db');
const L = require('./lib/casalola');

const fail = (res, status, error) => res.status(status).json({ ok: false, error });
const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (err) {
    console.error('[casalola]', req.method, req.path, err && (err.stack || err.message || err));
    if (!res.headersSent) fail(res, 500, 'err.server');
  }
};

/* ─── Public site ──────────────────────────────────────────────────────────── */
exports.publicState = wrap(async (req, res) => {
  const { publicView } = await L.store();
  const { s, v } = await L.read(prisma);
  res.json({ ok: true, v, state: publicView(s) });
});

exports.book = wrap(async (req, res) => {
  const { payload, error } = await L.cleanBooking(req.body);
  if (error) return fail(res, 400, error);
  const St = await L.store();
  const r = await L.mutate(prisma, (s) => {
    if (!s.rooms.some((x) => x.slug === payload.room && x.active !== false)) return { ok: false, error: 'err.form', save: false };
    const q = St.quoteIn(s, { ...payload, transfer: payload.extras.transfer, lateCheckout: payload.extras.lateCheckout });
    payload.payNow = payload.payMode === 'deposit' ? q.deposit : 0;
    if (payload.payMode === 'arrival' && !s.settings.payOnArrival) payload.payMode = 'deposit', payload.payNow = q.deposit;
    const out = St.createBookingIn(s, payload);
    return out.ok ? out : { ...out, save: false };
  });
  if (!r.ok) return fail(res, r.error === 'err.form' ? 400 : 409, r.error);
  const view = St.guestView(r.s, r.booking.guestId);
  res.status(201).json({ ok: true, ref: r.booking.ref, token: L.signGuest(r.booking.guestId), view });
});

exports.request = wrap(async (req, res) => {
  const C = await L.config();
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const exp = C.EXPERIENCES.find((e) => e.id === b.exp);
  if (!exp || !L.isDate(b.date) || !L.str(b.guestName, 80) || !L.str(b.contact, 120)) return fail(res, 400, 'err.form');
  const St = await L.store();
  await L.mutate(prisma, (s) => {
    const ref = L.str(b.ref, 20).toUpperCase();
    St.addRequestIn(s, { ref: ref && St.booking(ref, s) ? ref : null, type: 'experience', exp: exp.id, date: b.date, people: L.int(b.people, 1, 20, 1), notes: L.str(b.notes, 1000), guestName: L.str(b.guestName, 80), contact: L.str(b.contact, 120) });
  });
  res.status(201).json({ ok: true });
});

exports.contact = wrap(async (req, res) => {
  const b = req.body || {};
  if (b.company) return res.json({ ok: true }); // honeypot
  const name = L.str(b.name, 80); const email = L.str(b.email, 200).toLowerCase(); const text = L.str(b.text, 3000);
  if (!name || !L.isEmail(email) || !text) return fail(res, 400, 'err.form');
  const St = await L.store();
  await L.mutate(prisma, (s) => { St.addMessageIn(s, { thread: `contact-${Date.now()}`, from: 'guest', name, email, phone: L.str(b.phone, 40), subject: L.str(b.subject, 200), text }); });
  res.status(201).json({ ok: true });
});

/* ─── Guest portal ─────────────────────────────────────────────────────────── */
exports.guestLogin = wrap(async (req, res) => {
  const St = await L.store();
  const { s } = await L.read(prisma);
  const b = St.findBooking(req.body?.ref, req.body?.email, s);
  if (!b) return fail(res, 401, 'gp.notFound');
  res.json({ ok: true, ref: b.ref, token: L.signGuest(b.guestId), view: St.guestView(s, b.guestId) });
});

exports.guestAccount = wrap(async (req, res) => {
  const St = await L.store();
  const { s } = await L.read(prisma);
  const email = L.str(req.body?.email, 200).toLowerCase(); const h = String(req.body?.pwHash || '');
  const g = /^[a-f0-9]{64}$/.test(h) && s.guests.find((x) => x.email === email && x.pwHash === h);
  const mine = g ? s.bookings.filter((b) => b.guestId === g.id).sort((a, b) => (a.from < b.from ? 1 : -1)) : [];
  if (!mine.length) return fail(res, 401, 'gp.badAccount');
  const ref = (mine.find((b) => b.to >= St.today()) || mine[0]).ref;
  res.json({ ok: true, ref, token: L.signGuest(g.id), view: St.guestView(s, g.id) });
});

const guestAuth = (req, res) => { const t = L.verify(bearer(req), 'guest'); if (!t) fail(res, 401, 'err.session'); return t; };

exports.guestState = wrap(async (req, res) => {
  const t = guestAuth(req, res); if (!t) return;
  const St = await L.store();
  const { s, v } = await L.read(prisma);
  if (!s.guests.some((g) => g.id === t.g)) return fail(res, 401, 'err.session');
  res.json({ ok: true, v, view: St.guestView(s, t.g) });
});

exports.guestOp = wrap(async (req, res) => {
  const t = guestAuth(req, res); if (!t) return;
  const St = await L.store();
  const { op, ref: rawRef, data = {} } = req.body || {};
  const ref = L.str(rawRef, 20).toUpperCase();
  const r = await L.mutate(prisma, (s) => {
    const b = St.booking(ref, s);
    if (!b || b.guestId !== t.g) return { ok: false, error: 'gp.notFound', save: false };
    const open = ['pending', 'confirmed'].includes(b.status);
    const live = !['cancelled', 'no-show', 'checked-out'].includes(b.status);
    const g = s.guests.find((x) => x.id === t.g);
    switch (op) {
      case 'prearrival': {
        if (!live) return { ok: false, error: 'gp.noChange', save: false };
        const d = { arrivalTime: L.str(data.arrivalTime, 10), flight: L.str(data.flight, 20), nationality: L.str(data.nationality, 60), birthDate: L.isDate(data.birthDate) ? data.birthDate : '', idType: data.idType === 'id' ? 'id' : 'passport', idNumber: L.str(data.idNumber, 40), dietary: L.str(data.dietary, 200), requests: L.str(data.requests, 1000) };
        if (!d.nationality || !d.idNumber || !d.birthDate) return { ok: false, error: 'err.form', save: false };
        St.prearrivalIn(s, ref, d); return { ok: true };
      }
      case 'request': {
        if (!live) return { ok: false, error: 'gp.noChange', save: false };
        const type = ['transfer', 'late', 'experience'].includes(data.type) ? data.type : null;
        if (!type || !L.isDate(data.date)) return { ok: false, error: 'err.form', save: false };
        St.addRequestIn(s, { ref, type, exp: type === 'experience' ? L.str(data.exp, 30) : null, date: data.date, people: L.int(data.people, 1, 12, 1), notes: L.str(data.notes, 1000) });
        return { ok: true };
      }
      case 'modify': {
        if (!open) return { ok: false, error: 'gp.noChange', save: false };
        if (!L.isDate(data.from) || !L.isDate(data.to)) return { ok: false, error: 'err.dates', save: false };
        const err = St.checkStay({ room: b.room, from: data.from, to: data.to, adults: b.adults, children: b.children }, ref, s);
        if (err) return { ok: false, error: err, save: false };
        St.requestModifyIn(s, ref, data.from, data.to); return { ok: true };
      }
      case 'cancel': {
        if (!open) return { ok: false, error: 'gp.noChange', save: false };
        return { ok: true, refund: St.cancelIn(s, ref, 'guest') };
      }
      case 'message': {
        const text = L.str(data.text, 3000);
        if (!text) return { ok: false, error: 'err.form', save: false };
        St.addMessageIn(s, { thread: ref, from: 'guest', name: St.guestName(g), text }); return { ok: true };
      }
      default: return { ok: false, error: 'err.form', save: false };
    }
  });
  if (!r.ok) return fail(res, 400, r.error);
  res.json({ ok: true, refund: r.refund, view: St.guestView(r.s, t.g) });
});

/* ─── Dashboard ────────────────────────────────────────────────────────────── */
exports.staffLogin = wrap(async (req, res) => {
  const St = await L.store();
  const { s, v } = await L.read(prisma);
  const email = L.str(req.body?.email, 200).toLowerCase(); const pin = L.str(req.body?.pin, 12);
  const u = pin && s.users.find((x) => x.email === email && x.pin === pin);
  if (!u) return fail(res, 401, 'a.badLogin');
  const user = { email: u.email, name: u.name, role: u.role };
  res.json({ ok: true, token: L.signStaff(user), user, v, state: St.staffView(s, u.role) });
});

const staffAuth = (req, res) => { const t = L.verify(bearer(req), 'staff'); if (!t) fail(res, 401, 'err.session'); return t; };

exports.staffState = wrap(async (req, res) => {
  const t = staffAuth(req, res); if (!t) return;
  const St = await L.store();
  const { s, v } = await L.read(prisma);
  if (String(req.query.v) === String(v)) return res.json({ ok: true, v, same: true });
  res.json({ ok: true, v, state: St.staffView(s, t.role) });
});

exports.staffSave = wrap(async (req, res) => {
  const t = staffAuth(req, res); if (!t) return;
  const St = await L.store();
  const next = req.body?.state; const base = Number(req.body?.v);
  if (!L.validState(next)) return fail(res, 400, 'err.form');
  const r = await L.mutate(prisma, (s, v) => {
    if (base !== v) return { ok: false, status: 409, save: false };
    // Keep what this person cannot see or must not change.
    const pw = new Map(s.guests.filter((g) => g.pwHash).map((g) => [g.id, g.pwHash]));
    next.guests.forEach((g) => { delete g.pwHash; if (pw.has(g.id)) g.pwHash = pw.get(g.id); });
    if (t.role !== 'owner') { next.users = s.users; next.rates = s.rates; next.settings = s.settings; }
    else if (!next.users.some((u) => u.role === 'owner' && u.pin)) next.users = s.users; // never lock the owner out
    next.v = s.v; next.seq = Math.max(Number(next.seq) || 0, Number(s.seq) || 0);
    if (L.doubleBooked(next)) return { ok: false, status: 422, save: false };
    Object.keys(s).forEach((k) => { delete s[k]; });
    Object.assign(s, next);
    return { ok: true };
  });
  if (!r.ok) return res.status(r.status).json({ ok: false, error: r.status === 409 ? 'err.conflict' : 'err.taken', v: r.v, state: St.staffView(r.s, t.role) });
  res.json({ ok: true, v: r.v });
});

exports.staffReset = wrap(async (req, res) => {
  const t = staffAuth(req, res); if (!t) return;
  if (t.role !== 'owner') return fail(res, 403, 'err.session');
  const St = await L.store();
  const r = await L.mutate(prisma, (s) => {
    const fresh = St.seed();
    const users = s.users; // keep the owner's PINs
    Object.keys(s).forEach((k) => { delete s[k]; });
    Object.assign(s, fresh, { users });
    return { ok: true };
  });
  res.json({ ok: true, v: r.v, state: St.staffView(r.s, t.role) });
});
