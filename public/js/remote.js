/* Casa Lola — live mode: talks to /api so every visitor, the guest portal and the dashboard
   share one real copy of the data. If the API cannot be reached (e.g. the folder is opened on a plain
   static host), `live` stays false and the pages keep working on localStorage (store.js local mode). */
import { db, hashPw } from './store.js';

const API = '/api';
const TOKENS = { guest: 'cl-guest-token', staff: 'cl-staff-token' };
const ss = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch { /* private mode */ } },
};
export const live = { on: false };
let version = 0;
const listeners = { auth: new Set(), error: new Set() };
export const onAuthLost = (fn) => listeners.auth.add(fn);
export const onSyncError = (fn) => listeners.error.add(fn);

async function call(method, path, body, token) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(API + path, {
      method, cache: 'no-store', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null; try { data = await r.json(); } catch { /* empty body */ }
    return { ok: r.ok && data?.ok !== false, status: r.status, data: data || {} };
  } catch { return { ok: false, status: 0, data: { error: 'err.network' } }; } finally { clearTimeout(timer); }
}

let pollTimer = null;
function poll(fn, ms) {
  clearInterval(pollTimer);
  pollTimer = setInterval(() => { if (document.visibilityState === 'visible') fn(); }, ms);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') fn(); });
}

/** Is the live API there? Fills the public slice of the data on success. */
export async function bootPublic() {
  const r = await call('GET', '/public');
  if (!r.ok || !r.data.state) return false;
  live.on = true; version = r.data.v;
  db.replace(withOwn(r.data.state), 'public');
  return true;
}

/* ---------- Public website ---------- */
let own = null; // the visitor's own booking (from /book), kept across refreshes for the confirmation page
function withOwn(state) {
  if (!own) return state;
  const refs = new Set(own.bookings.map((b) => b.ref));
  state.bookings = state.bookings.concat(own.bookings.filter((b) => refs.has(b.ref)));
  state.guests = state.guests.concat(own.guests);
  state.payments = state.payments.concat(own.payments);
  return state;
}
export async function refreshPublic() {
  const r = await call('GET', '/public');
  if (r.ok && r.data.state && r.data.v !== version) { version = r.data.v; db.replace(withOwn(r.data.state), 'public'); }
}
export function watchPublic() { poll(refreshPublic, 20000); }

/** → { ok, booking } or { ok:false, error } */
export async function book(payload) {
  const r = await call('POST', '/book', payload);
  if (!r.ok) return { ok: false, error: r.data.error || 'err.network' };
  const v = r.data.view;
  own = { bookings: v.bookings.filter((b) => b.ref === r.data.ref), guests: v.guests, payments: v.payments.filter((p) => p.ref === r.data.ref) };
  ss.set(TOKENS.guest, r.data.token);
  ss.set('cl-guest', JSON.stringify({ ref: r.data.ref }));
  await refreshPublic().catch(() => {});
  if (!db.s.bookings.some((b) => b.ref === r.data.ref)) db.replace(withOwn({ ...db.s, bookings: db.s.bookings.slice() }), 'public');
  return { ok: true, booking: own.bookings[0] };
}
export async function publicRequest(req) { const r = await call('POST', '/request', req); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'err.network' }; }
export async function publicContact(msg) { const r = await call('POST', '/contact', msg); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'err.network' }; }

