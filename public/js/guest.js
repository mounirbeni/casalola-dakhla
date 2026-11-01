/* Casa Lola — guest portal: booking, pre-arrival form, requests, change/cancel, messages, documents. */
import * as C from './config.js';
import * as remote from './remote.js';
import { db, room as roomOf, guest as guestOf, booking as bookingOf, guestName, paidFor, today, addDays, diffDays, quote, checkStay, busyNights, findBooking, refundIfCancelled, minStayFor, cancelBooking, addRequest, addMessage, logTo, hashPw } from './store.js';
import { t, L, esc, lang, setLang, money, fd, fdLong, ftime, icon, img, toast, modal, dlgHead, download, icsFor, rangePicker, waLink, $, $$, statusPill, nightsLabel, partyLabel, previewOn } from './ui.js';

const KEY = 'cl-guest';
const ses = { get: () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } }, set: (v) => { try { v ? sessionStorage.setItem(KEY, JSON.stringify(v)) : sessionStorage.removeItem(KEY); } catch { /* private */ } } };
let me = ses.get(); // { ref } or { guestId, ref }
let tab = 'stay';
const root = $('#guest');
const S = () => db.s;
if (previewOn()) document.documentElement.classList.add('preview');

const top = () => `<header class="g-top"><a class="brand" href="index.html#/">${img(C.BRAND.logo, { ratio: '1/1', alt: C.BRAND.name, cls: 'logo' })}<span><b>Casa Lola</b><small>${t('gp.title')}</small></span></a>
<div class="g-r"><label class="sel"><span class="sr">${t('lang')}</span>${icon('globe')}<select id="gl">${Object.keys(C.LANGS).map((k) => `<option value="${k}" ${k === lang() ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('')}</select></label>${me ? `<button class="btn ghost sm" id="gout">${icon('logout')}<span>${t('a.logout')}</span></button>` : ''}</div></header>`;
function bindTop() {
  $('#gl').addEventListener('change', (e) => { setLang(e.target.value); draw(); });
  $('#gout')?.addEventListener('click', () => { me = null; ses.set(null); remote.guestLogout(); draw(); });
}

function login() {
  const pre = (location.hash.match(/ref=([\w-]+)/) || [])[1] || '';
  root.innerHTML = `${top()}<main class="g-login" id="main"><div class="g-card">
  <h1>${t('gp.welcome')}</h1><p class="mut">${t('gp.loginSub')}</p>
  <div class="seg" role="tablist"><button role="tab" class="on" data-m="ref" aria-selected="true">${t('gp.byRef')}</button><button role="tab" data-m="acc" aria-selected="false">${t('gp.byAccount')}</button></div>
  <form class="f" id="lr"><label>${t('conf.ref')}<input name="ref" required value="${esc(pre)}" placeholder="CL-2026-…" autocapitalize="characters" /></label><label>${t('form.email')}<input type="email" name="email" required autocomplete="email" /></label><div class="err" hidden role="alert"></div><button class="btn pri block">${t('gp.open')}</button></form>
  <form class="f" id="la" hidden><label>${t('form.email')}<input type="email" name="email" required autocomplete="username" /></label><label>${t('form.password')}<input type="password" name="pw" required autocomplete="current-password" /></label><div class="err" hidden role="alert"></div><button class="btn pri block">${t('gp.open')}</button></form>
  <p class="hint">${t('gp.noBooking')} <a class="link" href="index.html#/reserver">${t('cta.book')}</a></p>
