/* Casa Lola — admin dashboard (owner "Lola" + reception). Same data as the public site, live via BroadcastChannel. */
import * as C from './config.js';
import * as remote from './remote.js';
import {
  db, room as roomOf, guest as guestOf, booking as bookingOf, guestName, paidFor, today, addDays, diffDays, nightsList, parse, quote, checkStay, busyNights, isFree,
  createBooking, setStatus, modifyBooking, minStayFor, cancelBooking, refundIfCancelled, addPayment, logTo, STATUSES, SOURCES, OTA, upsertGuest,
} from './store.js';
import {
  t, L, esc, lang, setLang, money, fd, fdShort, ftime, num, icon, img, toast, modal, dlgHead, download, csv, rangePicker, waLink, fill, $, $$, statusPill, countryName, nightsLabel, partyLabel, previewOn, setPreview, isTodo,
} from './ui.js';

const SKEY = 'cl-admin';
const ses = { get: () => { try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch { return null; } }, set: (v) => { try { v ? sessionStorage.setItem(SKEY, JSON.stringify(v)) : sessionStorage.removeItem(SKEY); } catch { /* private */ } } };
let user = ses.get();
let section = location.hash.slice(1) || 'today';
const S = () => db.s;
const OWNER_ONLY = ['kpis', 'rates', 'payments', 'reports', 'settings'];
const can = (sec) => user && (user.role === 'owner' || !OWNER_ONLY.includes(sec));
const isOwner = () => user?.role === 'owner';
const rn = (slug) => roomOf(slug)?.name || slug;
const bal = (b) => Math.round((b.total - paidFor(b.ref)) * 100) / 100;
const by = () => user?.name || 'admin';
const LIVE = (b) => !['cancelled', 'no-show'].includes(b.status);

const NAV = [
  ['today', 'home', 'a.today'], ['kpis', 'chart', 'a.kpis'], ['calendar', 'cal', 'a.calendar'], ['bookings', 'list', 'a.bookings'], ['new', 'plus', 'a.new'],
  ['rooms', 'bed', 'a.rooms'], ['rates', 'tag', 'a.rates'], ['closures', 'ban', 'a.closures'], ['guests', 'users', 'a.guests'], ['requests', 'bell', 'a.requests'],
  ['partners', 'handshake', 'a.partners'], ['messages', 'chat', 'a.messages'], ['housekeeping', 'broom', 'a.housekeeping'], ['payments', 'wallet', 'a.payments'],
  ['reviews', 'star', 'a.reviews'], ['reports', 'dl', 'a.reports'], ['settings', 'gear', 'a.settings'],
];
const root = $('#admin');

/* ---------- Login ---------- */
function login() {
  root.innerHTML = `<div class="login"><form class="login-card f" id="lf">
  <div class="login-brand">${img(C.BRAND.logo, { ratio: '1/1', alt: C.BRAND.name, cls: 'logo' })}<div><b>Casa Lola</b><small>${t('a.dashboard')}</small></div></div>
  <h1>${t('a.signIn')}</h1>
  <label>${t('form.email')}<input name="email" autocomplete="username" required /></label>
  <label>${t('a.pin')}<input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required maxlength="8" /></label>
  <div class="err" hidden role="alert"></div>
  <button class="btn pri block" type="submit">${t('a.enter')}</button>
  <div class="login-l">${langSelect()}<a class="link" href="index.html#/">${t('a.toSite')}</a></div>
</form></div>`;
  const f = $('#lf');
  bindLang();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (remote.live.on) {
      const er = $('.err', f); const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      const r = await remote.staffLogin(f.email.value.trim().toLowerCase(), f.pin.value.trim());
      btn.disabled = false;
      if (!r.ok) { er.textContent = t(r.error === 'err.network' || r.error === 'err.tooMany' ? r.error : 'a.badLogin'); er.hidden = false; return; }
      user = r.user; ses.set(user); section = 'today'; remote.watchStaff(); shell(); return;
    }
    const u = S().users.find((x) => x.email === f.email.value.trim().toLowerCase() && x.pin === f.pin.value.trim());
    if (!u) { const er = $('.err', f); er.textContent = t('a.badLogin'); er.hidden = false; return; }
    user = { email: u.email, name: u.name, role: u.role }; ses.set(user); section = 'today'; shell();
  });
}
const langSelect = () => `<label class="sel"><span class="sr">${t('lang')}</span>${icon('globe')}<select class="langSel">${Object.keys(C.LANGS).map((k) => `<option value="${k}" ${k === lang() ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('')}</select></label>`;
function bindLang() { $$('.langSel').forEach((s) => s.addEventListener('change', (e) => { setLang(e.target.value); user ? shell() : login(); })); }

/* ---------- Shell ---------- */
function shell() {
  if (!can(section)) section = 'today';
  const unread = S().messages.filter((m) => !m.read && m.from === 'guest').length;
  const newReq = S().requests.filter((r) => r.status === 'new').length;
  const badge = (k) => (k === 'messages' && unread ? `<i class="nb">${unread}</i>` : k === 'requests' && newReq ? `<i class="nb">${newReq}</i>` : '');
  root.innerHTML = `<div class="adm ${previewOn() ? 'pv' : ''}">
<aside class="side" id="side"><div class="side-h"><a class="brand" href="#today">${img(C.BRAND.logo, { ratio: '1/1', alt: '', cls: 'logo' })}<span><b>Casa Lola</b><small>${t('a.dashboard')}</small></span></a></div>
  <nav aria-label="${t('a.menu')}">${NAV.filter(([k]) => can(k)).map(([k, ic, lb]) => `<a href="#${k}" class="${section === k ? 'on' : ''}" ${section === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(lb)}</span>${badge(k)}</a>`).join('')}</nav>
  <div class="side-f"><a href="index.html#/" target="_blank" rel="noopener">${icon('home')}<span>${t('a.toSite')}</span></a><a href="guest.html" target="_blank" rel="noopener">${icon('user')}<span>${t('a.toPortal')}</span></a></div>
</aside>
<div class="main">
  <header class="top"><button class="ib menu-b" id="menuB" aria-label="${t('menu')}" aria-controls="side" aria-expanded="false">${icon('menu')}</button>
    <h1>${t(NAV.find(([k]) => k === section)[2])}</h1>
    <div class="top-r">
      <label class="pv-t" title="${t('a.previewHint')}"><input type="checkbox" id="pvT" ${previewOn() ? 'checked' : ''} /><span>${icon('eye')}${t('a.preview')}</span></label>
      ${langSelect()}
      <button class="ib" id="resetB" title="${t('a.reset')}" aria-label="${t('a.reset')}">${icon('reset')}</button>
      <div class="me"><span class="av">${esc(user.name[0])}</span><span class="me-t"><b>${esc(user.name)}</b><small>${t(user.role === 'owner' ? 'a.owner' : 'a.reception')}</small></span><button class="ib" id="outB" aria-label="${t('a.logout')}">${icon('logout')}</button></div>
    </div>
  </header>
  <div class="content" id="content"></div>
</div></div>`;
  bindLang();
  $('#menuB').addEventListener('click', () => { const s = $('#side'); const o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#menuB').setAttribute('aria-expanded', String(o)); });
  $('#side').addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) $('#side').classList.remove('open'); });
  $('#outB').addEventListener('click', () => { user = null; ses.set(null); if (remote.live.on) remote.staffLogout(); login(); });
  $('#resetB').addEventListener('click', async () => {
    if (!confirm(t('a.resetConfirm'))) return;
    if (remote.live.on) { if (!(await remote.staffReset())) { toast(t('err.network'), 'bad'); return; } } else db.reset();
    toast(t('a.resetDone'));
  });
  $('#pvT').addEventListener('change', (e) => { setPreview(e.target.checked); if (e.target.checked) previewList(); shell(); });
  render();
}
function render() {
  const old = $('#content'); if (!old) return;
  const c = old.cloneNode(false); old.replaceWith(c); // fresh node: no listeners left over from the previous render
  c.innerHTML = (VIEWS[section] || VIEWS.today)();
  BINDS[section]?.(c);
}
window.addEventListener('hashchange', () => { section = location.hash.slice(1) || 'today'; if (user) { shell(); if (remote.live.on) remote.staffRefresh(); } });
let stale = false;
db.on(() => { if (!user) return; if (document.querySelector('dialog[open] form')) { stale = true; return; } shell(); });
// A form dialog was open during an update: refresh the page behind it once it closes.
document.addEventListener('close', () => { if (stale && user && !document.querySelector('dialog[open] form')) { stale = false; shell(); } }, true);

function previewList() {
  const s = S();
  const rows = C.TODO_CONFIRM.map((p) => {
    let v = '';
    if (p.startsWith('rooms.')) { const [, slug, k] = p.split('.'); v = slug === '*' ? s.rooms.map((r) => `${r.name}: ${r[k] ?? 'TBC'}`).join(' · ') : `${rn(slug)}: ${roomOf(slug)?.[k] ?? 'TBC'}`; }
    else if (p.startsWith('pricing.')) v = s.rates[p.split('.')[1]];
    else if (p.startsWith('policies.')) { const x = s.settings[p.split('.')[1]]; v = typeof x === 'object' ? L(x).join(' / ') : x; }
    else if (p === 'seasons') v = s.rates.seasons.map((x) => `${L(x.name)} ×${x.mult}`).join(' · ');
    else if (p === 'offers.longStay') v = `−${s.rates.longStay.pct}% ≥ ${s.rates.longStay.nights}`;
    else if (p === 'offers.promoCodes') v = s.rates.promoCodes.map((x) => x.code).join(', ');
    else if (p.startsWith('extras.')) v = s.rates.extras[p.split('.')[1]].price;
    else if (p === 'reviews.selected') v = `${s.reviews.selected.length}`;
    else if (p === 'partners') v = `${s.partners.length}`;
    return `<tr><td><code>${esc(p)}</code></td><td>${esc(String(v))}</td></tr>`;
  }).join('');
  modal(`${dlgHead(t('a.todoTitle'))}<div class="dlg-b"><p class="hint">${t('a.todoIntro')}</p><div class="tbl-w"><table class="tbl"><thead><tr><th>${t('a.field')}</th><th>${t('a.value')}</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="dlg-f"><a class="btn pri" href="index.html#/?preview" target="_blank" rel="noopener">${icon('eye')}${t('a.openPreview')}</a></div>`, { wide: true });
}

/* ---------- Helpers ---------- */
const kpi = (label, value, sub = '', ic = '') => `<div class="kpi">${ic ? icon(ic) : ''}<span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
const empty = (txt) => `<p class="empty">${txt}</p>`;
const gName = (b) => esc(guestName(guestOf(b.guestId)));
const srcLabel = (s) => t(`src.${s}`);
const bookRow = (b, extra = '') => `<button class="li" data-open="${b.ref}"><span class="li-m"><b>${gName(b)}</b><small>${esc(rn(b.room))} · ${fdShort(b.from)} → ${fdShort(b.to)} · ${partyLabel(b.adults, b.children)}</small></span>${extra}${statusPill(b.status)}</button>`;
const phoneOf = (b) => guestOf(b.guestId)?.phone || '';
const tplVars = (b) => { const g = guestOf(b.guestId); return { name: g?.first || '', ref: b.ref, from: fd(b.from), to: fd(b.to), room: rn(b.room), maps: S().settings.contact.maps, review: S().reviews.google.url }; };
const tplText = (key, b) => { const g = guestOf(b.guestId); const lg = g?.lang && C.LANGS[g.lang] ? g.lang : 'fr'; return fill(S().settings.templates[key][lg], tplVars(b)); };
const openDays = (n) => (n === 0 ? t('a.todayL') : n === 1 ? t('a.tomorrow') : fdShort(addDays(today(), n)));

