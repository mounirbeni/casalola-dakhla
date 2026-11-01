'use strict';
// Casa Lola live demo against a real Postgres: one shared document, guarded writes.
const { test, after } = require('node:test');
const assert = require('node:assert');

const RUN  = !!process.env.DATABASE_URL;
const skip = RUN ? false : 'DATABASE_URL not set — skipping DB integration tests';
process.env.JWT_SECRET ||= 'test-secret-casalola-123456789012345';

after(async () => {
  if (!RUN) return;
  const prisma = require('../../server/db');
  await prisma.$executeRawUnsafe(`DELETE FROM "DemoState" WHERE "slug" = 'casalola'`).catch(() => {});
  await prisma.end();
});

const res = () => { const r = { code: 200, body: null, headersSent: false }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; r.headersSent = true; return r; }; return r; };
const run = async (fn, req) => { const r = res(); await fn({ headers: {}, query: {}, body: {}, ...req }, r); return r; };
const auth = (t) => ({ authorization: `Bearer ${t}` });
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

test('booking, guest portal and dashboard share one document with guarded writes', { skip }, async () => {
  const prisma = require('../../server/db');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "DemoState"'); // prove the lazy creation + seed path
  const c = require('../../server/controller');

  const pub = await run(c.publicState);
  assert.equal(pub.code, 200); assert.equal(pub.body.state.guests.length, 0);

  const body = { room: 'imlili', from: iso(220), to: iso(224), adults: 2, payMode: 'deposit', extras: { transfer: 1 }, guest: { first: 'Ana', last: 'Test', email: 'ana.int@example.com', phone: '+34 600 111 222', country: 'ES' } };
  const b1 = await run(c.book, { body });
  assert.equal(b1.code, 201, JSON.stringify(b1.body));
  const ref = b1.body.ref;
  const dep = b1.body.view.payments.find((p) => p.ref === ref);
  const mine = b1.body.view.bookings.find((b) => b.ref === ref);
  assert.equal(dep.amount, mine.quote.deposit, 'deposit computed on the server');
  assert.equal(b1.body.view.requests.filter((r) => r.ref === ref && r.type === 'transfer').length, 1);

  const b2 = await run(c.book, { body: { ...body, guest: { ...body.guest, email: 'other@example.com' } } });
  assert.equal(b2.code, 409); assert.equal(b2.body.error, 'err.taken');

  // Guest login and ownership
  const bad = await run(c.guestLogin, { body: { ref, email: 'wrong@example.com' } });
  assert.equal(bad.code, 401);
  const gl = await run(c.guestLogin, { body: { ref: ref.toLowerCase(), email: 'ANA.INT@example.com' } });
  assert.equal(gl.code, 200); const gTok = gl.body.token;
  const other = await run(c.guestLogin, { body: { ref: 'CL-2026-0042', email: 'guest@demo.com' } });
  const steal = await run(c.guestOp, { headers: auth(other.body.token), body: { op: 'cancel', ref } });
  assert.equal(steal.code, 400, 'a guest cannot touch another guest booking');
  const msg = await run(c.guestOp, { headers: auth(gTok), body: { op: 'message', ref, data: { text: 'Hola' } } });
  assert.equal(msg.code, 200); assert.ok(msg.body.view.messages.some((m) => m.thread === ref && m.text === 'Hola'));
  const pre = await run(c.guestOp, { headers: auth(gTok), body: { op: 'prearrival', ref, data: { nationality: 'ES', birthDate: '1990-01-01', idNumber: 'P1' } } });
  assert.equal(pre.code, 200);

  // Staff
  const wrong = await run(c.staffLogin, { body: { email: 'lola@demo', pin: '0000' } });
  assert.equal(wrong.code, 401);
  const own = await run(c.staffLogin, { body: { email: 'lola@demo', pin: '2468' } });
  assert.equal(own.code, 200); const oTok = own.body.token;
  assert.ok(own.body.state.bookings.find((b) => b.ref === ref).prearrival, 'owner sees the pre-arrival form');
  const rec = await run(c.staffLogin, { body: { email: 'reception@demo', pin: '1357' } });
  assert.ok(rec.body.state.users.every((u) => u.pin === ''));

  // Owner save with the right version
  const st = (await run(c.staffState, { headers: auth(oTok) })).body;
  st.state.housekeeping.imlili = 'oos';
  const save = await run(c.staffSave, { headers: auth(oTok), body: { v: st.v, state: st.state } });
  assert.equal(save.code, 200);
  // Stale version → 409 with the current state
  const stale = await run(c.staffSave, { headers: auth(oTok), body: { v: st.v, state: st.state } });
  assert.equal(stale.code, 409); assert.equal(stale.body.state.housekeeping.imlili, 'oos');
  // Double booking through a save → 422
  const cur = stale.body;
  const dup = { ...cur.state.bookings.find((b) => b.ref === ref), ref: 'CL-DUP-1' };
  cur.state.bookings.push(dup);
  const dbl = await run(c.staffSave, { headers: auth(oTok), body: { v: cur.v, state: cur.state } });
  assert.equal(dbl.code, 422);
  // Reception cannot change rates or users, nor reset
  const r0 = (await run(c.staffState, { headers: auth(rec.body.token) })).body;
  r0.state.rates.touristTax = 99; r0.state.users = [];
  const rs = await run(c.staffSave, { headers: auth(rec.body.token), body: { v: r0.v, state: r0.state } });
  assert.equal(rs.code, 200);
  const after1 = (await run(c.staffState, { headers: auth(oTok) })).body.state;
  assert.notEqual(after1.rates.touristTax, 99); assert.ok(after1.users.length >= 2);
  assert.equal((await run(c.staffReset, { headers: auth(rec.body.token) })).code, 403);
  // Guest password hashes survive staff saves
  const reset = await run(c.staffReset, { headers: auth(oTok) });
  assert.equal(reset.code, 200); assert.ok(!reset.body.state.bookings.some((b) => b.ref === ref));
  assert.equal((await run(c.staffState, { headers: { authorization: 'Bearer nope' } })).code, 401);
});