</div></main>`;
  bindTop();
  $$('[data-m]').forEach((b) => b.addEventListener('click', () => { $$('[data-m]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); }); $('#lr').hidden = b.dataset.m !== 'ref'; $('#la').hidden = b.dataset.m === 'ref'; }));
  $('#lr').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target; const er = $('.err', f);
    if (remote.live.on) {
      const btn = f.querySelector('button'); btn.disabled = true;
      const r = await remote.guestLogin(f.ref.value.trim(), f.email.value.trim());
      btn.disabled = false;
      if (!r.ok) { er.textContent = t(r.error === 'err.network' || r.error === 'err.tooMany' ? r.error : 'gp.notFound'); er.hidden = false; return; }
      me = { ref: r.ref, live: true }; ses.set(me); tab = 'stay'; remote.watchGuest(); draw(); return;
    }
    const b = findBooking(f.ref.value, f.email.value);
    if (!b) { er.textContent = t('gp.notFound'); er.hidden = false; return; }
    me = { ref: b.ref }; ses.set(me); tab = 'stay'; draw();
  });
  $('#la').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    if (remote.live.on) {
      const er = $('.err', f); const btn = f.querySelector('button'); btn.disabled = true;
      const r = await remote.guestAccount(f.email.value.trim(), f.pw.value);
      btn.disabled = false;
      if (!r.ok) { er.textContent = t(r.error === 'err.network' || r.error === 'err.tooMany' ? r.error : 'gp.badAccount'); er.hidden = false; return; }
      const gid = S().guests[0]?.id;
      me = { guestId: gid, ref: r.ref, live: true }; ses.set(me); tab = 'stay'; remote.watchGuest(); draw(); return;
    }
    const h = await hashPw(f.pw.value);
    const g = S().guests.find((x) => x.email === f.email.value.trim().toLowerCase() && x.pwHash && x.pwHash === h);
    const bs = g ? S().bookings.filter((b) => b.guestId === g.id).sort((a, b) => b.from.localeCompare(a.from)) : [];
    if (!g || !bs.length) { const er = $('.err', f); er.textContent = t('gp.badAccount'); er.hidden = false; return; }
    me = { guestId: g.id, ref: (bs.find((b) => b.to >= today()) || bs[0]).ref }; ses.set(me); draw();
  });
}

const TABS = [['stay', 'home', 'gp.tStay'], ['pre', 'user', 'gp.tPre'], ['req', 'bell', 'gp.tReq'], ['change', 'cal', 'gp.tChange'], ['msg', 'chat', 'gp.tMsg'], ['docs', 'dl', 'gp.tDocs']];

function draw() {
  if (!me) return login();
  const b = bookingOf(me.ref); if (!b) { me = null; ses.set(null); return login(); }
  const g = guestOf(b.guestId); const r = roomOf(b.room); const after = b.status === 'checked-out';
  const tabs = after ? [...TABS, ['after', 'star', 'gp.tAfter']] : TABS;
  const mine = me.guestId ? S().bookings.filter((x) => x.guestId === me.guestId).sort((a, z) => z.from.localeCompare(a.from)) : [];
  root.innerHTML = `${top()}<main class="g-main" id="main">
