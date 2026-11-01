'use strict';
// Casa Lola live demo: pure helpers and the views that decide who sees what. No DB needed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET ||= 'test-secret-casalola-123456789012345';
const L = require('../server/lib/casalola');

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

test('views: public hides people and PINs, a guest sees only their own, reception sees no PINs', async () => {
  const St = await L.store();
  const s = St.seed();
  const pub = St.publicView(s);
  assert.equal(pub.guests.length, 0); assert.equal(pub.users.length, 0); assert.equal(pub.payments.length, 0); assert.equal(pub.messages.length, 0);
  assert.ok(pub.bookings.length > 0);
  assert.ok(pub.bookings.every((b) => b.ref === '' && !b.guestId && Object.keys(b).length === 5), 'only room/dates/status per booking');
  assert.ok(pub.bookings.every((b) => !['cancelled', 'no-show'].includes(b.status)));

  const demo = St.booking('CL-2026-0042', s);
  const gv = St.guestView(s, demo.guestId);
  assert.deepEqual(gv.guests.map((g) => g.id), [demo.guestId]);
  assert.ok(gv.bookings.filter((b) => b.ref).every((b) => b.guestId === demo.guestId));
  assert.ok(gv.messages.every((m) => m.thread === 'CL-2026-0042'));
  assert.ok(gv.payments.every((p) => p.ref === 'CL-2026-0042'));

  s.guests[0].pwHash = 'a'.repeat(64);
  const rec = St.staffView(s, 'reception'); const own = St.staffView(s, 'owner');
  assert.ok(rec.users.every((u) => u.pin === '')); assert.ok(own.users.some((u) => u.pin === '2468'));
  assert.ok(rec.guests.every((g) => !g.pwHash) && own.guests.every((g) => !g.pwHash));
  assert.equal(s.guests[0].pwHash, 'a'.repeat(64), 'views never change the stored document');
});

test('doubleBooked / validState', async () => {
  const St = await L.store();
  const s = St.seed();
  assert.equal(L.validState(s), true);
  assert.equal(L.doubleBooked(s), false, 'seed has no overlaps');
  const b = s.bookings.find((x) => x.status === 'confirmed');
  s.bookings.push({ ...b, ref: 'X-1', from: b.from, to: b.to });
  assert.equal(L.doubleBooked(s), true);
  s.bookings[s.bookings.length - 1].status = 'cancelled';
  assert.equal(L.doubleBooked(s), false, 'cancelled bookings free the room');
  assert.equal(L.validState({ ...s, rooms: [] }), false);
  assert.equal(L.validState({ ...s, bookings: 'x' }), false);
  assert.equal(L.validState(null), false);
});

test('cleanBooking whitelists fields and forces source/status', async () => {
  const ok = await L.cleanBooking({
    room: 'imlili', from: iso(40), to: iso(44), adults: 9, children: -3, payMode: 'deposit', payNow: 1, source: 'airbnb', status: 'checked-in',
    extras: { transfer: 7, lateCheckout: 'yes', experiences: ['yoga', 'nope', 'yoga'] },
    guest: { first: ' Ana ', last: 'B', email: 'ANA@Example.com', phone: '+34 600 111 222', country: 'es', pwHash: 'not-a-hash' },
  });
  const p = ok.payload;
  assert.equal(p.adults, 3); assert.equal(p.children, 0); assert.equal(p.extras.transfer, 2); assert.equal(p.extras.lateCheckout, false);
  assert.deepEqual(p.extras.experiences, ['yoga']); assert.equal(p.source, 'direct'); assert.equal(p.status, 'confirmed');
  assert.equal(p.guest.email, 'ana@example.com'); assert.equal(p.guest.first, 'Ana'); assert.equal(p.guest.country, 'ES'); assert.equal(p.guest.pwHash, undefined);
  assert.equal(p.payNow, undefined, 'the amount paid is never taken from the client');
  assert.equal((await L.cleanBooking({ room: 'imlili', from: 'x', to: iso(2), guest: {} })).error, 'err.dates');
  assert.equal((await L.cleanBooking({ room: 'imlili', from: iso(40), to: iso(42), guest: { first: 'A', last: 'B', email: 'bad', phone: '1' } })).error, 'err.form');
});

test('tokens are scoped by kind', () => {
  const staff = L.signStaff({ role: 'owner', email: 'lola@demo', name: 'Lola' });
  const guest = L.signGuest('g1');
  assert.equal(L.verify(staff, 'staff').role, 'owner');
  assert.equal(L.verify(staff, 'guest'), null);
  assert.equal(L.verify(guest, 'guest').g, 'g1');
  assert.equal(L.verify(guest, 'staff'), null);
  assert.equal(L.verify('garbage', 'staff'), null);
});