/* ---------- Views ---------- */
const VIEWS = {
  today() {
    const s = S(); const td = today(); const tm = addDays(td, 1);
    const arr = s.bookings.filter((b) => b.from === td && ['confirmed', 'pending'].includes(b.status));
    const dep = s.bookings.filter((b) => b.to === td && b.status === 'checked-in');
    const inh = s.bookings.filter((b) => b.status === 'checked-in');
    const dirty = s.rooms.filter((r) => ['dirty', 'progress'].includes(s.housekeeping[r.slug]));
    const reqs = s.requests.filter((r) => r.status === 'new');
    const unpaid = s.bookings.filter((b) => ['checked-in', 'checked-out'].includes(b.status) && bal(b) > 0);
    const tmr = s.bookings.filter((b) => b.from === tm && ['confirmed', 'pending'].includes(b.status));
    const occ = Math.round((inh.length / s.rooms.filter((r) => r.active).length) * 100);
    return `<p class="greet">${t('a.hello', { name: esc(user.name) })} · ${fd(td, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
<div class="kpis">${kpi(t('a.arrivals'), arr.length, '', 'door')}${kpi(t('a.departures'), dep.length, '', 'logout')}${kpi(t('a.inHouse'), inh.length, t('a.occToday', { n: occ }), 'users')}${kpi(t('a.toClean'), dirty.length, '', 'broom')}${kpi(t('a.newRequests'), reqs.length, '', 'bell')}${isOwner() ? kpi(t('a.unpaid'), money(unpaid.reduce((a, b) => a + bal(b), 0)), t('a.bookingsN', { n: unpaid.length }), 'wallet') : ''}</div>
<div class="grid2">
  <section class="panel"><h2>${icon('door')}${t('a.arrivalsToday')}</h2>${arr.map((b) => bookRow(b, `<span class="li-x">${esc(b.prearrival?.arrivalTime || b.arrivalTime || '—')}</span>`)).join('') || empty(t('a.none'))}
    ${arr.filter((b) => b.status !== 'pending').map((b) => `<button class="btn sm pri" data-act="checked-in" data-ref="${b.ref}">${t('a.checkIn')} · ${gName(b)}</button>`).join('')}</section>
  <section class="panel"><h2>${icon('logout')}${t('a.departuresToday')}</h2>${dep.map((b) => bookRow(b, isOwner() && bal(b) > 0 ? `<span class="li-x bad">${money(bal(b))}</span>` : '')).join('') || empty(t('a.none'))}
    ${dep.map((b) => `<button class="btn sm dark" data-act="checked-out" data-ref="${b.ref}">${t('a.checkOut')} · ${gName(b)}</button>`).join('')}</section>
  <section class="panel"><h2>${icon('users')}${t('a.inHouse')}</h2>${inh.map((b) => bookRow(b, `<span class="li-x">${t('a.until')} ${fdShort(b.to)}</span>`)).join('') || empty(t('a.none'))}</section>
  <section class="panel"><h2>${icon('plane')}${t('a.tomorrowArr')}</h2>${tmr.map((b) => bookRow(b, `<span class="li-x">${esc(b.prearrival?.arrivalTime || b.arrivalTime || '—')}${b.prearrival?.flight ? ` · ✈ ${esc(b.prearrival.flight)}` : ''}</span>`)).join('') || empty(t('a.none'))}</section>
  <section class="panel"><h2>${icon('broom')}${t('a.toClean')}</h2>${dirty.map((r) => `<a class="li" href="#housekeeping"><span class="li-m"><b>${esc(r.name)}</b></span><span class="pill hk-${s.housekeeping[r.slug]}">${t(`hk.${s.housekeeping[r.slug]}`)}</span></a>`).join('') || empty(t('a.allClean'))}</section>
  <section class="panel"><h2>${icon('bell')}${t('a.newRequests')}</h2>${reqs.map((r) => reqRow(r)).join('') || empty(t('a.none'))}</section>
  ${isOwner() ? `<section class="panel"><h2>${icon('wallet')}${t('a.unpaid')}</h2>${unpaid.map((b) => bookRow(b, `<span class="li-x bad">${money(bal(b))}</span>`)).join('') || empty(t('a.none'))}</section>` : ''}
</div>`;
  },

  kpis() {
    const s = S(); const td = today(); const ym = td.slice(0, 7);
    const prevYm = (() => { const d = parse(`${ym}-01`); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();
    const m = monthStats(ym); const p = monthStats(prevYm);
    const live = s.bookings.filter((b) => b.createdAt.slice(0, 10) >= addDays(td, -90));
    const bySrc = SOURCES.map((k) => [k, live.filter((b) => b.source === k).length]).filter(([, n]) => n);
    const groups = [['direct', live.filter((b) => b.source === 'direct').length], ['whatsapp', live.filter((b) => b.source === 'whatsapp').length], ['ota', live.filter((b) => OTA.includes(b.source)).length], ['other', live.filter((b) => ['phone', 'instagram', 'walkin'].includes(b.source)).length]];
    const total = live.length || 1;
    const canc = live.filter((b) => b.status === 'cancelled').length;
    const stays = s.bookings.filter(LIVE);
    const avgLos = stays.reduce((a, b) => a + diffDays(b.from, b.to), 0) / (stays.length || 1);
    const months = [-5, -4, -3, -2, -1, 0, 1, 2].map((k) => { const d = parse(`${ym}-01`); d.setMonth(d.getMonth() + k); const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; return { y, ...monthStats(y) }; });
    const max = Math.max(...months.map((x) => x.revenue), 1);
    const delta = p.revenue ? Math.round(((m.revenue - p.revenue) / p.revenue) * 100) : 0;
    return `<div class="kpis">
  ${kpi(t('a.occupancy'), `${m.occ}%`, t('a.vsLast', { n: `${p.occ}%` }), 'bed')}
  ${kpi('ADR', money(m.adr), t('a.adrHint'), 'tag')}
  ${kpi('RevPAR', money(m.revpar), t('a.revparHint'), 'chart')}
  ${kpi(t('a.revenueMonth'), money(m.revenue), `${delta >= 0 ? '+' : ''}${delta}% ${t('a.vsLastShort')}`, 'wallet')}
  ${kpi(t('a.avgStay'), t('nights.many', { n: num(avgLos, 1) }), '', 'clock')}
  ${kpi(t('a.cancellations'), canc, t('a.cancelRate', { n: Math.round((canc / total) * 100) }), 'ban')}
</div>
<div class="grid2">
  <section class="panel wide"><h2>${icon('chart')}${t('a.revenue8')}</h2><div class="bars">${months.map((x) => `<div class="bar ${x.y === ym ? 'cur' : ''} ${x.y > ym ? 'fut' : ''}"><span class="bv">${money(x.revenue)}</span><i style="height:${Math.max(2, (x.revenue / max) * 100)}%"></i><span class="bl">${fd(`${x.y}-01`, { month: 'short' })}</span><span class="bo">${x.occ}%</span></div>`).join('')}</div><p class="hint">${t('a.barsHint')}</p></section>
  <section class="panel"><h2>${icon('users')}${t('a.channels')}</h2>${groups.map(([k, n]) => hbar(t(`grp.${k}`), n, total)).join('')}<h3 class="h4">${t('a.bySource')}</h3>${bySrc.map(([k, n]) => hbar(srcLabel(k), n, total)).join('')}</section>
  <section class="panel"><h2>${icon('bed')}${t('a.byRoom')}</h2>${s.rooms.map((r) => { const st = roomMonth(r.slug, ym); return hbar(r.name, st.nights, m.days, `${st.nights}/${m.days} · ${money(st.revenue)}`); }).join('')}</section>
</div>`;
  },

  calendar() {
    const s = S(); const span = cal.span; const start = cal.start || addDays(today(), -2); cal.start = start;
    const days = [...Array(span)].map((_, i) => addDays(start, i));
    const col = (d) => diffDays(start, d) + 2;
    const rooms = s.rooms.filter((r) => r.active);
    let html = `<div class="cal-bar"><div class="seg"><button class="${span === 14 ? 'on' : ''}" data-span="14">${t('a.twoWeeks')}</button><button class="${span === 31 ? 'on' : ''}" data-span="31">${t('a.month')}</button></div>
<div class="cal-nav"><button class="ib" data-shift="-${span === 14 ? 7 : 15}" aria-label="${t('pick.prev')}">${icon('chevL')}</button><button class="btn ghost sm" data-shift="0">${t('a.todayL')}</button><button class="ib" data-shift="${span === 14 ? 7 : 15}" aria-label="${t('pick.next')}">${icon('chev')}</button></div>
<div class="legend">${['pending', 'confirmed', 'checked-in', 'checked-out'].map((x) => `<span class="lg st-${x}">${t(`st.${x}`)}</span>`).join('')}<span class="lg closed">${t('a.closure')}</span></div></div>
<div class="tl-w"><div class="tl" style="grid-template-columns:150px repeat(${span}, minmax(${span === 14 ? 56 : 38}px, 1fr));grid-template-rows:auto repeat(${rooms.length}, 58px)">
<div class="tl-h corner">${t('room.room')}</div>${days.map((d) => `<div class="tl-h ${d === today() ? 'td' : ''} ${[0, 6].includes(parse(d).getDay()) ? 'we' : ''}"><small>${fd(d, { weekday: 'short' })}</small><b>${parse(d).getDate()}</b></div>`).join('')}`;
    rooms.forEach((r, ri) => {
      const row = ri + 2;
      html += `<div class="tl-r" style="grid-row:${row}"><b>${esc(r.name)}</b><small><span class="dot hk-${s.housekeeping[r.slug]}"></span>${t(`hk.${s.housekeeping[r.slug]}`)}</small></div>`;
      days.forEach((d, i) => { html += `<button class="tl-c ${d === today() ? 'td' : ''}" style="grid-row:${row};grid-column:${i + 2}" data-new="${r.slug}|${d}" aria-label="${t('a.newOn', { room: r.name, date: fd(d) })}"></button>`; });
      s.closures.filter((c) => (c.room === r.slug || c.room === 'all') && c.to >= start && c.from <= days[span - 1]).forEach((c) => {
        const a = Math.max(2, col(c.from)); const z = Math.min(span + 2, col(addDays(c.to, 1)));
        html += `<div class="tl-x" style="grid-row:${row};grid-column:${a}/${z}" title="${esc(c.reason)}">${esc(c.reason)}</div>`;
      });
      s.bookings.filter((b) => b.room === r.slug && LIVE(b) && b.to > start && b.from <= days[span - 1]).forEach((b) => {
        const a = Math.max(2, col(b.from)); const z = Math.min(span + 2, col(b.to) + (b.to > days[span - 1] ? 0 : 0));
        html += `<button class="tl-b st-${b.status} ${b.from < start ? 'cut-l' : ''} ${b.to > days[span - 1] ? 'cut-r' : ''}" style="grid-row:${row};grid-column:${a}/${Math.max(a + 1, z)}" data-open="${b.ref}" title="${gName(b)} · ${b.ref}"><b>${gName(b)}</b><small>${srcLabel(b.source)} · ${nightsLabel(diffDays(b.from, b.to))}</small></button>`;
      });
    });
    return `${html}</div></div><p class="hint">${t('a.calHint')}</p>`;
  },

  bookings() {
    const f = bk.f; const s = S();
    const q = f.q.trim().toLowerCase();
    const list = s.bookings.filter((b) => (!f.status || b.status === f.status) && (!f.source || b.source === f.source) && (!f.room || b.room === f.room) && (!f.from || b.to > f.from) && (!f.to || b.from <= f.to)
      && (!q || b.ref.toLowerCase().includes(q) || guestName(guestOf(b.guestId)).toLowerCase().includes(q) || (guestOf(b.guestId)?.email || '').includes(q)))
      .sort((a, b) => {
        if (f.sort === 'created') return b.createdAt.localeCompare(a.createdAt);
        const td = today(); const ua = a.to >= td; const ub = b.to >= td; // upcoming & in-house first (soonest first), then past stays (latest first)
        return ua !== ub ? (ua ? -1 : 1) : ua ? a.from.localeCompare(b.from) : b.from.localeCompare(a.from);
      });
    return `<form class="filt" id="bf">
  <label class="fl grow">${t('a.search')}<input class="inp" name="q" value="${esc(f.q)}" placeholder="${t('a.searchPh')}" /></label>
  <label class="fl">${t('a.status')}<select class="inp" name="status"><option value="">${t('all')}</option>${STATUSES.map((x) => `<option value="${x}" ${f.status === x ? 'selected' : ''}>${t(`st.${x}`)}</option>`).join('')}</select></label>
  <label class="fl">${t('a.source')}<select class="inp" name="source"><option value="">${t('all')}</option>${SOURCES.map((x) => `<option value="${x}" ${f.source === x ? 'selected' : ''}>${srcLabel(x)}</option>`).join('')}</select></label>
  <label class="fl">${t('room.room')}<select class="inp" name="room"><option value="">${t('all')}</option>${s.rooms.map((r) => `<option value="${r.slug}" ${f.room === r.slug ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
  <label class="fl">${t('a.from')}<input class="inp" type="date" name="from" value="${f.from}" /></label>
  <label class="fl">${t('a.to')}<input class="inp" type="date" name="to" value="${f.to}" /></label>
  <label class="fl">${t('a.sort')}<select class="inp" name="sort"><option value="arrival">${t('a.sortArrival')}</option><option value="created" ${f.sort === 'created' ? 'selected' : ''}>${t('a.sortCreated')}</option></select></label>
</form>
<p class="count">${t('a.results', { n: list.length })} <a class="btn sm pri" href="#new">${icon('plus')}${t('a.new')}</a></p>
<div class="tbl-w"><table class="tbl rows"><thead><tr><th>${t('a.ref')}</th><th>${t('a.guest')}</th><th>${t('room.room')}</th><th>${t('a.dates')}</th><th>${t('a.source')}</th><th>${t('a.status')}</th>${isOwner() ? `<th class="r">${t('q.total')}</th><th class="r">${t('conf.balance')}</th>` : ''}</tr></thead><tbody>
${list.map((b) => `<tr data-open="${b.ref}" tabindex="0"><td data-l="${t('a.ref')}"><code>${b.ref}</code></td><td data-l="${t('a.guest')}"><b>${gName(b)}</b></td><td data-l="${t('room.room')}">${esc(rn(b.room))}</td><td data-l="${t('a.dates')}">${fdShort(b.from)} → ${fdShort(b.to)} <small class="mut">(${diffDays(b.from, b.to)})</small></td><td data-l="${t('a.source')}">${srcLabel(b.source)}</td><td data-l="${t('a.status')}">${statusPill(b.status)}</td>${isOwner() ? `<td class="r" data-l="${t('q.total')}">${money(b.total)}</td><td class="r ${bal(b) > 0 && LIVE(b) ? 'bad' : ''}" data-l="${t('conf.balance')}">${LIVE(b) ? money(bal(b)) : '—'}</td>` : ''}</tr>`).join('') || `<tr><td colspan="8">${empty(t('a.none'))}</td></tr>`}
</tbody></table></div>`;
  },

  new() {
    const n = nb.d; const s = S();
    const q = n.from && n.to ? quote({ room: n.room, from: n.from, to: n.to, adults: n.adults, children: n.children, promo: n.promo }) : null;
    const err = n.from && n.to ? checkStay(n) : null;
    return `<form class="newb" id="nf">
<section class="panel"><h2>${icon('wa')}${t('a.newIntro')}</h2>
  <div class="f">
    <div class="row2"><label>${t('a.source')} *<select name="source" required><option value="">—</option>${SOURCES.map((x) => `<option value="${x}" ${n.source === x ? 'selected' : ''}>${srcLabel(x)}</option>`).join('')}</select></label>
    <label>${t('a.status')}<select name="status"><option value="confirmed" ${n.status === 'confirmed' ? 'selected' : ''}>${t('st.confirmed')}</option><option value="pending" ${n.status === 'pending' ? 'selected' : ''}>${t('st.pending')}</option></select></label></div>
    <div class="row2"><label>${t('room.room')}<select name="room">${s.rooms.filter((r) => r.active).map((r) => `<option value="${r.slug}" ${n.room === r.slug ? 'selected' : ''}>${esc(r.name)} (${r.capacity})</option>`).join('')}</select></label>
    <label>${t('a.dates')}<button type="button" class="inp dbtn" id="nDates">${icon('cal')}${n.from && n.to ? `${fd(n.from)} → ${fd(n.to)} · ${nightsLabel(diffDays(n.from, n.to))}` : t('s.addDate')}</button></label></div>
    <div class="row3"><label>${t('party.adultsL')}<input type="number" name="adults" min="1" max="3" value="${n.adults}" /></label><label>${t('party.childrenL')}<input type="number" name="children" min="0" max="2" value="${n.children}" /></label><label>${t('fl.promo')}<input name="promo" value="${esc(n.promo)}" /></label></div>
  </div>
</section>
<section class="panel"><h2>${icon('user')}${t('a.guest')}</h2><div class="f">
  <label>${t('a.findGuest')}<input name="find" list="glist" placeholder="${t('a.findGuestPh')}" value="${esc(n.find)}" /></label>
  <datalist id="glist">${s.guests.map((g) => `<option value="${esc(g.email)}">${esc(guestName(g))}</option>`).join('')}</datalist>
  <div class="row2"><label>${t('form.first')} *<input name="first" required value="${esc(n.first)}" /></label><label>${t('form.last')} *<input name="last" required value="${esc(n.last)}" /></label></div>
  <div class="row2"><label>${t('form.whatsapp')} *<input name="phone" required value="${esc(n.phone)}" placeholder="+34 …" /></label><label>${t('form.email')}<input type="email" name="email" value="${esc(n.email)}" /></label></div>
  <div class="row2"><label>${t('form.country')}<input name="country" maxlength="2" value="${esc(n.country)}" placeholder="ES" /></label><label>${t('form.arrival')}<input name="arrivalTime" value="${esc(n.arrivalTime)}" placeholder="15:00" /></label></div>
  <label>${t('form.notes')}<textarea name="notes">${esc(n.notes)}</textarea></label>
</div></section>
<section class="panel"><h2>${icon('wallet')}${t('a.payment')}</h2><div class="f">
  <div class="row2"><label>${t('a.payMode')}<select name="payMode">${['deposit', 'arrival', 'ota'].map((x) => `<option value="${x}" ${n.payMode === x ? 'selected' : ''}>${t(`pm.${x}`)}</option>`).join('')}</select></label>
  ${isOwner() ? `<label>${t('a.paidNow')}<input type="number" name="paid" min="0" step="1" value="${n.paid}" /></label>` : ''}</div>
  ${q ? `<div class="bb">${qLines(q)}</div>` : ''}
  ${err ? `<p class="err" role="alert">${t(err, { n: minStayFor(n.from || today()) })}</p>` : ''}
  <button type="submit" class="btn pri" ${!q || err ? 'disabled' : ''}>${t('a.create')}</button>
</div></section>
</form>`;
  },

  rooms() {
    const s = S();
    return `<div class="cards">${s.rooms.map((r) => `<article class="rcard ${r.active ? '' : 'off'}">${img(`rooms/${r.slug}-1.jpg`, { ratio: '3/2', alt: r.name })}<div><h3>${esc(r.name)} ${r.active ? '' : `<span class="pill">${t('a.inactive')}</span>`}</h3><p class="mut">${esc(L(r.floor))}</p><p>${r.size ? `${r.size} m²` : 'TBC'} · ${r.beds ? L(C.BED_LABEL[r.beds]) : 'TBC'} · ${t('room.upTo', { n: r.capacity })}</p>${isOwner() ? `<p><b>${money(r.price)}</b> / ${t('room.night')} · ${t('a.single')} ${money(r.single)}</p>` : ''}<button class="btn sm ghost" data-room="${r.slug}">${icon('edit')}${t('a.edit')}</button></div></article>`).join('')}</div>`;
  },

  rates() {
    const R = S().rates;
    return `<form id="rf" class="f">
<section class="panel"><h2>${icon('cal')}${t('a.seasons')}</h2>
  <div class="tbl-w"><table class="tbl"><thead><tr><th>${t('a.name')}</th><th>${t('a.ranges')}</th><th>${t('a.mult')}</th><th>${t('a.minStay')}</th></tr></thead><tbody>${R.seasons.map((x, i) => `<tr><td><input class="inp" name="sn${i}" value="${esc(L(x.name))}" /></td><td><input class="inp" name="sr${i}" value="${x.ranges.map((r) => r.join('→')).join('; ')}" placeholder="${i === R.seasons.length - 1 ? t('a.fallback') : '10-01→04-30'}" ${i === R.seasons.length - 1 ? 'disabled' : ''} /></td><td><input class="inp" type="number" step="0.05" min="0.5" max="3" name="sm${i}" value="${x.mult}" /></td><td><input class="inp" type="number" min="1" max="30" name="ss${i}" value="${x.minStay}" /></td></tr>`).join('')}</tbody></table></div>
  <p class="hint">${t('a.rangesHint')}</p>
</section>
<section class="panel"><h2>${icon('tag')}${t('a.supplements')}</h2><div class="row3">
  <label>${t('a.longNights')}<input type="number" name="lsn" min="1" value="${R.longStay.nights}" /></label><label>${t('a.longPct')}<input type="number" name="lsp" min="0" max="80" value="${R.longStay.pct}" /></label><label>${t('a.tax')}<input type="number" step="0.5" min="0" name="tax" value="${R.touristTax}" /></label>
  <label>${t('a.childSup')}<input type="number" min="0" name="child" value="${R.childPerNight}" /></label><label>${t('a.adultSup')}<input type="number" min="0" name="xad" value="${R.extraAdultPerNight}" /></label><label>${t('a.rate')}<input type="number" step="0.01" min="1" name="mad" value="${R.eurToMad}" /></label>
  <label>${t('fl.transfer')} (€)<input type="number" min="0" name="trf" value="${R.extras.transfer.price}" /></label><label>${t('a.lateCo')} (€)<input type="number" min="0" name="late" value="${R.extras.lateCheckout.price}" /></label>
</div></section>
<section class="panel"><h2>${icon('tag')}${t('a.promos')}</h2>
  <div class="tbl-w"><table class="tbl"><thead><tr><th>${t('a.code')}</th><th>%</th><th>${t('a.from')}</th><th>${t('a.to')}</th><th>${t('a.maxUses')}</th><th>${t('a.uses')}</th><th></th></tr></thead><tbody>${R.promoCodes.map((p, i) => `<tr><td><input class="inp" name="pc${i}" value="${esc(p.code)}" /></td><td><input class="inp" type="number" name="pp${i}" value="${p.pct}" min="1" max="90" /></td><td><input class="inp" type="date" name="pf${i}" value="${p.from || ''}" /></td><td><input class="inp" type="date" name="pt${i}" value="${p.to || ''}" /></td><td><input class="inp" type="number" name="pm${i}" value="${p.maxUses || ''}" /></td><td>${p.uses || 0}</td><td><button type="button" class="ib" data-delpromo="${i}" aria-label="${t('a.delete')}">${icon('trash')}</button></td></tr>`).join('')}</tbody></table></div>
  <button type="button" class="btn sm ghost" id="addPromo">${icon('plus')}${t('a.addPromo')}</button>
</section>
<div class="savebar"><button class="btn pri" type="submit">${t('a.save')}</button></div></form>`;
  },

  closures() {
    const s = S();
    return `<section class="panel"><h2>${icon('ban')}${t('a.addClosure')}</h2><form class="f" id="cf"><div class="row3">
  <label>${t('room.room')}<select name="room"><option value="all">${t('a.wholeHouse')}</option>${s.rooms.map((r) => `<option value="${r.slug}">${esc(r.name)}</option>`).join('')}</select></label>
  <label>${t('a.from')}<input type="date" name="from" required min="${today()}" /></label><label>${t('a.to')}<input type="date" name="to" required min="${today()}" /></label></div>
  <label>${t('a.reason')}<input name="reason" required placeholder="${t('a.reasonPh')}" /></label><div class="err" hidden role="alert"></div><button class="btn pri" type="submit">${t('a.block')}</button></form></section>
<section class="panel"><h2>${t('a.closures')}</h2>${s.closures.sort((a, b) => a.from.localeCompare(b.from)).map((c) => `<div class="li"><span class="li-m"><b>${c.room === 'all' ? t('a.wholeHouse') : esc(rn(c.room))}</b><small>${fd(c.from)} → ${fd(c.to)} · ${esc(c.reason)}</small></span><button class="ib" data-delc="${c.id}" aria-label="${t('a.delete')}">${icon('trash')}</button></div>`).join('') || empty(t('a.none'))}</section>`;
  },

  guests() {
    const s = S(); const f = gs.f; const q = f.q.toLowerCase();
    const rows = s.guests.map((g) => { const bs = s.bookings.filter((b) => b.guestId === g.id); return { g, stays: bs.filter((b) => ['checked-out', 'checked-in'].includes(b.status)).length, all: bs.length, spent: bs.reduce((a, b) => a + Math.max(0, paidFor(b.ref)), 0) }; })
      .filter(({ g }) => (!f.tag || g.tags.includes(f.tag)) && (!q || guestName(g).toLowerCase().includes(q) || g.email.includes(q) || (g.phone || '').includes(q)))
      .sort((a, b) => b.spent - a.spent);
    return `<form class="filt" id="gf"><label class="fl grow">${t('a.search')}<input class="inp" name="q" value="${esc(f.q)}" placeholder="${t('a.guestSearchPh')}" /></label>
<label class="fl">${t('a.tag')}<select class="inp" name="tag"><option value="">${t('all')}</option>${TAGS.map((x) => `<option value="${x}" ${f.tag === x ? 'selected' : ''}>${t(`tag.${x}`)}</option>`).join('')}</select></label>
<button type="button" class="btn sm ghost" id="gcsv">${icon('dl')}CSV</button></form>
<div class="tbl-w"><table class="tbl rows"><thead><tr><th>${t('a.guest')}</th><th>${t('form.country')}</th><th>${t('lang')}</th><th class="r">${t('a.stays')}</th>${isOwner() ? `<th class="r">${t('a.spent')}</th>` : ''}<th>${t('a.tags')}</th><th>${t('a.marketing')}</th></tr></thead><tbody>
${rows.map(({ g, stays, all, spent }) => `<tr data-guest="${g.id}" tabindex="0"><td data-l="${t('a.guest')}"><b>${esc(guestName(g))}</b><br><small class="mut">${esc(g.email)}</small></td><td data-l="${t('form.country')}">${g.country ? esc(countryName(g.country)) : '—'}</td><td data-l="${t('lang')}">${(g.lang || '').toUpperCase()}</td><td class="r" data-l="${t('a.stays')}">${stays} <small class="mut">/ ${all}</small></td>${isOwner() ? `<td class="r" data-l="${t('a.spent')}">${money(spent)}</td>` : ''}<td data-l="${t('a.tags')}">${g.tags.map((x) => `<span class="pill">${t(`tag.${x}`)}</span>`).join(' ')}</td><td data-l="${t('a.marketing')}">${g.marketing ? icon('check') : '—'}</td></tr>`).join('')}
</tbody></table></div>`;
  },

  requests() {
    const s = S(); const f = rq.f;
    const list = s.requests.filter((r) => (!f.type || r.type === f.type) && (!f.status || r.status === f.status)).sort((a, b) => b.at.localeCompare(a.at));
    return `<form class="filt" id="qf"><label class="fl">${t('a.type')}<select class="inp" name="type"><option value="">${t('all')}</option>${['experience', 'transfer', 'late'].map((x) => `<option value="${x}" ${f.type === x ? 'selected' : ''}>${t(`rt.${x}`)}</option>`).join('')}</select></label>
<label class="fl">${t('a.status')}<select class="inp" name="status"><option value="">${t('all')}</option>${['new', 'arranged', 'done', 'declined'].map((x) => `<option value="${x}" ${f.status === x ? 'selected' : ''}>${t(`rs.${x}`)}</option>`).join('')}</select></label></form>
<div class="list">${list.map((r) => reqRow(r, true)).join('') || empty(t('a.none'))}</div>`;
  },

  partners() {
    const s = S();
    return `<section class="panel"><p class="hint">${t('a.partnersHint')}</p><div class="tbl-w"><table class="tbl"><thead><tr><th>${t('a.name')}</th><th>${t('a.activity')}</th><th>${t('form.phone')}</th><th>${t('a.commission')}</th><th></th></tr></thead><tbody>
${s.partners.map((p, i) => `<tr><td><input class="inp" data-pp="${i}|name" value="${esc(p.name)}" /></td><td><select class="inp" data-pp="${i}|activity">${[...C.EXPERIENCES.map((e) => e.id), 'transfer'].map((x) => `<option value="${x}" ${p.activity === x ? 'selected' : ''}>${x === 'transfer' ? t('rt.transfer') : esc(L(C.EXPERIENCES.find((e) => e.id === x))[0])}</option>`).join('')}</select></td><td><input class="inp" data-pp="${i}|phone" value="${esc(p.phone)}" /></td><td><input class="inp" type="number" min="0" max="50" data-pp="${i}|commission" value="${p.commission}" /></td><td><button class="ib" data-delp="${i}" aria-label="${t('a.delete')}">${icon('trash')}</button></td></tr>`).join('')}
</tbody></table></div><button class="btn sm ghost" id="addP">${icon('plus')}${t('a.addPartner')}</button></section>`;
  },

  messages() {
    const s = S();
    const threads = {};
    s.messages.forEach((m) => { (threads[m.thread] ||= []).push(m); });
    const list = Object.entries(threads).map(([id, ms]) => ({ id, ms: ms.sort((a, b) => a.at.localeCompare(b.at)), last: ms[ms.length - 1] })).sort((a, b) => b.last.at.localeCompare(a.last.at));
    const cur = msg.thread && threads[msg.thread] ? list.find((x) => x.id === msg.thread) : list[0];
    if (cur) msg.thread = cur.id;
    const title = (th) => { const b = bookingOf(th.id); return b ? `${gName(b)} · ${b.ref}` : esc(th.ms[0].name || t('a.contact')); };
    return `<div class="inbox">
<div class="threads">${list.map((th) => `<button class="th ${cur && th.id === cur.id ? 'on' : ''} ${th.ms.some((m) => !m.read && m.from === 'guest') ? 'unread' : ''}" data-th="${th.id}"><b>${title(th)}</b><small>${esc(th.last.text.slice(0, 70))}</small><span>${ftime(th.last.at)}</span></button>`).join('') || empty(t('a.none'))}</div>
<div class="thread">${cur ? `<div class="th-h"><h2>${title(cur)}</h2>${(() => { const b = bookingOf(cur.id); const ph = b ? phoneOf(b) : cur.ms[0].phone; const em = b ? guestOf(b.guestId)?.email : cur.ms[0].email; return `${b ? `<button class="btn sm ghost" data-open="${b.ref}">${t('a.openBooking')}</button>` : ''}${ph ? `<a class="btn sm wa" href="${waLink('', ph)}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a>` : ''}${em ? `<a class="btn sm ghost" href="mailto:${esc(em)}">${icon('mail')}${t('form.email')}</a>` : ''}`; })()}</div>
${cur.ms[0].subject ? `<p class="hint">${t('a.subject')}: ${esc(cur.ms[0].subject)}${cur.ms[0].email ? ` · ${esc(cur.ms[0].email)}` : ''}${cur.ms[0].phone ? ` · ${esc(cur.ms[0].phone)}` : ''}</p>` : ''}
<div class="msgs">${cur.ms.map((m) => `<div class="msg ${m.from}"><p>${esc(m.text)}</p><small>${esc(m.name || '')} · ${ftime(m.at)}</small></div>`).join('')}</div>
<form class="reply" id="rpf"><label class="sr" for="rpt">${t('a.reply')}</label><textarea id="rpt" class="inp" name="text" required placeholder="${t('a.replyPh')}"></textarea><button class="btn pri">${icon('send')}${t('a.send')}</button></form>` : empty(t('a.noThread'))}</div></div>`;
  },

  housekeeping() {
    const s = S(); const td = today();
    return `<p class="hint">${t('a.hkHint')}</p><div class="hk">${s.rooms.filter((r) => r.active).map((r) => {
      const st = s.housekeeping[r.slug] || 'clean';
      const inh = s.bookings.find((b) => b.room === r.slug && b.status === 'checked-in');
      const next = s.bookings.filter((b) => b.room === r.slug && ['confirmed', 'pending'].includes(b.status) && b.from >= td).sort((a, b) => a.from.localeCompare(b.from))[0];
      return `<article class="hkc hk-b-${st}"><h3>${esc(r.name)}</h3><p class="mut">${inh ? `${icon('user')}${gName(inh)} · ${t('a.until')} ${fdShort(inh.to)}` : t('a.empty')}</p><p class="mut">${next ? `${icon('door')}${t('a.next')}: ${openDays(diffDays(td, next.from))} · ${gName(next)}` : `${t('a.next')}: —`}</p>
<div class="hk-b">${['clean', 'dirty', 'progress', 'oos'].map((x) => `<button class="${st === x ? 'on' : ''} hk-${x}" data-hk="${r.slug}|${x}" aria-pressed="${st === x}">${t(`hk.${x}`)}</button>`).join('')}</div></article>`;
    }).join('')}</div>`;
  },

  payments() {
    const s = S(); const f = py.f;
    const list = s.payments.filter((p) => (!f.kind || p.kind === f.kind) && (!f.method || p.method === f.method) && (!f.month || p.at.slice(0, 7) === f.month)).sort((a, b) => b.at.localeCompare(a.at));
    const rec = list.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0); const ref = list.filter((p) => p.amount < 0).reduce((a, p) => a + p.amount, 0);
    const out = s.bookings.filter((b) => LIVE(b) && b.status !== 'pending' && bal(b) > 0);
    return `<div class="kpis">${kpi(t('a.received'), money(rec), '', 'wallet')}${kpi(t('a.refunds'), money(ref), '', 'reset')}${kpi(t('a.net'), money(rec + ref), '', 'chart')}${kpi(t('a.outstanding'), money(out.reduce((a, b) => a + bal(b), 0)), t('a.bookingsN', { n: out.length }), 'clock')}</div>
<form class="filt" id="pyf"><label class="fl">${t('a.kind')}<select class="inp" name="kind"><option value="">${t('all')}</option>${['deposit', 'balance', 'refund'].map((x) => `<option value="${x}" ${f.kind === x ? 'selected' : ''}>${t(`pk.${x}`)}</option>`).join('')}</select></label>
<label class="fl">${t('a.method')}<select class="inp" name="method"><option value="">${t('all')}</option>${['card', 'cash', 'transfer', 'ota'].map((x) => `<option value="${x}" ${f.method === x ? 'selected' : ''}>${t(`pmt.${x}`)}</option>`).join('')}</select></label>
<label class="fl">${t('a.month')}<input class="inp" type="month" name="month" value="${f.month}" /></label></form>
<div class="tbl-w"><table class="tbl rows"><thead><tr><th>${t('a.date')}</th><th>${t('a.ref')}</th><th>${t('a.guest')}</th><th>${t('a.kind')}</th><th>${t('a.method')}</th><th class="r">${t('a.amount')}</th></tr></thead><tbody>
${list.map((p) => { const b = bookingOf(p.ref); return `<tr ${b ? `data-open="${p.ref}" tabindex="0"` : ''}><td data-l="${t('a.date')}">${ftime(p.at)}</td><td data-l="${t('a.ref')}"><code>${p.ref}</code></td><td data-l="${t('a.guest')}">${b ? gName(b) : '—'}</td><td data-l="${t('a.kind')}">${t(`pk.${p.kind}`)}</td><td data-l="${t('a.method')}">${t(`pmt.${p.method}`)}</td><td class="r ${p.amount < 0 ? 'bad' : ''}" data-l="${t('a.amount')}">${money(p.amount)}</td></tr>`; }).join('') || `<tr><td colspan="6">${empty(t('a.none'))}</td></tr>`}
</tbody></table></div>`;
  },

  reviews() {
    const s = S(); const td = today();
    const toAsk = s.bookings.filter((b) => b.status === 'checked-out' && b.to >= addDays(td, -45)).sort((a, b) => b.to.localeCompare(a.to));
    return `<div class="grid2">
<section class="panel"><h2>${icon('star')}${t('a.askReviews')}</h2><p class="hint">${t('a.askHint')}</p>${toAsk.map((b) => { const asked = s.reviews.asked.includes(b.ref); const g = guestOf(b.guestId); return `<div class="li"><span class="li-m"><b>${gName(b)}</b><small>${esc(rn(b.room))} · ${t('a.left')} ${fdShort(b.to)}</small></span>${asked ? `<span class="pill st-done">${t('a.asked')}</span>` : `<a class="btn sm wa" data-ask="${b.ref}" href="${waLink(tplText('thanks', b), g?.phone || '')}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a><a class="btn sm ghost" data-ask="${b.ref}" href="mailto:${esc(g?.email || '')}?subject=${encodeURIComponent('Casa Lola')}&body=${encodeURIComponent(tplText('thanks', b))}">${icon('mail')}</a>`}</div>`; }).join('') || empty(t('a.none'))}</section>
<section class="panel"><h2>${icon('star')}${t('a.siteReviews')}</h2><form class="f" id="rvf">
  <div class="row2"><label>${t('a.gRating')}<input type="number" step="0.1" min="0" max="5" name="rating" value="${s.reviews.google.rating}" /></label><label>${t('a.gCount')}<input type="number" min="0" name="count" value="${s.reviews.google.count}" /></label></div>
  <label>${t('a.gUrl')}<input name="url" value="${esc(s.reviews.google.url)}" /></label>
  ${s.reviews.selected.map((r, i) => `<fieldset class="rvs"><legend>${t('a.review')} ${i + 1}</legend><label>${t('a.text')}<textarea name="t${i}">${esc(r.text)}</textarea></label><div class="row2"><label>${t('a.author')}<input name="a${i}" value="${esc(r.author)}" /></label><label>${t('form.country')}<input name="c${i}" value="${esc(r.country)}" /></label></div><button type="button" class="btn sm danger" data-delrv="${i}">${t('a.delete')}</button></fieldset>`).join('')}
  <button type="button" class="btn sm ghost" id="addRv">${icon('plus')}${t('a.addReview')}</button>
  <p class="hint">${t('a.noFake')}</p>
  <button class="btn pri" type="submit">${t('a.save')}</button>
</form></section></div>`;
  },

  reports() {
    const s = S(); const ym = rp.month; const st = monthStats(ym);
    return `<form class="filt" id="rpf2"><label class="fl">${t('a.month')}<input class="inp" type="month" name="month" value="${ym}" /></label></form>
<div class="kpis">${kpi(t('a.occupancy'), `${st.occ}%`, '', 'bed')}${kpi(t('a.revenue'), money(st.revenue), '', 'wallet')}${kpi(t('a.nightsSold'), st.nights, t('a.ofAvail', { n: st.avail }), 'cal')}${kpi('ADR', money(st.adr), '', 'tag')}${kpi('RevPAR', money(st.revpar), '', 'chart')}</div>
<section class="panel"><h2>${t('a.byRoom')}</h2><div class="tbl-w"><table class="tbl"><thead><tr><th>${t('room.room')}</th><th class="r">${t('a.nightsSold')}</th><th class="r">${t('a.occupancy')}</th><th class="r">${t('a.revenue')}</th></tr></thead><tbody>${s.rooms.map((r) => { const x = roomMonth(r.slug, ym); return `<tr><td>${esc(r.name)}</td><td class="r">${x.nights}</td><td class="r">${Math.round((x.nights / st.days) * 100)}%</td><td class="r">${money(x.revenue)}</td></tr>`; }).join('')}</tbody></table></div></section>
<div class="grid2">
<section class="panel"><h2>${icon('dl')}${t('a.exportBookings')}</h2><p class="hint">${t('a.exportHint')}</p><button class="btn pri" id="expB">${icon('dl')}${t('a.downloadCsv')}</button></section>
<section class="panel"><h2>${icon('lock')}${t('a.police')}</h2><p class="hint">${t('a.policeHint')}</p><form class="f" id="polf"><div class="row2"><label>${t('a.from')}<input type="date" name="from" value="${addDays(today(), -30)}" /></label><label>${t('a.to')}<input type="date" name="to" value="${today()}" /></label></div><div class="row2"><button type="button" class="btn ghost" id="polPrint">${icon('print')}${t('a.print')}</button><button type="submit" class="btn pri">${icon('dl')}CSV</button></div></form></section>
</div>`;
  },

  settings() {
    const s = S().settings; const c = s.contact;
    return `<form id="sf" class="f">
<section class="panel"><h2>${icon('home')}${t('a.property')}</h2><div class="row2">
  <label>${t('form.phone')}<input name="phone" value="${esc(c.phone)}" /></label><label>WhatsApp (${t('a.digits')})<input name="whatsapp" value="${esc(c.whatsapp)}" /></label>
  <label>${t('form.email')} 1<input name="email0" value="${esc(c.emails[0])}" /></label><label>${t('form.email')} 2<input name="email1" value="${esc(c.emails[1] || '')}" /></label>
  <label>${t('a.address')}<input name="address" value="${esc(c.address)}" /></label><label>${t('a.mapsUrl')}<input name="maps" value="${esc(c.maps)}" /></label></div>
  <fieldset class="langs"><legend>${t('a.languages')}</legend>${Object.entries(C.LANGS).map(([k, v]) => `<label class="chk"><input type="checkbox" checked disabled /> ${v}</label>`).join('')}</fieldset>
  <p class="hint">${t('a.currencyHint', { r: S().rates.eurToMad })} <a href="#rates" class="link">${t('a.rates')}</a></p>
</section>
<section class="panel"><h2>${icon('clock')}${t('a.policies')}</h2><div class="row3">
  <label>${t('a.checkInT')}<input type="time" name="checkIn" value="${s.checkIn}" /></label><label>${t('a.checkOutT')}<input type="time" name="checkOut" value="${s.checkOut}" /></label><label>${t('a.cancelDays')}<input type="number" min="0" name="cancellationDays" value="${s.cancellationDays}" /></label>
  <label>${t('a.depositPct')}<input type="number" min="0" max="100" name="depositPct" value="${s.depositPct}" /></label></div>
  <label class="chk"><input type="checkbox" name="payOnArrival" ${s.payOnArrival ? 'checked' : ''} /> ${t('a.allowArrival')}</label>
  <div class="row3">${['fr', 'en', 'es'].map((lg) => `<label>${t('house.rulesTitle')} (${lg.toUpperCase()})<textarea name="rules_${lg}">${esc(s.houseRules[lg].join('\n'))}</textarea></label>`).join('')}</div>
</section>
<section class="panel"><h2>${icon('wa')}${t('a.templates')}</h2><p class="hint">${t('a.tplHint')}</p>${Object.keys(s.templates).map((k) => `<h3 class="h4">${t(`tpl.${k}`)}</h3><div class="row3">${['fr', 'en', 'es'].map((lg) => `<label>${lg.toUpperCase()}<textarea name="tpl_${k}_${lg}">${esc(s.templates[k][lg])}</textarea></label>`).join('')}</div>`).join('')}</section>
<section class="panel"><h2>${icon('reset')}${t('a.channel')}</h2><p class="hint">${t('a.channelHint')}</p>
  <label>${t('a.icalExport')}<span class="copy"><input class="inp" readonly value="${esc(s.ical.export)}" /><button type="button" class="btn sm ghost" id="copyIcal">${t('a.copy')}</button></span></label>
  ${s.ical.imports.map((x, i) => `<label>${t('a.icalImport')} — ${esc(x.name)}<input name="ical${i}" value="${esc(x.url)}" placeholder="https://…/calendar.ics" /></label>`).join('')}
  <button type="button" class="btn sm ghost" disabled>${t('a.syncNow')}</button>
</section>
<section class="panel"><h2>${icon('users')}${t('a.users')}</h2><div class="tbl-w"><table class="tbl"><thead><tr><th>${t('a.name')}</th><th>${t('form.email')}</th><th>${t('a.role')}</th><th>${t('a.pin')}</th></tr></thead><tbody>${S().users.map((u, i) => `<tr><td><input class="inp" name="un${i}" value="${esc(u.name)}" /></td><td><input class="inp" name="ue${i}" value="${esc(u.email)}" /></td><td><select class="inp" name="ur${i}"><option value="owner" ${u.role === 'owner' ? 'selected' : ''}>${t('a.owner')}</option><option value="reception" ${u.role === 'reception' ? 'selected' : ''}>${t('a.reception')}</option></select></td><td><input class="inp" name="up${i}" value="${esc(u.pin)}" inputmode="numeric" maxlength="8" /></td></tr>`).join('')}</tbody></table></div>
  <button type="button" class="btn sm ghost" id="addU">${icon('plus')}${t('a.addUser')}</button><p class="hint">${t('a.rolesHint')}</p></section>
<div class="savebar"><button class="btn pri" type="submit">${t('a.save')}</button></div></form>`;
  },
};

/* ---------- View state ---------- */
const cal = { span: 14, start: null };
const bk = { f: { q: '', status: '', source: '', room: '', from: '', to: '', sort: 'arrival' } };
const nb = { d: null };
const resetNb = (o = {}) => { nb.d = { source: '', status: 'confirmed', room: 'dune-blanche', from: null, to: null, adults: 2, children: 0, promo: '', find: '', first: '', last: '', phone: '', email: '', country: '', arrivalTime: '', notes: '', payMode: 'arrival', paid: 0, ...o }; };
resetNb();
const gs = { f: { q: '', tag: '' } };
const TAGS = ['family', 'kiter', 'remote', 'returning', 'business', 'vip'];
const rq = { f: { type: '', status: '' } };
const msg = { thread: null };
const py = { f: { kind: '', method: '', month: '' } };
const rp = { month: today().slice(0, 7) };

/* ---------- Stats ---------- */
function monthStats(ym) {
  const s = S(); const first = `${ym}-01`; const days = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate(); const end = addDays(first, days);
  const rooms = s.rooms.filter((r) => r.active).length;
  let nights = 0; let revenue = 0;
  s.bookings.filter((b) => LIVE(b) && b.to > first && b.from < end).forEach((b) => b.quote.nights.forEach((n) => { if (n.date >= first && n.date < end) { nights++; revenue += n.price; } }));
  const avail = rooms * days;
  return { days, nights, revenue, avail, occ: Math.round((nights / avail) * 100), adr: nights ? Math.round(revenue / nights) : 0, revpar: Math.round(revenue / avail) };
}
function roomMonth(slug, ym) {
  const first = `${ym}-01`; const days = new Date(+ym.slice(0, 4), +ym.slice(5), 0).getDate(); const end = addDays(first, days);
  let nights = 0; let revenue = 0;
  S().bookings.filter((b) => b.room === slug && LIVE(b)).forEach((b) => b.quote.nights.forEach((n) => { if (n.date >= first && n.date < end) { nights++; revenue += n.price; } }));
  return { nights, revenue };
}
const hbar = (label, n, total, txt) => `<div class="hb"><span>${esc(label)}</span><i><b style="width:${Math.round((n / (total || 1)) * 100)}%"></b></i><em>${txt || `${n} · ${Math.round((n / (total || 1)) * 100)}%`}</em></div>`;
const qLines = (q) => `<dl class="bd">${q.lines.map((l) => `<div><dt>${t(l.key, { n: l.n, pct: l.pct, code: l.code })}</dt><dd>${l.key === 'q.breakfast' ? t('q.included') : money(l.amount)}</dd></div>`).join('')}<div class="tot"><dt>${t('q.total')}</dt><dd>${money(q.total)}</dd></div></dl>`;

function reqRow(r, full = false) {
  const b = r.ref ? bookingOf(r.ref) : null; const e = r.exp && C.EXPERIENCES.find((x) => x.id === r.exp);
  const what = r.type === 'experience' ? L(e)[0] : t(`rt.${r.type}`);
  const p = r.partner && S().partners.find((x) => x.id === r.partner);
  return `<button class="li req" data-req="${r.id}"><span class="li-m"><b>${esc(what)}</b><small>${b ? `${gName(b)} · ${b.ref}` : esc(r.guestName || '—')} · ${fd(r.date)} · ${t('exp.peopleN', { n: r.people })}${full && p ? ` · ${esc(p.name)}` : ''}${full && r.price ? ` · ${money(r.price)}` : ''}</small></span><span class="pill st-${r.status}">${t(`rs.${r.status}`)}</span></button>`;
}

/* ---------- Booking detail ---------- */
function openBooking(ref) {
  const b = bookingOf(ref); if (!b) return;
  const g = guestOf(b.guestId); const s = S(); const paid = paidFor(ref); const r = roomOf(b.room);
  const pays = s.payments.filter((p) => p.ref === ref);
  const reqs = s.requests.filter((x) => x.ref === ref);
  const pa = b.prearrival;
  const acts = [];
  if (b.status === 'pending') acts.push(`<button class="btn sm pri" data-st="confirmed">${t('a.confirm')}</button>`);
  if (['confirmed', 'pending'].includes(b.status) && b.from <= today()) acts.push(`<button class="btn sm pri" data-st="checked-in">${t('a.checkIn')}</button>`);
  if (b.status === 'checked-in') acts.push(`<button class="btn sm dark" data-st="checked-out">${t('a.checkOut')}</button>`);
  if (b.status === 'confirmed' && b.from < today()) acts.push(`<button class="btn sm ghost" data-st="no-show">${t('a.noShow')}</button>`);
  if (LIVE(b) && b.status !== 'checked-out') acts.push(`<button class="btn sm ghost" data-mod>${icon('edit')}${t('a.modify')}</button>`);
  if (['pending', 'confirmed'].includes(b.status)) acts.push(`<button class="btn sm danger" data-cancel>${t('a.cancel')}</button>`);
  const m = modal(`${dlgHead(`<code>${b.ref}</code> ${statusPill(b.status)}`)}<div class="dlg-b bdet">
  ${b.modifyRequest?.status === 'pending' ? `<div class="banner">${icon('cal')}<span>${t('a.modReq', { from: fd(b.modifyRequest.from), to: fd(b.modifyRequest.to) })}</span><button class="btn sm pri" data-modok>${t('a.approve')}</button><button class="btn sm ghost" data-modno>${t('a.decline')}</button></div>` : ''}
  <div class="acts">${acts.join('')}</div>
  <div class="bgrid">
    <section><h3>${t('a.guest')}</h3><p><b>${esc(guestName(g))}</b> ${g?.tags.map((x) => `<span class="pill">${t(`tag.${x}`)}</span>`).join(' ') || ''}</p><p>${icon('mail')}<a href="mailto:${esc(g?.email)}">${esc(g?.email)}</a></p><p>${icon('phone')}${esc(g?.phone || '—')}</p><p>${icon('globe')}${g?.country ? esc(countryName(g.country)) : '—'} · ${(g?.lang || '').toUpperCase()}</p>${g?.notes ? `<p class="note">${esc(g.notes)}</p>` : ''}<button class="link" data-guest="${g?.id}">${t('a.guestFile')}</button></section>
    <section><h3>${t('a.stay')}</h3><p><b>${esc(r?.name)}</b></p><p>${fdShort(b.from)} → ${fdShort(b.to)} · ${nightsLabel(diffDays(b.from, b.to))}</p><p>${partyLabel(b.adults, b.children, b.infants)}${b.childAges?.length ? ` (${b.childAges.join(', ')})` : ''}</p><p>${t('a.source')}: <b>${srcLabel(b.source)}</b> · ${t(`pm.${b.payMode}`)}</p><p>${t('form.arrival')}: ${esc(pa?.arrivalTime || b.arrivalTime || '—')}${pa?.flight ? ` · ✈ ${esc(pa.flight)}` : ''}</p>${b.notes ? `<p class="note">${esc(b.notes)}</p>` : ''}${b.extras.occasion ? `<p class="note">${esc(b.extras.occasion)}</p>` : ''}</section>
    ${isOwner() ? `<section><h3>${t('a.price')}</h3>${qLines(b.quote)}<p class="bal">${t('conf.paid')}: <b>${money(paid)}</b> · ${t('conf.balance')}: <b class="${bal(b) > 0 ? 'bad' : ''}">${money(bal(b))}</b></p></section>
    <section><h3>${t('a.payments')}</h3>${pays.map((p) => `<p class="pay-l"><span>${ftime(p.at)} · ${t(`pk.${p.kind}`)} · ${t(`pmt.${p.method}`)}</span><b class="${p.amount < 0 ? 'bad' : ''}">${money(p.amount)}</b></p>`).join('') || `<p class="mut">${t('a.noPay')}</p>`}
      ${LIVE(b) ? `<form class="payf" id="payf"><input class="inp" type="number" step="0.01" name="amount" value="${Math.max(0, bal(b))}" aria-label="${t('a.amount')}" /><select class="inp" name="method" aria-label="${t('a.method')}">${['cash', 'card', 'transfer', 'ota'].map((x) => `<option value="${x}">${t(`pmt.${x}`)}</option>`).join('')}</select><select class="inp" name="kind" aria-label="${t('a.kind')}">${['balance', 'deposit', 'refund'].map((x) => `<option value="${x}">${t(`pk.${x}`)}</option>`).join('')}</select><button class="btn sm pri">${t('a.record')}</button></form>` : ''}</section>` : ''}
    <section><h3>${t('a.prearrival')}</h3>${pa ? `<p>${t('gp.nationality')}: ${esc(pa.nationality || '—')}</p><p>${t(`gp.id_${pa.idType || 'passport'}`)}: ${esc(pa.idNumber || '—')}</p><p>${t('gp.birth')}: ${pa.birthDate ? fd(pa.birthDate) : '—'}</p>${pa.dietary ? `<p class="note">${t('gp.dietary')}: ${esc(pa.dietary)}</p>` : ''}${pa.requests ? `<p class="note">${esc(pa.requests)}</p>` : ''}` : `<p class="mut">${t('a.notFilled')}</p>`}</section>
    <section><h3>${t('a.requests')}</h3>${reqs.map((x) => reqRow(x, true)).join('') || `<p class="mut">${t('a.none')}</p>`}</section>
    <section><h3>${t('a.whatsapp')}</h3><div class="tpl">${Object.keys(s.settings.templates).map((k) => `<a class="btn sm wa" href="${waLink(tplText(k, b), g?.phone || '')}" target="_blank" rel="noopener">${icon('wa')}${t(`tpl.${k}`)}</a>`).join('')}</div></section>
    <section class="full"><h3>${t('a.history')}</h3><ol class="log">${[...b.log].reverse().map((l) => `<li><span>${ftime(l.at)} · ${esc(l.by)}</span>${esc(l.text)}</li>`).join('')}</ol></section>
  </div></div>
  <div class="dlg-f">${isOwner() || true ? `<button class="btn ghost" data-inv>${icon('print')}${t('a.invoice')}</button>` : ''}<button class="btn pri" data-close>${t('close')}</button></div>`, { wide: true });
  const el = m.el;
  $$('[data-st]', el).forEach((x) => x.addEventListener('click', () => { setStatus(ref, x.dataset.st, by()); m.close(); toast(t('a.updated')); openBooking(ref); }));
  $('[data-cancel]', el)?.addEventListener('click', () => {
    const refund = refundIfCancelled(b);
    const cm = modal(`${dlgHead(t('a.cancel'))}<form class="dlg-b f" id="cxf"><p>${t('a.cancelPolicy', { d: s.settings.cancellationDays, days: diffDays(today(), b.from) })}</p>${isOwner() ? `<label>${t('a.refund')}<input type="number" name="refund" min="0" step="0.01" value="${refund}" /></label>` : `<p>${t('a.refund')}: <b>${money(refund)}</b></p>`}<button class="btn danger">${t('a.confirmCancel')}</button></form>`);
    $('#cxf', cm.el).addEventListener('submit', (e) => { e.preventDefault(); const v = isOwner() ? +e.target.refund.value : refund; cancelBooking(ref, by(), v); cm.close(); m.close(); toast(t('a.cancelled', { r: money(v) })); });
  });
  $('[data-mod]', el)?.addEventListener('click', () => { m.close(); modifyDialog(ref); });
  $('[data-modok]', el)?.addEventListener('click', () => { const res = modifyBooking(ref, { from: b.modifyRequest.from, to: b.modifyRequest.to }, by()); if (!res.ok) { toast(t(res.error, { n: minStayFor(b.modifyRequest.from || today()) }), 'bad'); return; } m.close(); toast(t('a.updated')); openBooking(ref); });
  $('[data-modno]', el)?.addEventListener('click', () => { db.update((st) => { const x = bookingOf(ref, st); x.modifyRequest.status = 'declined'; logTo(x, by(), 'Date change declined'); }); m.close(); openBooking(ref); });
  $('#payf', el)?.addEventListener('submit', (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); let a = +d.amount; if (!a) return; if (d.kind === 'refund') a = -Math.abs(a); addPayment(ref, a, d.method, d.kind, '', by()); m.close(); toast(t('a.payRecorded')); openBooking(ref); });
  $('[data-inv]', el).addEventListener('click', () => invoice(ref));
  $$('[data-guest]', el).forEach((x) => x.addEventListener('click', () => { m.close(); openGuest(x.dataset.guest); }));
  $$('[data-req]', el).forEach((x) => x.addEventListener('click', () => { m.close(); openReq(x.dataset.req); }));
}

function modifyDialog(ref) {
  const b = bookingOf(ref); const d = { room: b.room, from: b.from, to: b.to, adults: b.adults, children: b.children };
  const m = modal(`${dlgHead(`${t('a.modify')} · ${b.ref}`)}<div class="dlg-b f" id="mdb"></div><div class="dlg-f"><button class="btn ghost" data-close>${t('close')}</button><button class="btn pri" id="mdOk">${t('a.saveChanges')}</button></div>`);
  const draw = () => {
    const err = checkStay(d, ref); const q = !err || err === 'err.taken' ? quote({ ...d, promo: b.promo, transfer: b.extras.transfer, lateCheckout: b.extras.lateCheckout }) : null;
    $('#mdb', m.el).innerHTML = `<label>${t('room.room')}<select name="room">${S().rooms.filter((r) => r.active).map((r) => `<option value="${r.slug}" ${d.room === r.slug ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
<label>${t('a.dates')}<button type="button" class="inp dbtn" id="mdD">${icon('cal')}${fd(d.from)} → ${fd(d.to)} · ${nightsLabel(diffDays(d.from, d.to))}</button></label>
<div class="row2"><label>${t('party.adultsL')}<input type="number" name="adults" min="1" max="3" value="${d.adults}" /></label><label>${t('party.childrenL')}<input type="number" name="children" min="0" max="2" value="${d.children}" /></label></div>
${q && isOwner() ? `<div class="bb">${qLines(q)}<p class="hint">${t('a.was', { p: money(b.total) })}</p></div>` : ''}${err ? `<p class="err">${t(err, { n: minStayFor(d.from || today()) })}</p>` : `<p class="ok-box">${t('a.available')}</p>`}`;
    $('#mdOk', m.el).disabled = !!err;
    $('#mdD', m.el).addEventListener('click', () => rangePicker({ from: d.from, to: d.to, minDate: addDays(today(), -60), busy: busyNights(d.room, ref), onApply: (a, z) => { d.from = a; d.to = z; draw(); } }));
  };
  $('#mdb', m.el).addEventListener('change', (e) => { const n = e.target.name; if (!n) return; d[n] = n === 'room' ? e.target.value : +e.target.value; draw(); });
  $('#mdOk', m.el).addEventListener('click', () => { const r = modifyBooking(ref, d, by()); if (!r.ok) { toast(t(r.error, { n: minStayFor(d.from || today()) }), 'bad'); return; } m.close(); toast(t('a.updated')); openBooking(ref); });
  draw();
}

function invoice(ref) {
  const b = bookingOf(ref); const g = guestOf(b.guestId); const s = S(); const c = s.settings.contact; const pays = s.payments.filter((p) => p.ref === ref);
  const m = modal(`${dlgHead(t('a.invoice'))}<div class="dlg-b"><div class="print-area inv">
  <div class="inv-h"><div><b class="serif">${esc(C.BRAND.name)}</b><p>${esc(c.address)}<br>${esc(c.phone)} · ${esc(c.emails[0])}</p></div><div class="r"><h2>${t('a.invoice')}</h2><p>N° ${b.ref.replace('CL', 'F')}<br>${fd(today())}</p></div></div>
  <p><b>${t('a.billedTo')}</b><br>${esc(guestName(g))}<br>${esc(g?.email || '')}<br>${esc(g?.phone || '')}</p>
  <p>${esc(rn(b.room))} · ${fd(b.from)} → ${fd(b.to)} · ${nightsLabel(diffDays(b.from, b.to))} · ${partyLabel(b.adults, b.children)}</p>
  ${qLines(b.quote)}
  <table class="tbl"><tbody>${pays.map((p) => `<tr><td>${fd(p.at.slice(0, 10))} · ${t(`pk.${p.kind}`)} (${t(`pmt.${p.method}`)})</td><td class="r">${money(p.amount)}</td></tr>`).join('')}<tr><td><b>${t('conf.balance')}</b></td><td class="r"><b>${money(bal(b))}</b></td></tr></tbody></table>
  <p class="hint">${t('a.invNote')}</p></div></div><div class="dlg-f no-print"><button class="btn pri" id="prt">${icon('print')}${t('a.print')}</button></div>`, { wide: true, cls: 'printable' });
  $('#prt', m.el).addEventListener('click', () => window.print());
}

function openGuest(id) {
  const g = guestOf(id); if (!g) return; const bs = S().bookings.filter((b) => b.guestId === id).sort((a, b) => b.from.localeCompare(a.from));
  const m = modal(`${dlgHead(esc(guestName(g)))}<form class="dlg-b f" id="gdf">
  <div class="row2"><label>${t('form.first')}<input name="first" value="${esc(g.first)}" /></label><label>${t('form.last')}<input name="last" value="${esc(g.last)}" /></label></div>
  <div class="row2"><label>${t('form.email')}<input name="email" value="${esc(g.email)}" /></label><label>${t('form.phone')}<input name="phone" value="${esc(g.phone || '')}" /></label></div>
  <div class="row2"><label>${t('form.country')}<input name="country" value="${esc(g.country || '')}" maxlength="2" /></label><label>${t('lang')}<select name="lang">${Object.keys(C.LANGS).map((k) => `<option value="${k}" ${g.lang === k ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('')}</select></label></div>
  <fieldset class="tags"><legend>${t('a.tags')}</legend>${TAGS.map((x) => `<label class="chk"><input type="checkbox" name="tag" value="${x}" ${g.tags.includes(x) ? 'checked' : ''} />${t(`tag.${x}`)}</label>`).join('')}</fieldset>
  <label class="chk"><input type="checkbox" name="marketing" ${g.marketing ? 'checked' : ''} />${t('a.marketingConsent')}</label>
  <label>${t('a.notes')}<textarea name="notes">${esc(g.notes)}</textarea></label>
  <h3 class="h4">${t('a.stayHistory')}</h3>${bs.map((b) => bookRow(b)).join('') || `<p class="mut">${t('a.none')}</p>`}
  <button class="btn pri">${t('a.save')}</button></form>`, { wide: true });
  $$('[data-open]', m.el).forEach((x) => x.addEventListener('click', (e) => { e.preventDefault(); m.close(); openBooking(x.dataset.open); }));
  $('#gdf', m.el).addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target;
    db.update((st) => { const x = guestOf(id, st); Object.assign(x, { first: f.first.value, last: f.last.value, email: f.email.value.trim().toLowerCase(), phone: f.phone.value, country: f.country.value.toUpperCase(), lang: f.lang.value, tags: $$('input[name=tag]:checked', f).map((c) => c.value), marketing: f.marketing.checked, notes: f.notes.value }); });
    m.close(); toast(t('a.saved'));
  });
}

function openReq(id) {
  const r = S().requests.find((x) => x.id === id); if (!r) return; const b = r.ref && bookingOf(r.ref);
  const e = r.exp && C.EXPERIENCES.find((x) => x.id === r.exp);
  const m = modal(`${dlgHead(esc(r.type === 'experience' ? L(e)[0] : t(`rt.${r.type}`)))}<form class="dlg-b f" id="rqf">
  <p>${b ? `${gName(b)} · <button type="button" class="link" data-open="${b.ref}">${b.ref}</button>` : `${esc(r.guestName || '—')} · ${esc(r.contact || '')}`}</p>
  <p>${fd(r.date)} · ${t('exp.peopleN', { n: r.people })}${r.notes ? ` · “${esc(r.notes)}”` : ''}</p>
  <div class="row2"><label>${t('a.status')}<select name="status">${['new', 'arranged', 'done', 'declined'].map((x) => `<option value="${x}" ${r.status === x ? 'selected' : ''}>${t(`rs.${x}`)}</option>`).join('')}</select></label>
  <label>${t('a.partner')}<select name="partner"><option value="">—</option>${S().partners.map((p) => `<option value="${p.id}" ${r.partner === p.id ? 'selected' : ''}>${esc(p.name)} · ${p.activity}</option>`).join('')}</select></label></div>
  <div class="row2"><label>${t('a.priceAgreed')} (€)<input type="number" min="0" step="1" name="price" value="${r.price ?? ''}" /></label><label>${t('a.date')}<input type="date" name="date" value="${r.date}" /></label></div>
  <label>${t('a.noteGuest')}<textarea name="reply">${esc(r.reply || '')}</textarea></label>
  <button class="btn pri">${t('a.save')}</button></form>`);
  $('[data-open]', m.el)?.addEventListener('click', (ev) => { m.close(); openBooking(ev.target.dataset.open); });
  $('#rqf', m.el).addEventListener('submit', (ev) => {
    ev.preventDefault(); const f = ev.target;
    db.update((st) => { const x = st.requests.find((y) => y.id === id); Object.assign(x, { status: f.status.value, partner: f.partner.value || null, price: f.price.value ? +f.price.value : null, date: f.date.value, reply: f.reply.value }); });
    m.close(); toast(t('a.saved'));
  });
}

function editRoom(slug) {
  const r = roomOf(slug);
  const m = modal(`${dlgHead(`${t('a.edit')} · ${esc(r.name)}`)}<form class="dlg-b f" id="ref">
  <div class="row2"><label>${t('a.name')}<input name="name" value="${esc(r.name)}" /></label><label class="chk"><input type="checkbox" name="active" ${r.active ? 'checked' : ''} />${t('a.activeOnline')}</label></div>
  ${['fr', 'en', 'es'].map((lg) => `<label>${t('a.description')} (${lg.toUpperCase()})<textarea name="desc_${lg}">${esc(r.desc[lg])}</textarea></label>`).join('')}
  <div class="row3"><label>${t('room.size')} (m²)<input type="number" name="size" value="${r.size ?? ''}" placeholder="TBC" /></label>
  <label>${t('room.beds')}<select name="beds"><option value="">TBC</option>${Object.keys(C.BED_LABEL).map((k) => `<option value="${k}" ${r.beds === k ? 'selected' : ''}>${esc(L(C.BED_LABEL[k]))}</option>`).join('')}</select></label>
  <label>${t('room.capacity')}<input type="number" name="capacity" min="1" max="4" value="${r.capacity}" /></label>
  <label>${t('rooms.view')}<select name="view">${['sea', 'garden', 'city'].map((v) => `<option value="${v}" ${r.view === v ? 'selected' : ''}>${t(`view.${v}`)}</option>`).join('')}</select></label>
  ${isOwner() ? `<label>${t('a.basePrice')} (€)<input type="number" name="price" min="0" value="${r.price}" /></label><label>${t('a.singlePrice')} (€)<input type="number" name="single" min="0" value="${r.single}" /></label>` : ''}</div>
  <fieldset class="tags"><legend>${t('room.amenities')}</legend>${Object.keys(C.AMENITIES).map((k) => `<label class="chk"><input type="checkbox" name="am" value="${k}" ${r.amenities.includes(k) ? 'checked' : ''} />${esc(L(C.AMENITIES[k]))}</label>`).join('')}</fieldset>
  <h3 class="h4">${t('a.photos')}</h3><div class="slots">${[1, 2, 3, 4, 5].map((n) => img(`rooms/${r.slug}-${n}.jpg`, { ratio: '3/2', alt: `${r.name} ${n}` })).join('')}</div><p class="hint">${t('a.photosHint')}</p>
  <button class="btn pri">${t('a.save')}</button></form>`, { wide: true });
  $('#ref', m.el).addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target;
    db.update((st) => {
      const x = roomOf(slug, st);
      Object.assign(x, { name: f.name.value.trim() || x.name, active: f.active.checked, desc: { fr: f.desc_fr.value, en: f.desc_en.value, es: f.desc_es.value }, size: f.size.value ? +f.size.value : null, beds: f.beds.value || null, capacity: +f.capacity.value, maxAdults: Math.min(+f.capacity.value, x.maxAdults || +f.capacity.value), view: f.view.value, amenities: $$('input[name=am]:checked', f).map((c) => c.value) });
      if (f.price) { x.price = +f.price.value; x.single = +f.single.value; }
    });
    m.close(); toast(t('a.saved'));
  });
}

/* ---------- Bindings per view ---------- */
const openers = (c) => {
  c.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openBooking(o.dataset.open); return; }
    const q = e.target.closest('[data-req]'); if (q) { openReq(q.dataset.req); return; }
    const a = e.target.closest('[data-act]'); if (a) { setStatus(a.dataset.ref, a.dataset.act, by()); toast(t('a.updated')); }
  });
  c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const o = e.target.closest('tr[data-open]'); if (o) openBooking(o.dataset.open); const g = e.target.closest('tr[data-guest]'); if (g) openGuest(g.dataset.guest); } });
};
const filterForm = (c, sel, state) => { const f = $(sel, c); f?.addEventListener('input', (e) => { state[e.target.name] = e.target.value; const pos = e.target.selectionStart; const nm = e.target.name; render(); const el = $(`${sel} [name="${nm}"]`); if (el) { el.focus(); try { el.setSelectionRange?.(pos, pos); } catch { /* not text */ } } }); };

const BINDS = {
  today: openers, kpis: openers, payments: (c) => { openers(c); filterForm(c, '#pyf', py.f); },
  calendar(c) {
    openers(c);
    $$('[data-span]', c).forEach((b) => b.addEventListener('click', () => { cal.span = +b.dataset.span; render(); }));
    $$('[data-shift]', c).forEach((b) => b.addEventListener('click', () => { const n = +b.dataset.shift; cal.start = n ? addDays(cal.start, n) : addDays(today(), -2); render(); }));
    $$('[data-new]', c).forEach((b) => b.addEventListener('click', () => { const [room, d] = b.dataset.new.split('|'); resetNb({ room, from: d, to: addDays(d, 2) }); location.hash = '#new'; }));
  },
  bookings(c) { openers(c); filterForm(c, '#bf', bk.f); },
  new(c) {
    const f = $('#nf', c); const n = nb.d;
    $('#nDates', c).addEventListener('click', () => rangePicker({ from: n.from, to: n.to, busy: busyNights(n.room), onApply: (a, z) => { n.from = a; n.to = z; render(); } }));
    f.addEventListener('change', (e) => {
      const k = e.target.name; if (!k) return;
      n[k] = ['adults', 'children', 'paid'].includes(k) ? +e.target.value : e.target.value;
      if (k === 'find') { const g = S().guests.find((x) => x.email === e.target.value.trim().toLowerCase()); if (g) Object.assign(n, { first: g.first, last: g.last, phone: g.phone, email: g.email, country: g.country }); }
      if (['room', 'adults', 'children', 'promo', 'find', 'payMode'].includes(k)) render();
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault(); Object.assign(n, Object.fromEntries([...new FormData(f)].filter(([k]) => !['adults', 'children', 'paid'].includes(k))));
      if (!n.source || !n.first || !n.last || !n.phone) { toast(t('err.form'), 'bad'); return; }
      const res = createBooking({ room: n.room, from: n.from, to: n.to, adults: +n.adults, children: +n.children, promo: n.promo, source: n.source, status: n.status, payMode: n.payMode, payNow: isOwner() ? +n.paid || 0 : 0, arrivalTime: n.arrivalTime, notes: n.notes, guest: { first: n.first, last: n.last, email: n.email || `${n.phone.replace(/\D/g, '')}@whatsapp.local`, phone: n.phone, country: (n.country || '').toUpperCase(), lang: lang() }, by: by() });
      if (!res.ok) { toast(t(res.error, { n: minStayFor(n.from || today()) }), 'bad'); return; }
      toast(t('a.createdRef', { ref: res.booking.ref })); resetNb(); location.hash = '#bookings'; setTimeout(() => openBooking(res.booking.ref), 50);
    });
  },
  rooms(c) { $$('[data-room]', c).forEach((b) => b.addEventListener('click', () => editRoom(b.dataset.room))); },
  rates(c) {
    const f = $('#rf', c);
    $('#addPromo', c).addEventListener('click', () => db.update((s) => { s.rates.promoCodes.push({ code: 'NEW10', pct: 10, from: null, to: null, maxUses: 20, uses: 0 }); }));
    $$('[data-delpromo]', c).forEach((b) => b.addEventListener('click', () => db.update((s) => { s.rates.promoCodes.splice(+b.dataset.delpromo, 1); })));
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const v = (n) => f.elements[n]?.value;
      let bad = false;
      db.update((s) => {
        const R = s.rates;
        R.seasons.forEach((x, i) => {
          x.name[lang()] = v(`sn${i}`) || x.name[lang()]; x.mult = +v(`sm${i}`) || 1; x.minStay = +v(`ss${i}`) || 1;
          if (i < R.seasons.length - 1) { const rg = (v(`sr${i}`) || '').split(';').map((p) => p.trim().split(/→|->|-(?=\d\d-)/).map((y) => y.trim())).filter((p) => p.length === 2 && p.every((y) => /^\d\d-\d\d$/.test(y))); if (rg.length) x.ranges = rg; else bad = true; }
        });
        R.longStay = { nights: +v('lsn'), pct: +v('lsp') }; R.touristTax = +v('tax'); R.childPerNight = +v('child'); R.extraAdultPerNight = +v('xad'); R.eurToMad = +v('mad'); R.extras.transfer.price = +v('trf'); R.extras.lateCheckout.price = +v('late');
        R.promoCodes.forEach((p, i) => { p.code = (v(`pc${i}`) || p.code).toUpperCase().replace(/\s/g, ''); p.pct = +v(`pp${i}`); p.from = v(`pf${i}`) || null; p.to = v(`pt${i}`) || null; p.maxUses = +v(`pm${i}`) || null; });
      });
      toast(bad ? t('a.rangesBad') : t('a.saved'), bad ? 'bad' : '');
    });
  },
  closures(c) {
    $('#cf', c).addEventListener('submit', (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const er = $('.err', e.target);
      if (d.to < d.from) { er.textContent = t('err.dates'); er.hidden = false; return; }
      const clash = S().bookings.filter((b) => LIVE(b) && (d.room === 'all' || b.room === d.room) && b.from <= d.to && b.to > d.from);
      if (clash.length && !confirm(t('a.closureClash', { n: clash.length, refs: clash.map((b) => b.ref).join(', ') }))) return;
      db.update((s) => { s.closures.push({ id: `c${Date.now()}`, ...d }); }); toast(t('a.saved'));
    });
    $$('[data-delc]', c).forEach((b) => b.addEventListener('click', () => db.update((s) => { s.closures = s.closures.filter((x) => x.id !== b.dataset.delc); })));
  },
  guests(c) {
    filterForm(c, '#gf', gs.f);
    c.addEventListener('click', (e) => { const r = e.target.closest('[data-guest]'); if (r) openGuest(r.dataset.guest); });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const r = e.target.closest('[data-guest]'); if (r) openGuest(r.dataset.guest); } });
    $('#gcsv', c).addEventListener('click', () => download('casa-lola-guests.csv', csv([['first', 'last', 'email', 'phone', 'country', 'lang', 'tags', 'marketing'], ...S().guests.map((g) => [g.first, g.last, g.email, g.phone, g.country, g.lang, g.tags.join('|'), g.marketing ? 'yes' : 'no'])]), 'text/csv'));
  },
  requests(c) { openers(c); filterForm(c, '#qf', rq.f); },
  partners(c) {
    c.addEventListener('change', (e) => { const p = e.target.dataset.pp; if (!p) return; const [i, k] = p.split('|'); db.update((s) => { s.partners[+i][k] = k === 'commission' ? +e.target.value : e.target.value; }); toast(t('a.saved')); });
    $('#addP', c).addEventListener('click', () => db.update((s) => { s.partners.push({ id: `p${Date.now()}`, name: 'Partner name (TBC)', activity: 'watersports', phone: '', commission: 10 }); }));
    $$('[data-delp]', c).forEach((b) => b.addEventListener('click', () => db.update((s) => { s.partners.splice(+b.dataset.delp, 1); })));
  },
  messages(c) {
    openers(c);
    if (msg.thread) { const unread = S().messages.some((m) => m.thread === msg.thread && !m.read && m.from === 'guest'); if (unread) setTimeout(() => db.update((s) => s.messages.forEach((m) => { if (m.thread === msg.thread) m.read = true; })), 400); }
    $$('[data-th]', c).forEach((b) => b.addEventListener('click', () => { msg.thread = b.dataset.th; render(); }));
    $('#rpf', c)?.addEventListener('submit', (e) => { e.preventDefault(); const text = e.target.text.value.trim(); if (!text) return; db.update((s) => { s.messages.push({ id: `m${Date.now()}`, thread: msg.thread, from: 'house', name: user.name, text, at: new Date().toISOString(), read: true }); }); toast(msg.thread.startsWith('contact-') ? t('a.sentEmail') : t('a.sentPortal')); });
  },
  housekeeping(c) { $$('[data-hk]', c).forEach((b) => b.addEventListener('click', () => { const [slug, st] = b.dataset.hk.split('|'); db.update((s) => { s.housekeeping[slug] = st; }); })); },
  reviews(c) {
    $$('[data-ask]', c).forEach((a) => a.addEventListener('click', () => setTimeout(() => db.update((s) => { if (!s.reviews.asked.includes(a.dataset.ask)) s.reviews.asked.push(a.dataset.ask); }), 300)));
    const f = $('#rvf', c);
    $('#addRv', c).addEventListener('click', () => db.update((s) => { s.reviews.selected.push({ text: 'Review text to be provided by the owner', author: 'Guest name', country: '' }); }));
    $$('[data-delrv]', c).forEach((b) => b.addEventListener('click', () => db.update((s) => { s.reviews.selected.splice(+b.dataset.delrv, 1); })));
    f.addEventListener('submit', (e) => { e.preventDefault(); db.update((s) => { s.reviews.google = { ...s.reviews.google, rating: +f.rating.value, count: +f.count.value, url: f.url.value }; s.reviews.selected.forEach((r, i) => { r.text = f[`t${i}`].value; r.author = f[`a${i}`].value; r.country = f[`c${i}`].value; }); }); toast(t('a.saved')); });
  },
  reports(c) {
    $('#rpf2', c).addEventListener('change', (e) => { rp.month = e.target.value || rp.month; render(); });
    $('#expB', c).addEventListener('click', () => download(`casa-lola-bookings-${today()}.csv`, csv([['ref', 'status', 'source', 'room', 'arrival', 'departure', 'nights', 'adults', 'children', 'guest', 'email', 'phone', 'country', 'total_eur', 'paid_eur', 'balance_eur', 'created'], ...S().bookings.map((b) => { const g = guestOf(b.guestId); return [b.ref, b.status, b.source, rn(b.room), b.from, b.to, diffDays(b.from, b.to), b.adults, b.children, guestName(g), g?.email, g?.phone, g?.country, b.total, paidFor(b.ref), bal(b), b.createdAt.slice(0, 10)]; })]), 'text/csv'));
    const rows = () => { const f = $('#polf', c); const a = f.from.value; const z = f.to.value; return S().bookings.filter((b) => ['checked-in', 'checked-out'].includes(b.status) && b.from <= z && b.to >= a).sort((x, y) => x.from.localeCompare(y.from)); };
    $('#polf', c).addEventListener('submit', (e) => { e.preventDefault(); download(`fiche-de-police-${today()}.csv`, csv([['ref', 'nom', 'prenom', 'nationalite', 'type_piece', 'numero_piece', 'date_naissance', 'arrivee', 'depart', 'chambre', 'adultes', 'enfants'], ...rows().map((b) => { const g = guestOf(b.guestId); const p = b.prearrival || {}; return [b.ref, g?.last, g?.first, p.nationality || '', p.idType || '', p.idNumber || '', p.birthDate || '', b.from, b.to, rn(b.room), b.adults, b.children]; })]), 'text/csv'); });
    $('#polPrint', c).addEventListener('click', () => {
      const m = modal(`${dlgHead(t('a.police'))}<div class="dlg-b"><div class="print-area"><h2 class="serif">${esc(C.BRAND.name)} — ${t('a.police')}</h2><p>${esc(S().settings.contact.address)}</p><div class="tbl-w"><table class="tbl"><thead><tr><th>${t('a.ref')}</th><th>${t('a.guest')}</th><th>${t('gp.nationality')}</th><th>${t('gp.idNumber')}</th><th>${t('gp.birth')}</th><th>${t('a.dates')}</th><th>${t('room.room')}</th></tr></thead><tbody>${rows().map((b) => { const g = guestOf(b.guestId); const p = b.prearrival || {}; return `<tr><td>${b.ref}</td><td>${esc(guestName(g))}</td><td>${esc(p.nationality || '—')}</td><td>${esc(p.idNumber || '—')}</td><td>${p.birthDate ? fd(p.birthDate) : '—'}</td><td>${fd(b.from)} → ${fd(b.to)}</td><td>${esc(rn(b.room))}</td></tr>`; }).join('')}</tbody></table></div></div></div><div class="dlg-f no-print"><button class="btn pri" id="prt2">${icon('print')}${t('a.print')}</button></div>`, { wide: true, cls: 'printable' });
      $('#prt2', m.el).addEventListener('click', () => window.print());
    });
  },
  settings(c) {
    const f = $('#sf', c);
    $('#copyIcal', c).addEventListener('click', () => { navigator.clipboard?.writeText(S().settings.ical.export).then(() => toast(t('a.copied')), () => {}); });
    $('#addU', c).addEventListener('click', () => db.update((s) => { s.users.push({ email: `staff${s.users.length}@demo`, pin: '0000', name: 'Staff', role: 'reception' }); }));
    f.addEventListener('submit', (e) => {
      e.preventDefault(); const v = (n) => f.elements[n]?.value ?? '';
      db.update((s) => {
        const st = s.settings;
        Object.assign(st.contact, { phone: v('phone'), whatsapp: v('whatsapp').replace(/\D/g, ''), emails: [v('email0'), v('email1')].filter(Boolean), address: v('address'), maps: v('maps') });
        Object.assign(st, { checkIn: v('checkIn'), checkOut: v('checkOut'), cancellationDays: +v('cancellationDays'), depositPct: +v('depositPct'), payOnArrival: f.payOnArrival.checked });
        ['fr', 'en', 'es'].forEach((lg) => { st.houseRules[lg] = v(`rules_${lg}`).split('\n').map((x) => x.trim()).filter(Boolean); });
        Object.keys(st.templates).forEach((k) => ['fr', 'en', 'es'].forEach((lg) => { st.templates[k][lg] = v(`tpl_${k}_${lg}`); }));
        st.ical.imports.forEach((x, i) => { x.url = v(`ical${i}`); });
        s.users.forEach((u, i) => { u.name = v(`un${i}`); u.email = v(`ue${i}`).trim().toLowerCase(); u.role = v(`ur${i}`); u.pin = v(`up${i}`).trim(); });
        if (!s.users.some((u) => u.role === 'owner')) s.users[0].role = 'owner';
      });
      toast(t('a.saved'));
    });
  },
};

/* ---------- Start ---------- */
if (previewOn()) document.documentElement.classList.add('preview');
// Live mode when the API answers: the dashboard shows the real shared data, saved on the server.
const localUser = user;
user = null; // nothing renders on the public slice while the session is being checked
if (!(await remote.bootPublic())) user = localUser;
else {
  user = await remote.staffResume();
  ses.set(user);
  if (user) remote.watchStaff();
  remote.onAuthLost(() => { user = null; ses.set(null); toast(t('err.session'), 'bad'); login(); });
  remote.onSyncError((err) => toast(t(err === 'err.taken' ? 'a.syncTaken' : err), 'bad'));
}
user ? shell() : login();