/* ---------- Guest portal ---------- */
export const guestToken = () => ss.get(TOKENS.guest);
let lastGuest = '';
function guestIn(r) {
  if (!r.ok) return { ok: false, error: r.data.error || 'err.network' };
  ss.set(TOKENS.guest, r.data.token);
  db.replace(r.data.view, 'guest');
  return { ok: true, ref: r.data.ref };
}
export async function guestLogin(ref, email) { return guestIn(await call('POST', '/guest/login', { ref, email })); }
export async function guestAccount(email, password) { return guestIn(await call('POST', '/guest/account', { email, pwHash: await hashPw(password) })); }
/** Reload this guest's data. → false when the session is gone. */
export async function guestRefresh() {
  const t = guestToken(); if (!t) return false;
  const r = await call('GET', '/guest/state', null, t);
  if (r.status === 401) { ss.set(TOKENS.guest, null); return false; }
  if (r.ok) { const j = JSON.stringify(r.data.view); if (j !== lastGuest) { lastGuest = j; db.replace(r.data.view, 'guest'); } }
  return r.ok || r.status === 0;
}
export function watchGuest() { poll(guestRefresh, 20000); }
/** op: prearrival | request | modify | cancel | message → { ok, refund } or { ok:false, error } */
export async function guestOp(op, ref, data = {}) {
  const r = await call('POST', '/guest/op', { op, ref, data }, guestToken());
  if (r.status === 401) { ss.set(TOKENS.guest, null); listeners.auth.forEach((f) => f()); return { ok: false, error: 'err.session' }; }
  if (!r.ok) return { ok: false, error: r.data.error || 'err.network' };
  db.replace(r.data.view, 'guest');
  return { ok: true, refund: r.data.refund };
}
export function guestLogout() { ss.set(TOKENS.guest, null); }

/* ---------- Dashboard ---------- */
const staffToken = () => ss.get(TOKENS.staff);
export const staffUser = () => { try { return JSON.parse(ss.get('cl-staff-user')); } catch { return null; } };
function staffIn(r) {
  ss.set(TOKENS.staff, r.data.token); ss.set('cl-staff-user', JSON.stringify(r.data.user));
  version = r.data.v; db.replace(r.data.state, 'staff'); db.onSync(enqueue);
  return { ok: true, user: r.data.user };
}
export async function staffLogin(email, pin) {
  const r = await call('POST', '/admin/login', { email, pin });
  return r.ok ? staffIn(r) : { ok: false, error: r.data.error || 'err.network' };
}
/** Re-open a dashboard session after a reload. */
export async function staffResume() {
  const t = staffToken(); if (!t) return null;
  const r = await call('GET', '/admin/state', null, t);
  if (!r.ok || !r.data.state) { if (r.status === 401) staffLogout(); return null; }
  version = r.data.v; db.replace(r.data.state, 'staff'); db.onSync(enqueue);
  return staffUser();
}
export function staffLogout() { ss.set(TOKENS.staff, null); ss.set('cl-staff-user', null); clearInterval(pollTimer); }
export async function staffRefresh() {
  if (pending.length || busy) return;
  const r = await call('GET', `/admin/state?v=${version}`, null, staffToken());
  if (r.status === 401) { staffLogout(); listeners.auth.forEach((f) => f()); return; }
  if (r.ok && !r.data.same && r.data.state && !pending.length && !busy) { version = r.data.v; db.replace(r.data.state, 'staff'); }
}
export function watchStaff() { poll(staffRefresh, 8000); }
export async function staffReset() {
  const r = await call('POST', '/admin/reset', {}, staffToken());
  if (r.ok) { version = r.data.v; db.replace(r.data.state, 'staff'); }
  return r.ok;
}

// Every dashboard change (db.update) is saved by sending the whole document with the version it was
// based on. If someone else saved first (409), the change is re-applied on their version and retried.
let pending = []; let busy = false;
function enqueue(fn) { pending.push(fn); if (!busy) flush(); }
async function flush() {
  busy = true;
  let tries = 0;
  while (pending.length && tries < 6) {
    tries++;
    const sent = pending.length;
    const r = await call('PUT', '/admin/state', { v: version, state: db.s }, staffToken());
    if (r.ok) { version = r.data.v; pending = pending.slice(sent); tries = 0; continue; }
    if (r.status === 409 && r.data.state) {
      version = r.data.v; const fresh = r.data.state;
      pending.forEach((f) => { try { f(fresh); } catch { /* change no longer applies */ } });
      db.replace(fresh, 'staff');
      continue;
    }
    if (r.status === 401) { pending = []; staffLogout(); listeners.auth.forEach((f) => f()); break; }
    // 422 (would double-book) or network error: show the server's version again.
    pending = [];
    if (r.data.state) { version = r.data.v; db.replace(r.data.state, 'staff'); } else await staffRefresh();
    listeners.error.forEach((f) => f(r.data.error || 'err.network'));
    break;
  }
  busy = false;
}