<section class="g-hero">${img(`rooms/${r.slug}-1.jpg`, { ratio: '21/9', alt: r.name, eager: true })}<div class="g-hero-t"><p class="kick">${t('gp.hello', { name: esc(g.first) })}</p><h1>${esc(r.name)}</h1><p>${fdLong(b.from)} → ${fdLong(b.to)} · ${nightsLabel(diffDays(b.from, b.to))}</p><p>${statusPill(b.status)} <code>${b.ref}</code></p></div></section>
${mine.length > 1 ? `<label class="fl pick-b">${t('gp.myBookings')}<select class="inp" id="pickB">${mine.map((x) => `<option value="${x.ref}" ${x.ref === b.ref ? 'selected' : ''}>${x.ref} · ${esc(roomOf(x.room).name)} · ${fd(x.from)}</option>`).join('')}</select></label>` : ''}
<nav class="g-tabs" aria-label="${t('gp.title')}">${tabs.map(([k, ic, lb]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}" ${tab === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${t(lb)}</span></button>`).join('')}</nav>
<div class="g-body">${(V[tab] || V.stay)(b, g, r)}</div>
<a class="btn wa g-wa" href="${waLink(t('gp.waText', { ref: b.ref }))}" target="_blank" rel="noopener">${icon('wa')}${t('gp.waHouse')}</a>
</main>`;
  bindTop();
  $('#pickB')?.addEventListener('change', (e) => { me.ref = e.target.value; ses.set(me); draw(); });
  $$('[data-tab]').forEach((x) => x.addEventListener('click', () => { tab = x.dataset.tab; draw(); window.scrollTo({ top: $('.g-tabs').offsetTop - 10, behavior: 'smooth' }); }));
  (B[tab] || (() => {}))(b, g, r);
}
db.on(() => { if (me && !document.querySelector('dialog[open]') && !document.activeElement?.matches('input,textarea,select')) draw(); });

const bd = (q) => `<dl class="bd">${q.lines.map((l) => `<div><dt>${t(l.key, { n: l.n, pct: l.pct, code: l.code })}</dt><dd>${l.key === 'q.breakfast' ? `<span class="incl">${t('q.included')}</span>` : money(l.amount)}</dd></div>`).join('')}<div class="tot"><dt>${t('q.total')}</dt><dd>${money(q.total)}</dd></div></dl>`;
const live = (b) => !['cancelled', 'no-show', 'checked-out'].includes(b.status);

const V = {
  stay(b, g, r) {
    const paid = paidFor(b.ref); const s = S().settings; const dl = addDays(b.from, -s.cancellationDays);
    const steps = [['confirmed', t('st.confirmed')], ['pre', t('gp.tPre')], ['checked-in', t('st.checked-in')], ['checked-out', t('st.checked-out')]];
    const done = { confirmed: b.status !== 'pending', pre: !!b.prearrival, 'checked-in': ['checked-in', 'checked-out'].includes(b.status), 'checked-out': b.status === 'checked-out' };
    return `${b.status === 'cancelled' ? `<p class="err">${t('gp.cancelled')}</p>` : `<ol class="g-steps">${steps.map(([k, l]) => `<li class="${done[k] ? 'done' : ''}">${done[k] ? icon('check') : '<i></i>'}<span>${l}</span></li>`).join('')}</ol>`}
<div class="g-grid">
  <section class="g-card"><h2>${t('gp.yourStay')}</h2><ul class="g-facts"><li>${icon('bed')}<span><b>${esc(r.name)}</b>${esc(L(r.floor))}</span></li><li>${icon('cal')}<span><b>${fdLong(b.from)}</b>${t('gp.checkInFrom', { t: s.checkIn })}</span></li><li>${icon('logout')}<span><b>${fdLong(b.to)}</b>${t('gp.checkOutBy', { t: s.checkOut })}</span></li><li>${icon('users')}<span><b>${partyLabel(b.adults, b.children, b.infants)}</b>${t('trust.breakfast')}</span></li></ul></section>
  <section class="g-card"><h2>${t('gp.payment')}</h2>${bd(b.quote)}<p class="g-bal"><span>${t('conf.paid')} <b>${money(paid)}</b></span><span>${t('conf.balance')} <b>${money(b.total - paid)}</b></span></p><p class="hint">${t('gp.balanceHint')}</p></section>
  <section class="g-card"><h2>${t('gp.policy')}</h2><p>${b.status === 'cancelled' ? '—' : diffDays(today(), dl) >= 0 ? t('gp.freeUntil', { date: fd(dl) }) : t('gp.nonRefundable')}</p><p class="hint">${t('policy.cancel', { d: s.cancellationDays, date: fd(dl) })}</p>${live(b) && !b.prearrival ? `<button class="btn sun" data-go="pre">${t('gp.fillPre')}</button>` : ''}</section>
  <section class="g-card"><h2>${t('gp.findUs')}</h2><p>${esc(S().settings.contact.address)}</p><p class="hint">${esc(L(C.CONTACT.addressNote))}</p><a class="btn ghost" href="${S().settings.contact.maps}" target="_blank" rel="noopener">${icon('pin')}${t('conf.directions')}</a></section>
</div>`;
  },
  pre(b) {
    const p = b.prearrival || {}; const ro = !live(b);
    return `<form class="g-card f" id="pf"><h2>${t('gp.tPre')}</h2><p class="hint">${t('gp.preIntro')}</p>${b.prearrival ? `<p class="ok-box">${t('gp.preDone')}</p>` : ''}
  <div class="row2"><label>${t('form.arrival')}<input type="time" name="arrivalTime" value="${esc(p.arrivalTime || b.arrivalTime || '')}" /></label><label>${t('gp.flight')}<input name="flight" value="${esc(p.flight || '')}" placeholder="AT 1427" /></label></div>
  <fieldset class="g-fs"><legend>${t('gp.police')}</legend><p class="hint">${t('gp.policeHint')}</p>
  <div class="row2"><label>${t('gp.nationality')}<input name="nationality" required value="${esc(p.nationality || '')}" /></label><label>${t('gp.birth')}<input type="date" name="birthDate" required value="${esc(p.birthDate || '')}" /></label></div>
  <div class="row2"><label>${t('gp.idType')}<select name="idType"><option value="passport" ${p.idType !== 'id' ? 'selected' : ''}>${t('gp.id_passport')}</option><option value="id" ${p.idType === 'id' ? 'selected' : ''}>${t('gp.id_id')}</option></select></label><label>${t('gp.idNumber')}<input name="idNumber" required value="${esc(p.idNumber || '')}" autocomplete="off" /></label></div></fieldset>
  <label>${t('gp.dietary')}<input name="dietary" value="${esc(p.dietary || '')}" placeholder="${t('gp.dietaryPh')}" /></label>
  <label>${t('gp.special')}<textarea name="requests">${esc(p.requests || '')}</textarea></label>
  <div class="err" hidden role="alert"></div>
  <button class="btn pri" ${ro ? 'disabled' : ''}>${t('gp.savePre')}</button></form>`;
  },
  req(b) {
    const reqs = S().requests.filter((r) => r.ref === b.ref).sort((a, z) => z.at.localeCompare(a.at));
    return `<div class="g-grid">
<section class="g-card"><h2>${t('gp.newReq')}</h2><form class="f" id="rf">
  <label>${t('a.type')}<select name="type"><option value="transfer">${t('rt.transfer')}</option><option value="late">${t('rt.late')}</option>${C.EXPERIENCES.map((e) => `<option value="exp:${e.id}">${esc(L(e)[0])}</option>`).join('')}</select></label>
  <div class="row2"><label>${t('exp.date')}<input type="date" name="date" required value="${b.from}" min="${today()}" /></label><label>${t('exp.people')}<input type="number" name="people" min="1" max="12" value="${b.adults + b.children}" /></label></div>
  <label>${t('form.notes')}<textarea name="notes" placeholder="${t('gp.reqPh')}"></textarea></label>
  <p class="hint">${t('exp.partners')}</p>
  <button class="btn pri" ${live(b) ? '' : 'disabled'}>${t('exp.send')}</button></form></section>
<section class="g-card"><h2>${t('gp.myReq')}</h2>${reqs.map((r) => { const e = r.exp && C.EXPERIENCES.find((x) => x.id === r.exp); return `<div class="g-req"><div><b>${esc(r.type === 'experience' ? L(e)[0] : t(`rt.${r.type}`))}</b><small>${fd(r.date)} · ${t('exp.peopleN', { n: r.people })}${r.price ? ` · ${money(r.price)}` : ''}</small>${r.reply ? `<p class="note">${esc(r.reply)}</p>` : ''}</div><span class="pill st-${r.status}">${t(`rs.${r.status}`)}</span></div>`; }).join('') || `<p class="mut">${t('gp.noReq')}</p>`}</section></div>`;
  },
  change(b) {
    const s = S().settings; const refund = refundIfCancelled(b); const mr = b.modifyRequest;
    if (!['pending', 'confirmed'].includes(b.status)) return `<section class="g-card"><p class="mut">${t('gp.noChange')}</p></section>`;
    return `<div class="g-grid">
<section class="g-card"><h2>${t('gp.changeDates')}</h2>${mr?.status === 'pending' ? `<p class="ok-box">${t('gp.changePending', { from: fd(mr.from), to: fd(mr.to) })}</p>` : mr?.status === 'declined' ? `<p class="err">${t('gp.changeDeclined')}</p>` : ''}
  <p class="hint">${t('gp.changeHint')}</p><button class="btn pri" id="chg">${icon('cal')}${t('gp.pickNew')}</button><div id="chgOut"></div></section>
<section class="g-card"><h2>${t('gp.cancelTitle')}</h2><p>${t('policy.cancel', { d: s.cancellationDays, date: fd(addDays(b.from, -s.cancellationDays)) })}</p><p>${t('gp.refundNow')}: <b>${money(refund)}</b></p><button class="btn danger" id="cx">${t('gp.cancelBtn')}</button></section></div>`;
  },
  msg(b) {
    const ms = S().messages.filter((m) => m.thread === b.ref).sort((a, z) => a.at.localeCompare(z.at));
    return `<section class="g-card"><h2>${t('gp.tMsg')}</h2><div class="g-msgs">${ms.map((m) => `<div class="msg ${m.from}"><p>${esc(m.text)}</p><small>${esc(m.name || '')} · ${ftime(m.at)}</small></div>`).join('') || `<p class="mut">${t('gp.noMsg')}</p>`}</div>
<form class="g-reply" id="mf"><label class="sr" for="mt">${t('a.reply')}</label><textarea id="mt" class="inp" name="text" required placeholder="${t('gp.msgPh')}"></textarea><button class="btn pri">${icon('send')}${t('a.send')}</button></form></section>`;
  },
  docs(b) {
    return `<div class="g-grid">
<section class="g-card"><h2>${icon('print')}${t('gp.invoice')}</h2><p class="hint">${t('gp.invoiceHint')}</p><button class="btn ghost" id="inv">${t('gp.openInvoice')}</button></section>
<section class="g-card"><h2>${icon('check')}${t('gp.confirmation')}</h2><p class="hint">${t('gp.confHint')}</p><button class="btn ghost" id="conf">${t('gp.openConf')}</button><button class="btn ghost" id="ics">${icon('cal')}${t('conf.ics')}</button></section>
<section class="g-card"><h2>${icon('pin')}${t('gp.directions')}</h2>${C.GETTING_HERE.map((x) => `<p><b>${esc(L(x)[0])}</b> — ${esc(L(x)[1])}</p>`).join('')}<a class="btn ghost" href="${S().settings.contact.maps}" target="_blank" rel="noopener">${t('f.map')}</a></section></div>`;
  },
  after(b) {
    return `<section class="g-card c"><h2>${t('gp.thanks')}</h2><p>${t('gp.thanksBody')}</p><div class="g-act"><a class="btn pri" href="${S().reviews.google.url}" target="_blank" rel="noopener">${icon('star')}${t('rev.leave')}</a><button class="btn sun" id="again">${t('gp.bookAgain')}</button></div></section>`;
  },
};

function printDoc(title, html) {
  const m = modal(`${dlgHead(title)}<div class="dlg-b"><div class="print-area inv">${html}</div></div><div class="dlg-f no-print"><button class="btn pri" id="prt">${icon('print')}${t('a.print')}</button></div>`, { wide: true, cls: 'printable' });
  $('#prt', m.el).addEventListener('click', () => window.print());
}
const docHead = (title, b) => { const c = S().settings.contact; return `<div class="inv-h"><div><b class="serif">${esc(C.BRAND.name)}</b><p>${esc(c.address)}<br>${esc(c.phone)} · ${esc(c.emails[0])}</p></div><div class="r"><h2>${title}</h2><p>${b.ref}<br>${fd(today())}</p></div></div>`; };

const B = {
  stay() { $$('[data-go]').forEach((x) => x.addEventListener('click', () => { tab = x.dataset.go; draw(); })); },
  pre(b) {
    $('#pf').addEventListener('submit', async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      if (!d.nationality || !d.idNumber || !d.birthDate) { const er = $('.err', e.target); er.textContent = t('err.form'); er.hidden = false; return; }
      if (!(await act('prearrival', b.ref, d))) return;
      if (!remote.live.on) db.update((s) => { const x = bookingOf(b.ref, s); x.prearrival = d; x.arrivalTime = d.arrivalTime; logTo(x, 'guest', 'Pre-arrival form completed'); });
      toast(t('gp.preSaved'));
    });
  },
  req(b) {
    $('#rf').addEventListener('submit', async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      const exp = d.type.startsWith('exp:') ? d.type.slice(4) : null;
      const req = { type: exp ? 'experience' : d.type, exp, date: d.date, people: +d.people, notes: d.notes };
      if (remote.live.on) { if (!(await act('request', b.ref, req))) return; } else addRequest({ ref: b.ref, ...req });
      toast(t('exp.sent'));
    });
  },
  change(b) {
    $('#chg')?.addEventListener('click', () => rangePicker({ from: b.from, to: b.to, busy: busyNights(b.room, b.ref), onApply: (a, z) => {
      const err = checkStay({ room: b.room, from: a, to: z, adults: b.adults, children: b.children }, b.ref);
      const out = $('#chgOut');
      if (err) { out.innerHTML = `<p class="err">${t(err, { n: minStayFor(a) })}</p>`; return; }
      const q = quote({ room: b.room, from: a, to: z, adults: b.adults, children: b.children, promo: b.promo, transfer: b.extras.transfer, lateCheckout: b.extras.lateCheckout });
      out.innerHTML = `<div class="g-new"><p><b>${fd(a)} → ${fd(z)}</b> · ${nightsLabel(diffDays(a, z))}</p><p>${t('gp.newPrice', { p: money(q.total), was: money(b.total) })}</p><button class="btn sun" id="sendChg">${t('gp.sendChange')}</button></div>`;
      $('#sendChg').addEventListener('click', async () => {
        if (remote.live.on) { if (!(await act('modify', b.ref, { from: a, to: z }))) return; } else db.update((s) => { const x = bookingOf(b.ref, s); x.modifyRequest = { from: a, to: z, status: 'pending', at: new Date().toISOString() }; logTo(x, 'guest', `Date change requested: ${a} → ${z}`); });
        toast(t('gp.changeSent')); draw();
      });
    } }));
    $('#cx')?.addEventListener('click', () => {
      const refund = refundIfCancelled(b);
      const m = modal(`${dlgHead(t('gp.cancelTitle'))}<div class="dlg-b"><p>${t('gp.cancelConfirm', { r: money(refund) })}</p></div><div class="dlg-f"><button class="btn ghost" data-close>${t('back')}</button><button class="btn danger" id="cxOk">${t('gp.cancelBtn')}</button></div>`);
      $('#cxOk', m.el).addEventListener('click', async () => {
        if (remote.live.on) { if (!(await act('cancel', b.ref))) { m.close(); return; } } else cancelBooking(b.ref, 'guest');
        m.close(); toast(t('gp.cancelledToast')); tab = 'stay'; draw();
      });
    });
  },
  msg(b, g) {
    const box = $('.g-msgs'); box.scrollTop = box.scrollHeight;
    $('#mf').addEventListener('submit', async (e) => {
      e.preventDefault(); const text = e.target.text.value.trim(); if (!text) return;
      if (remote.live.on) { if (!(await act('message', b.ref, { text }))) return; } else addMessage({ thread: b.ref, from: 'guest', name: guestName(g), text });
      e.target.reset(); draw(); toast(t('gp.msgSent'));
    });
  },
  docs(b, g, r) {
    $('#inv').addEventListener('click', () => { const pays = S().payments.filter((p) => p.ref === b.ref); printDoc(t('gp.invoice'), `${docHead(t('gp.invoice'), b)}<p><b>${t('a.billedTo')}</b><br>${esc(guestName(g))}<br>${esc(g.email)}</p><p>${esc(r.name)} · ${fd(b.from)} → ${fd(b.to)} · ${partyLabel(b.adults, b.children)}</p>${bd(b.quote)}<table class="tbl"><tbody>${pays.map((p) => `<tr><td>${fd(p.at.slice(0, 10))} · ${t(`pk.${p.kind}`)}</td><td class="r">${money(p.amount)}</td></tr>`).join('')}<tr><td><b>${t('conf.balance')}</b></td><td class="r"><b>${money(b.total - paidFor(b.ref))}</b></td></tr></tbody></table><p class="hint">${t('a.invNote')}</p>`); });
    $('#conf').addEventListener('click', () => printDoc(t('gp.confirmation'), `${docHead(t('gp.confirmation'), b)}<p>${t('conf.title', { name: esc(g.first) })}</p><p><b>${esc(r.name)}</b><br>${fdLong(b.from)} → ${fdLong(b.to)} · ${nightsLabel(diffDays(b.from, b.to))}<br>${partyLabel(b.adults, b.children, b.infants)}</p><p>${t('gp.checkInFrom', { t: S().settings.checkIn })} · ${t('gp.checkOutBy', { t: S().settings.checkOut })}</p>${bd(b.quote)}`));
    $('#ics').addEventListener('click', () => { download(`${b.ref}.ics`, icsFor(b, r.name), 'text/calendar'); toast(t('conf.icsDone')); });
  },
  after(b) {
    $('#again').addEventListener('click', () => {
      try { sessionStorage.setItem('cl-search', JSON.stringify({ from: null, to: null, adults: b.adults, children: b.children, childAges: b.childAges || [], infants: 0 })); } catch { /* private */ }
      location.href = `index.html#/chambre/${b.room}`;
    });
  },
};

/** Live mode: send a guest action to the server. → true on success (an error toast otherwise). */
async function act(op, ref, data) {
  if (!remote.live.on) return true;
  const r = await remote.guestOp(op, ref, data);
  if (!r.ok) { toast(t(r.error), 'bad'); if (r.error === 'err.session') { me = null; ses.set(null); draw(); } return false; }
  return true;
}

// Live mode when the API answers; a guest who just booked on the site is signed in directly.
if (await remote.bootPublic()) {
  if (remote.guestToken() && await remote.guestRefresh()) {
    const pre = (location.hash.match(/ref=([\w-]+)/) || [])[1];
    const known = (ref) => ref && bookingOf(ref)?.guestId;
    me = { ref: known(pre) ? pre : known(me?.ref) ? me.ref : S().bookings.find((b) => b.guestId)?.ref, live: true };
    if (!me.ref) me = null; else remote.watchGuest();
    ses.set(me);
  } else me = null;
} else if (me?.live) me = null;
draw();
