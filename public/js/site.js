/* Casa Lola — public website (hash router SPA) and booking engine. */
import * as C from './config.js';
import * as remote from './remote.js';
import {
  db, room as roomOf, today, addDays, diffDays, quote, checkStay, minStayFor, fits, isFree, busyNights, fromPrice, findPromo, createBooking, addRequest, addMessage, hashPw, booking as bookingOf, guest as guestOf,
} from './store.js';
import {
  t, L, esc, lang, cur, setLang, setCur, money, fd, fdShort, fdLong, img, icon, todo, previewOn, waLink, fill, toast, modal, dlgHead, download, icsFor, rangePicker, $, $$, nightsLabel, partyLabel,
} from './ui.js';

const app = $('#app');
const SKEY = 'cl-search';
const ss = { get: () => { try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch { return null; } }, set: (v) => { try { sessionStorage.setItem(SKEY, JSON.stringify(v)); } catch { /* private */ } } };
let search = ss.get() || { from: null, to: null, adults: 2, children: 0, childAges: [], infants: 0 };
let flow = null; // { step, room, extras, promo, guest, account, payMode, ref }
const saveSearch = () => ss.set(search);
const R = () => db.s;
const href = (r) => `index.html#/${r}`;
const roomName = (slug) => roomOf(slug)?.name || slug;
const viewLabel = (v) => t(`view.${v}`);

if (previewOn()) document.documentElement.classList.add('preview');

/* ---------- Shell ---------- */
const NAV = [['maison', 'nav.house'], ['chambres', 'nav.rooms'], ['experiences', 'nav.experiences'], ['dakhla', 'nav.dakhla'], ['galerie', 'nav.gallery'], ['avis', 'nav.reviews'], ['contact', 'nav.contact']];

function header() {
  const cur0 = location.hash.replace(/^#\/?/, '').split('/')[0];
  return `<a class="skip" href="#main">${t('skip')}</a>
<header class="hdr" id="hdr"><div class="hdr-in">
  <a class="brand" href="${href('')}">${img(C.BRAND.logo, { ratio: '1/1', alt: C.BRAND.name, cls: 'logo' })}<span><b>Casa Lola</b><small>Kite House Dakhla</small></span></a>
  <nav class="nav" aria-label="${t('nav.main')}">${NAV.map(([r, k]) => `<a href="${href(r)}" ${cur0 === r ? 'aria-current="page"' : ''}>${t(k)}</a>`).join('')}</nav>
  <div class="hdr-r">
    <label class="sel"><span class="sr">${t('lang')}</span>${icon('globe')}<select id="langSel">${Object.entries(C.LANGS).map(([k, v]) => `<option value="${k}" ${k === lang() ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('')}</select></label>
    <label class="sel"><span class="sr">${t('currency')}</span><select id="curSel"><option ${cur() === 'EUR' ? 'selected' : ''}>EUR</option><option ${cur() === 'MAD' ? 'selected' : ''}>MAD</option></select></label>
    <a class="btn sun sm hdr-book" href="${href('reserver')}">${t('cta.book')}</a>
    <button type="button" class="ib burger" id="burger" aria-label="${t('menu')}" aria-expanded="false" aria-controls="drawer">${icon('menu')}</button>
  </div>
</div></header>
<div class="drawer" id="drawer" hidden><nav aria-label="${t('nav.main')}">${NAV.map(([r, k]) => `<a href="${href(r)}">${t(k)}</a>`).join('')}<a href="${href('offres')}">${t('nav.offers')}</a><a href="${href('faq')}">${t('nav.faq')}</a><a href="guest.html">${t('nav.myStay')}</a></nav></div>`;
}

function footer() {
  const c = R().settings.contact;
  return `<footer class="ftr"><div class="wrap ftr-g">
  <div class="ftr-brand">${img(C.BRAND.logo, { ratio: '1/1', alt: C.BRAND.name, cls: 'logo lg' })}<p class="serif">${esc(C.BRAND.name)}</p><p class="mut">${esc(C.BRAND.secondary)}</p></div>
  <div><h2 class="fh">${t('f.contact')}</h2><a href="tel:${c.phone.replace(/[^+\d]/g, '')}">${icon('phone')}${esc(c.phone)}</a><a href="${waLink(L(C.TEXT.whatsappHello))}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a>${c.emails.map((e) => `<a href="mailto:${e}">${icon('mail')}${e}</a>`).join('')}</div>
  <div><h2 class="fh">${t('f.find')}</h2><p>${icon('pin')}${esc(c.address)}</p><a href="${c.maps}" target="_blank" rel="noopener">${t('f.map')}</a><a href="${c.instagram.url}" target="_blank" rel="noopener">${icon('insta')}${esc(c.instagram.handle)}</a><a href="${c.tripadvisor.url}" target="_blank" rel="noopener">TripAdvisor</a></div>
  <div><h2 class="fh">${t('f.info')}</h2><a href="${href('offres')}">${t('nav.offers')}</a><a href="${href('faq')}">${t('nav.faq')}</a><a href="guest.html">${t('nav.myStay')}</a><a href="${href('legal/mentions')}">${L(C.LEGAL.mentions.title)}</a><a href="${href('legal/privacy')}">${L(C.LEGAL.privacy.title)}</a><a href="${href('legal/terms')}">${L(C.LEGAL.terms.title)}</a></div>
</div><div class="wrap ftr-b"><span>© ${new Date().getFullYear()} ${esc(C.BRAND.name)}</span><span>${t('f.demo')} · <a href="https://mbndev.ma" target="_blank" rel="noopener">Site by MBN DEV</a></span></div></footer>`;
}

function chrome() {
  $('#shell-top').innerHTML = header();
  $('#shell-bot').innerHTML = `${footer()}
<div class="mbar no-print"><a class="btn sun" href="${href('reserver')}">${icon('cal')}${t('cta.book')}</a><a class="btn wa" href="${waLink(L(C.TEXT.whatsappHello))}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a></div>
<a class="wa-float no-print" href="${waLink(L(C.TEXT.whatsappHello))}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('wa')}</a>
<div class="preview-bar">${icon('eye')}${t('preview.on')}</div>
${cookieBar()}`;
  $('#langSel').addEventListener('change', (e) => { setLang(e.target.value); chrome(); route(); });
  $('#curSel').addEventListener('change', (e) => { setCur(e.target.value); route(); });
  const bg = $('#burger'); const dr = $('#drawer');
  bg.addEventListener('click', () => { const o = dr.hidden; dr.hidden = !o; bg.setAttribute('aria-expanded', String(o)); document.body.classList.toggle('menu-open', o); });
  dr.addEventListener('click', (e) => { if (e.target.closest('a')) { dr.hidden = true; bg.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); } });
  const cb = $('#cookie');
  cb?.addEventListener('click', (e) => { const b = e.target.closest('[data-ck]'); if (!b) return; try { localStorage.setItem('cl-cookies', b.dataset.ck); } catch { /* private */ } cb.remove(); });
}
function cookieBar() {
  let seen = null; try { seen = localStorage.getItem('cl-cookies'); } catch { /* private */ }
  if (seen) return '';
  return `<div class="cookie no-print" id="cookie" role="region" aria-label="${t('cookie.title')}"><p>${t('cookie.text')}</p><div><button class="btn ghost sm" data-ck="essential">${t('cookie.essential')}</button><button class="btn dark sm" data-ck="all">${t('cookie.ok')}</button></div></div>`;
}

/* ---------- Router ---------- */
const PAGES = { '': home, maison: house, chambres: rooms, chambre: roomPage, experiences, dakhla, galerie: gallery, avis: reviews, faq, contact, offres: offers, legal, reserver: book };
function route() {
  const [p, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const fn = PAGES[p] || home;
  app.innerHTML = fn(arg ? decodeURIComponent(arg) : undefined);
  app.dataset.page = p || 'home';
  document.body.dataset.page = p || 'home';
  $$('.nav a').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === href(p)));
  bind[p || '']?.(arg);
  bindCommon();
  reveal();
  document.title = `${p && TITLES[p] ? `${t(TITLES[p])} · ` : ''}${C.BRAND.name}`;
}
const TITLES = { maison: 'nav.house', chambres: 'nav.rooms', chambre: 'nav.rooms', experiences: 'nav.experiences', dakhla: 'nav.dakhla', galerie: 'nav.gallery', avis: 'nav.reviews', faq: 'nav.faq', contact: 'nav.contact', offres: 'nav.offers', reserver: 'cta.book' };
window.addEventListener('hashchange', () => { route(); if (!location.hash.includes('#/reserver') || !flow) window.scrollTo({ top: 0, behavior: 'instant' }); });
// Links are written "index.html#/x" so they also work in a new tab; inside the app we only change the hash.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="index.html#"]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  const h = a.getAttribute('href').slice(10);
  if (location.hash === h) { route(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else location.hash = h;
});
db.on(() => { if (['chambre', 'reserver', 'chambres'].includes(app.dataset.page) && !flow?.step) route(); });

function reveal() {
  const els = $$('.rv:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach((x) => x.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((x) => io.observe(x));
}
const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Reusable blocks ---------- */
const secHead = (kick, title, sub = '', center = false) => `<div class="sh ${center ? 'c' : ''} rv"><p class="kick">${kick}</p><h2>${title}</h2>${sub ? `<p class="lead">${sub}</p>` : ''}</div>`;

function searchBar(compact = false) {
  const n = search.from && search.to ? diffDays(search.from, search.to) : 0;
  return `<form class="sbar ${compact ? 'compact' : ''}" data-search autocomplete="off">
  <button type="button" class="sb-f" data-dates><span class="sb-l">${t('s.arrival')}</span><span class="sb-v">${search.from ? fdShort(search.from) : t('s.addDate')}</span></button>
  <button type="button" class="sb-f" data-dates><span class="sb-l">${t('s.departure')}</span><span class="sb-v">${search.to ? fdShort(search.to) : t('s.addDate')}</span>${n ? `<span class="sb-n">${nightsLabel(n)}</span>` : ''}</button>
  <button type="button" class="sb-f" data-party><span class="sb-l">${t('s.guests')}</span><span class="sb-v">${partyLabel(search.adults, search.children, search.infants)}</span></button>
  <button type="submit" class="btn sun sb-go">${icon('search')}<span>${t('s.go')}</span></button>
</form>`;
}
function bindSearch(root = document, onDone) {
  $$('[data-search]', root).forEach((f) => {
    f.addEventListener('click', (e) => {
      if (e.target.closest('[data-dates]')) rangePicker({ from: search.from, to: search.to, onApply: (a, b) => { search.from = a; search.to = b; saveSearch(); onDone ? onDone() : route(); } });
      if (e.target.closest('[data-party]')) partyPicker(onDone);
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!search.from || !search.to) { rangePicker({ from: search.from, to: search.to, onApply: (a, b) => { search.from = a; search.to = b; saveSearch(); location.hash = '#/reserver'; route(); } }); return; }
      flow = null; if (location.hash === '#/reserver') route(); else location.hash = '#/reserver';
    });
  });
}
function partyPicker(onDone) {
  const p = { ...search, childAges: [...(search.childAges || [])] };
  const m = modal(`${dlgHead(t('s.guests'))}<div class="dlg-b party"></div><div class="dlg-f"><button class="btn pri" data-ok>${t('pick.apply')}</button></div>`, { cls: 'sheet' });
  const box = m.el.querySelector('.party');
  const row = (k, label, hint, min, max) => `<div class="pr"><div><b>${label}</b><span class="hint">${hint}</span></div><div class="step"><button type="button" data-k="${k}" data-d="-1" ${p[k] <= min ? 'disabled' : ''} aria-label="−">−</button><output aria-live="polite">${p[k]}</output><button type="button" data-k="${k}" data-d="1" ${p[k] >= max || (k !== 'infants' && p.adults + p.children >= 3) ? 'disabled' : ''} aria-label="+">+</button></div></div>`;
  const draw = () => {
    box.innerHTML = row('adults', t('party.adultsL'), t('party.adultsH'), 1, 3) + row('children', t('party.childrenL'), t('party.childrenH'), 0, 2) + row('infants', t('party.infantsL'), t('party.infantsH'), 0, 1)
      + (p.children ? `<div class="ages">${p.childAges.map((a, i) => `<label class="fl">${t('party.age', { n: i + 1 })}<select class="inp" data-age="${i}">${[...Array(16)].map((_, y) => `<option value="${y + 2}" ${a == y + 2 ? 'selected' : ''}>${t('party.years', { n: y + 2 })}</option>`).join('')}</select></label>`).join('')}</div>` : '')
      + `<p class="hint">${t('party.note')}</p>`;
  };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k; p[k] = Math.max(0, p[k] + +b.dataset.d);
    if (k === 'children') { while (p.childAges.length < p.children) p.childAges.push(6); p.childAges.length = p.children; }
    draw();
  });
  box.addEventListener('change', (e) => { const s = e.target.closest('[data-age]'); if (s) p.childAges[+s.dataset.age] = +s.value; });
  m.el.querySelector('[data-ok]').addEventListener('click', () => { Object.assign(search, p); saveSearch(); m.close(); onDone ? onDone() : route(); });
  draw();
}

function roomCard(r, extra = '') {
  return `<article class="rc rv">
  <a class="rc-img" href="${href(`chambre/${r.slug}`)}" aria-label="${esc(r.name)}">${img(`rooms/${r.slug}-1.jpg`, { ratio: '4/3', alt: `${r.name} — ${L(r.decor)}`, sizes: '(max-width:640px) 100vw, 33vw' })}<span class="badge">${icon(r.view === 'garden' ? 'leaf' : 'wave')}${viewLabel(r.view)}</span></a>
  <div class="rc-b">
    <h3><a href="${href(`chambre/${r.slug}`)}">${esc(r.name)}</a>${r.suite ? `<span class="pill">${t('room.suite')}</span>` : ''}${r.family ? `<span class="pill">${t('room.family')}</span>` : ''}</h3>
    <p class="mut">${esc(L(r.floor))}</p>
    <ul class="facts">${r.size ? `<li>${icon('size')}${todo(`rooms.${r.slug}.size`, `${r.size} m²`)}</li>` : previewOn() ? `<li>${icon('size')}${todo(`rooms.${r.slug}.size`, t('tbc'))}</li>` : ''}${r.beds ? `<li>${icon('bed')}${esc(L(C.BED_LABEL[r.beds]))}</li>` : previewOn() ? `<li>${icon('bed')}${todo(`rooms.${r.slug}.bed`, t('tbc'))}</li>` : ''}<li>${icon('users')}${t('room.upTo', { n: r.capacity })}</li></ul>
    <div class="rc-f">${extra || `<p class="from"><span>${t('room.from')}</span> <b>${todo(`rooms.${r.slug}.price`, money(fromPrice(r)))}</b> <span>/ ${t('room.night')}</span></p><a class="btn ghost sm" href="${href(`chambre/${r.slug}`)}">${t('room.see')}${icon('arrow')}</a>`}</div>
  </div></article>`;
}

/* ---------- Pages ---------- */
function home() {
  const g = R().reviews.google; const rs = R().rooms.filter((r) => r.active);
  return `<section class="hero">
  <div class="hero-bg">${img('home/hero-sunrise.jpg', { ratio: '16/9', alt: t('home.heroAlt'), eager: true, cls: 'hero-ph' })}</div>
  <div class="hero-in wrap">
    <p class="kick light">${t('home.kick')}</p>
    <h1>${esc(L(C.TEXT.heroTitle))}</h1>
    <p class="hero-sub">${esc(L(C.TEXT.heroSub))}</p>
    ${searchBar()}
  </div>
</section>
<section class="trust"><div class="wrap trust-in">
  <a href="${g.url}" target="_blank" rel="noopener" class="tr">${icon('star', 'gold')}<b>${g.rating}</b><span>${t('trust.google', { n: g.count })}</span></a>
  <span class="tr">${icon('cup')}<span>${t('trust.breakfast')}</span></span>
  <span class="tr">${icon('clock')}<span>${t('trust.reception')}</span></span>
  <span class="tr">${icon('plane')}<span>${t('trust.airport')}</span></span>
  <span class="tr">${icon('car')}<span>${t('trust.parking')}</span></span>
</div></section>
<section class="sec welcome"><div class="wrap two">
  <div class="rv">${img('home/lola-portrait.jpg', { ratio: '4/5', alt: t('home.lolaAlt'), cls: 'rounded' })}</div>
  <div class="rv">
    <p class="kick">${t('home.welcomeKick')}</p><h2 class="big">${esc(L(C.TEXT.welcomeTitle))}</h2>
    <p class="lead">${esc(L(C.TEXT.welcomeBody))}</p>
    <blockquote>${esc(L(C.TEXT.welcomeQuote))}<cite>— Lola</cite></blockquote>
    <div class="sunrise">${icon('sun')}<p>${esc(L(C.TEXT.sunrise))}</p></div>
    <a class="btn ghost" href="${href('maison')}">${t('home.discoverHouse')}${icon('arrow')}</a>
  </div>
</div></section>
<section class="sec alt"><div class="wrap">
  ${secHead(t('home.roomsKick'), t('home.roomsTitle'), t('home.roomsSub'))}
  <div class="rgrid">${rs.map((r) => roomCard(r)).join('')}</div>
</div></section>
<section class="sec"><div class="wrap">
  ${secHead(t('home.forKick'), t('home.forTitle'), '', true)}
  <div class="aud">${C.AUDIENCES.map((a) => `<article class="rv">${icon(a.icon)}<h3>${esc(L(a)[0])}</h3><p>${esc(L(a)[1])}</p>${a.id === 'remote' ? `<a class="link" href="${href('offres')}">${t('home.longStay', { n: R().rates.longStay.nights, pct: R().rates.longStay.pct })}</a>` : ''}</article>`).join('')}</div>
</div></section>
<section class="sec dark"><div class="wrap">
  ${secHead(t('home.expKick'), t('home.expTitle'), esc(L(C.TEXT.notSchool)))}
  <div class="egrid">${C.EXPERIENCES.slice(0, 6).map((e) => `<a class="et rv" href="${href('experiences')}">${img(e.img, { ratio: '4/3', alt: L(e)[0] })}<span>${icon(e.icon)}${esc(L(e)[0])}</span></a>`).join('')}</div>
  <a class="btn light" href="${href('experiences')}">${t('home.allExp')}${icon('arrow')}</a>
</div></section>
<section class="sec"><div class="wrap two rev">
  <div class="rv"><p class="kick">${t('home.dakhlaKick')}</p><h2 class="big">${t('home.dakhlaTitle')}</h2><p class="lead">${esc(L(C.CLIMATE))}</p><p>${esc(L(C.DAKHLA[0])[1])}</p><a class="btn ghost" href="${href('dakhla')}">${t('home.dakhlaCta')}${icon('arrow')}</a></div>
  <div class="mosaic rv">${img('dakhla/white-dune.jpg', { ratio: '16/9', alt: L(C.DAKHLA[2])[0] })}${img('dakhla/lagoon.jpg', { ratio: '16/9', alt: L(C.DAKHLA[0])[0] })}</div>
</div></section>
<section class="sec alt"><div class="wrap">
  ${secHead(t('home.galKick'), t('home.galTitle'))}
  <div class="strip">${C.GALLERY.slice(0, 8).map((g2) => `<a href="${href('galerie')}" class="rv">${img(g2.file, { ratio: '1/1', alt: L(g2.alt) })}</a>`).join('')}</div>
</div></section>
${reviewsBlock()}
<section class="sec"><div class="wrap">
  <div class="sh rv"><p class="kick">Instagram</p><h2><a href="${R().settings.contact.instagram.url}" target="_blank" rel="noopener">${esc(R().settings.contact.instagram.handle)}</a></h2></div>
  <div class="ig">${[1, 2, 3, 4, 5, 6].map((n) => `<a href="${R().settings.contact.instagram.url}" target="_blank" rel="noopener" class="rv">${img(`instagram/0${n}.jpg`, { ratio: '1/1', alt: `Instagram ${n}` })}</a>`).join('')}</div>
</div></section>
${finalCta()}`;
}
function finalCta() {
  return `<section class="cta"><div class="wrap cta-in rv"><div><h2>${t('cta.title')}</h2><p>${t('cta.sub')}</p></div><div class="cta-b"><a class="btn sun" href="${href('reserver')}">${t('cta.check')}</a><a class="btn wa" href="${waLink(L(C.TEXT.whatsappHello))}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a></div></div></section>`;
}
function reviewsBlock(full = false) {
  const g = R().reviews.google;
  // Reviews still waiting for the owner's real text are only shown in Preview mode.
  const sel = R().reviews.selected.filter((r) => previewOn() || (r.text && !/to be provided/i.test(r.text)));
  return `<section class="sec ${full ? '' : 'alt'}"><div class="wrap">
  ${full ? '' : secHead(t('rev.kick'), t('rev.title'))}
  <div class="rev-g ${sel.length ? '' : 'solo'}">
    <div class="gcard rv"><div class="gstars">${[1, 2, 3, 4, 5].map(() => icon('star', 'gold')).join('')}</div><b class="gscore">${g.rating}<span>/5</span></b><p>${t('rev.basedOn', { n: g.count })}</p><a class="btn ghost sm" href="${g.url}" target="_blank" rel="noopener">${t('rev.readGoogle')}</a></div>
    ${sel.length ? `<div class="rev-list rv" tabindex="0" aria-label="${t('rev.selected')}">${sel.map((r) => `<figure class="rq">${todo('reviews.selected', `<blockquote>${esc(r.text)}</blockquote><figcaption>${esc(r.author)}${r.country ? ` · ${esc(r.country)}` : ''}</figcaption>`)}</figure>`).join('')}</div>` : ''}
  </div>
</div></section>`;
}

function pageHero(kick, title, sub = '', file = null) {
  return `<section class="phero ${file ? 'withimg' : ''}"><div class="wrap">${file ? `<div class="phero-img">${img(file, { ratio: '16/9', alt: title, eager: true })}</div>` : ''}<div class="phero-t"><p class="kick">${kick}</p><h1>${title}</h1>${sub ? `<p class="lead">${sub}</p>` : ''}</div></div></section>`;
}

function house() {
  const pol = R().settings;
  return `${pageHero(t('nav.house'), esc(L(C.TEXT.welcomeTitle)), esc(L(C.TEXT.welcomeBody)))}
<section class="sec"><div class="wrap">
  <div class="sunrise big rv">${icon('sun')}<p>${esc(L(C.TEXT.sunrise))}</p></div>
  ${secHead(t('house.areasKick'), t('house.areasTitle'))}
  <div class="areas">${C.HOUSE.areas.map((a) => `<article class="rv">${img(a.img, { ratio: '3/2', alt: L(a)[0], cls: 'rounded' })}<h3>${esc(L(a)[0])}</h3><p>${esc(L(a)[1])}</p></article>`).join('')}</div>
</div></section>
<section class="sec alt"><div class="wrap two">
  <div class="rv"><p class="kick">${t('house.servicesKick')}</p><h2 class="big">${t('house.servicesTitle')}</h2><ul class="svc">${C.HOUSE.services.map((s) => `<li>${icon(s.icon)}<span>${esc(L(s))}</span></li>`).join('')}</ul></div>
  <div class="rv card-s"><h3>${t('house.rulesTitle')}</h3><ul class="rules">
    <li>${icon('clock')}<span>${t('house.checkInOut', { in: todo('policies.checkIn', pol.checkIn), out: todo('policies.checkOut', pol.checkOut) })}</span></li>
    ${L(pol.houseRules).map((r) => `<li>${icon('check')}<span>${todo('policies.houseRules', esc(r))}</span></li>`).join('')}
  </ul><p class="hint">${esc(L(C.TEXT.insiders))}</p></div>
</div></section>${finalCta()}`;
}

function rooms() {
  const f = rooms.f || (rooms.f = { guests: 0, view: '', bed: '', outdoor: '' });
  const list = R().rooms.filter((r) => r.active).filter((r) => (!f.guests || r.capacity >= f.guests) && (!f.view || r.view === f.view) && (!f.bed || r.beds === f.bed) && (!f.outdoor || (f.outdoor === 'yes' ? ['balcony', 'terrace', 'garden-terrace'].includes(r.outdoor) : true)));
  const opt = (k, v, label) => `<option value="${v}" ${f[k] === v ? 'selected' : ''}>${label}</option>`;
  return `${pageHero(t('nav.rooms'), t('rooms.title'), t('rooms.sub'))}
<section class="sec tight"><div class="wrap">
  <form class="filters" id="filters" aria-label="${t('rooms.filters')}">
    <label class="fl">${t('s.guests')}<select class="inp" name="guests">${opt('guests', 0, t('all'))}${opt('guests', 1, '1')}${opt('guests', 2, '2')}${opt('guests', 3, '3')}</select></label>
    <label class="fl">${t('rooms.view')}<select class="inp" name="view">${opt('view', '', t('all'))}${['sea', 'garden', 'city'].map((v) => opt('view', v, viewLabel(v))).join('')}</select></label>
    <label class="fl">${t('rooms.bed')}<select class="inp" name="bed">${opt('bed', '', t('all'))}${Object.keys(C.BED_LABEL).map((b) => opt('bed', b, L(C.BED_LABEL[b]))).join('')}</select></label>
    <label class="fl">${t('rooms.outdoor')}<select class="inp" name="outdoor">${opt('outdoor', '', t('all'))}${opt('outdoor', 'yes', t('rooms.outdoorYes'))}</select></label>
    <p class="count" aria-live="polite">${t('rooms.count', { n: list.length })}</p>
  </form>
  <div class="rgrid">${list.map((r) => roomCard(r)).join('') || `<p class="empty">${t('rooms.none')}</p>`}</div>
</div></section>`;
}

function roomPage(slug) {
  const r = roomOf(slug);
  if (!r || !r.active) return `<section class="sec"><div class="wrap"><p class="empty">${t('room.notFound')}</p><a class="btn ghost" href="${href('chambres')}">${t('nav.rooms')}</a></div></section>`;
  const okDates = search.from && search.to;
  const err = okDates ? checkStay({ room: slug, from: search.from, to: search.to, adults: search.adults, children: search.children }) : null;
  const q = okDates && !['err.room', 'err.dates'].includes(err) && fits(r, search) ? quote({ room: slug, from: search.from, to: search.to, adults: search.adults, children: search.children }) : null;
  const others = R().rooms.filter((x) => x.active && x.slug !== slug).slice(0, 3);
  return `<section class="rp-top"><div class="wrap">
  <nav class="crumbs" aria-label="${t('crumbs')}"><a href="${href('')}">${t('nav.home')}</a> / <a href="${href('chambres')}">${t('nav.rooms')}</a> / <span>${esc(r.name)}</span></nav>
  <div class="gal5">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="g${n}" data-lb="${n}" aria-label="${t('gal.open', { n })}">${img(`rooms/${r.slug}-${n}.jpg`, { ratio: n === 1 ? '3/2' : '3/2', alt: `${r.name} ${n}`, eager: n === 1 })}</button>`).join('')}</div>
</div></section>
<section class="sec tight"><div class="wrap rpage">
  <div class="rp-main">
    <p class="kick">${r.suite ? t('room.suite') : t('room.room')} · ${esc(L(r.decor))}</p>
    <h1 class="big">${esc(r.name)}</h1>
    <p class="lead">${esc(L(r.desc))}</p>
    <table class="ftable"><tbody>
      <tr><th>${t('room.floor')}</th><td>${esc(L(r.floor))}</td></tr>
      ${r.size || previewOn() ? `<tr><th>${t('room.size')}</th><td>${todo(`rooms.${r.slug}.size`, r.size ? `${r.size} m²` : t('tbc'))}</td></tr>` : ''}
      ${r.beds || previewOn() ? `<tr><th>${t('room.beds')}</th><td>${r.beds ? esc(L(C.BED_LABEL[r.beds])) : todo(`rooms.${r.slug}.bed`, t('tbc'))}</td></tr>` : ''}
      <tr><th>${t('room.capacity')}</th><td>${r.family ? t('room.capFamily') : t('room.upTo', { n: r.capacity })}</td></tr>
      <tr><th>${t('rooms.view')}</th><td>${viewLabel(r.view)}</td></tr>
      <tr><th>${t('room.decor')}</th><td>${esc(L(r.decor))}</td></tr>
    </tbody></table>
    <h2 class="h3">${t('room.highlights')}</h2>
    <ul class="hl">${L(r.highlights).map((h) => `<li>${icon('check')}${esc(h)}</li>`).join('')}</ul>
    <h2 class="h3">${t('room.amenities')}</h2>
    <ul class="amen">${r.amenities.map((a) => `<li>${icon(C.AMENITIES[a]?.icon || 'check')}${esc(L(C.AMENITIES[a] || {}))}</li>`).join('')}</ul>
    <h2 class="h3">${t('room.availability')}</h2>
    <div class="avcal" id="avcal"></div>
    <p class="hint">${t('room.calHint')}</p>
  </div>
  <aside class="rp-side"><div class="bookbox">
    <p class="from"><span>${t('room.from')}</span> <b>${todo(`rooms.${r.slug}.price`, money(fromPrice(r)))}</b> <span>/ ${t('room.night')}</span></p>
    <p class="hint">${t('room.singleFrom', { p: todo(`rooms.${r.slug}.single`, money(r.single)) })}</p>
    ${searchBar(true)}
    ${q ? `<div class="bb-q">${breakdown(q, { compact: true })}</div>` : ''}
    ${err && okDates ? `<p class="err" role="alert">${errText(err, search.from)}</p>` : ''}
    <button type="button" class="btn sun block" id="bookRoom" ${okDates && !err ? '' : 'disabled'}>${t('room.bookThis')}</button>
    <p class="hint c">${icon('cup')} ${t('trust.breakfast')} · ${t('policy.cancelShort', { d: todo('policies.cancellationDays', R().settings.cancellationDays) })}</p>
  </div></aside>
</div></section>
<section class="sec alt"><div class="wrap">${secHead(t('room.others'), t('room.othersTitle'))}<div class="rgrid">${others.map((x) => roomCard(x)).join('')}</div></div></section>`;
}
function errText(err, from) { return t(err, { n: minStayFor(from || today()) }); }

function availCal(slug) {
  const box = $('#avcal'); if (!box) return;
  const busy = busyNights(slug);
  let start = (roomPage.view || today()).slice(0, 7);
  const draw = () => {
    const months = [0, 1].map((k) => { const d = new Date(+start.slice(0, 4), +start.slice(5, 7) - 1 + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
    const wk = [...Array(7)].map((_, i) => new Intl.DateTimeFormat(lang(), { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
    box.innerHTML = `<div class="av-nav"><button class="ib" data-m="-1" aria-label="${t('pick.prev')}" ${start <= today().slice(0, 7) ? 'disabled' : ''}>${icon('chevL')}</button><button class="ib" data-m="1" aria-label="${t('pick.next')}">${icon('chev')}</button></div>
<div class="av-ms">${months.map((ym) => {
    const first = new Date(+ym.slice(0, 4), +ym.slice(5) - 1, 1); const pad = (first.getDay() + 6) % 7; const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let cells = '<span></span>'.repeat(pad);
    for (let n = 1; n <= days; n++) { const d = `${ym}-${String(n).padStart(2, '0')}`; const past = d < today(); const st = busy[d]; const sel = search.from && search.to && d >= search.from && d < search.to; cells += `<span class="${past ? 'past' : st ? 'busy' : 'free'} ${sel ? 'sel' : ''}" title="${past ? '' : st ? t('pick.unavailable') : t('room.free')}">${n}</span>`; }
    return `<div><h3>${new Intl.DateTimeFormat(lang(), { month: 'long', year: 'numeric' }).format(first)}</h3><div class="av-w">${wk.map((x) => `<span>${x}</span>`).join('')}</div><div class="av-g">${cells}</div></div>`;
  }).join('')}</div><div class="av-leg"><span class="free">${t('room.free')}</span><span class="busy">${t('pick.unavailable')}</span><span class="sel">${t('room.yourDates')}</span></div>`;
  };
  box.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; const d = new Date(+start.slice(0, 4), +start.slice(5) - 1 + +b.dataset.m, 1); start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; roomPage.view = `${start}-01`; draw(); });
  draw();
}

function lightbox(files, i0) {
  let i = i0;
  const m = modal(`${dlgHead(`<span class="lb-n"></span>`)}<div class="lb"><button class="ib lb-p" aria-label="${t('pick.prev')}">${icon('chevL')}</button><div class="lb-img"></div><button class="ib lb-x" aria-label="${t('pick.next')}">${icon('chev')}</button></div>`, { wide: true, cls: 'lbox' });
  const draw = () => { const f = files[i]; m.el.querySelector('.lb-img').innerHTML = img(f.file, { ratio: f.ratio || '3/2', alt: f.alt, eager: true }); m.el.querySelector('.lb-n').textContent = `${i + 1} / ${files.length}`; };
  m.el.querySelector('.lb-p').addEventListener('click', () => { i = (i - 1 + files.length) % files.length; draw(); });
  m.el.querySelector('.lb-x').addEventListener('click', () => { i = (i + 1) % files.length; draw(); });
  m.el.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') m.el.querySelector('.lb-p').click(); if (e.key === 'ArrowRight') m.el.querySelector('.lb-x').click(); });
  draw();
}

function experiences() {
  return `${pageHero(t('nav.experiences'), t('exp.title'), esc(L(C.TEXT.notSchool)))}
<section class="sec tight"><div class="wrap">
  <p class="partner-note rv">${icon('handshake')}<span>${t('exp.partners')}</span></p>
  <div class="xgrid">${C.EXPERIENCES.map((e) => `<article class="xc rv">${img(e.img, { ratio: '4/3', alt: L(e)[0], cls: 'rounded' })}<div><h3>${icon(e.icon)}${esc(L(e)[0])}</h3><p>${esc(L(e)[1])}</p><p class="price">${t('exp.onRequest')}</p><button type="button" class="btn ghost sm" data-exp="${e.id}">${t('exp.request')}</button></div></article>`).join('')}</div>
  <p class="insiders rv">${icon('pin')}<span>${esc(L(C.TEXT.insiders))}</span></p>
</div></section>${finalCta()}`;
}
function expRequest(id) {
  const e = C.EXPERIENCES.find((x) => x.id === id);
  const m = modal(`${dlgHead(esc(L(e)[0]))}<form class="dlg-b f" id="xf">
  <p class="hint">${t('exp.formNote')}</p>
  <div class="row2"><label>${t('exp.date')}<input type="date" name="date" min="${today()}" required /></label><label>${t('exp.people')}<input type="number" name="people" min="1" max="20" value="2" required /></label></div>
  <div class="row2"><label>${t('form.name')}<input name="name" autocomplete="name" required /></label><label>${t('form.phoneOrEmail')}<input name="contact" required /></label></div>
  <label>${t('exp.ref')} <span class="hint">${t('optional')}</span><input name="ref" placeholder="CL-2026-…" /></label>
  <label>${t('form.notes')}<textarea name="notes"></textarea></label>
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
  <div class="err" hidden role="alert"></div>
  <button class="btn pri" type="submit">${t('exp.send')}</button></form>`);
  m.el.querySelector('#xf').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const f = ev.target; const d = Object.fromEntries(new FormData(f)); if (d.website) return;
    const rawRef = (d.ref || '').trim().toUpperCase();
    if (remote.live.on) {
      const btn = f.querySelector('[type=submit]'); btn.disabled = true;
      const r = await remote.publicRequest({ ref: rawRef, exp: id, date: d.date, people: +d.people, notes: d.notes, guestName: d.name, contact: d.contact, website: d.website });
      btn.disabled = false;
      if (!r.ok) { const er = f.querySelector('.err'); er.textContent = t(r.error); er.hidden = false; return; }
    } else {
      const ref = rawRef && bookingOf(rawRef) ? rawRef : null;
      addRequest({ ref, type: 'experience', exp: id, date: d.date, people: +d.people, notes: d.notes, guestName: d.name, contact: d.contact });
    }
    m.close(); toast(t('exp.sent'));
  });
}

function dakhla() {
  return `${pageHero(t('nav.dakhla'), t('dakhla.title'), esc(L(C.CLIMATE)), 'dakhla/lagoon.jpg')}
<section class="sec"><div class="wrap guide">${C.DAKHLA.map((d, i) => `<article class="gd rv ${i % 2 ? 'flip' : ''}">${img(d.img, { ratio: '16/9', alt: L(d)[0], cls: 'rounded' })}<div><p class="kick">0${i + 1}</p><h2>${esc(L(d)[0])}</h2><p class="lead">${esc(L(d)[1])}</p></div></article>`).join('')}</div></section>
<section class="sec alt"><div class="wrap">${secHead(t('dakhla.getKick'), t('dakhla.getTitle'))}
  <div class="get">${C.GETTING_HERE.map((g) => `<article class="rv">${icon(g.icon)}<h3>${esc(L(g)[0])}</h3><p>${esc(L(g)[1])}</p></article>`).join('')}</div>
  <div class="map rv"><div class="map-in">${icon('pin')}<p><b>${esc(R().settings.contact.address)}</b><br>${esc(L(C.CONTACT.addressNote))}</p><a class="btn pri" href="${R().settings.contact.maps}" target="_blank" rel="noopener">${t('f.map')}</a></div></div>
</div></section>${finalCta()}`;
}

function gallery() {
  const cat = gallery.cat || '';
  const items = C.GALLERY.filter((g) => !cat || g.cat === cat);
  return `${pageHero(t('nav.gallery'), t('gal.title'))}
<section class="sec tight"><div class="wrap">
  <div class="chips" role="group" aria-label="${t('gal.cats')}"><button class="chip ${!cat ? 'on' : ''}" data-cat="">${t('all')}</button>${Object.entries(C.GALLERY_CATS).map(([k, v]) => `<button class="chip ${cat === k ? 'on' : ''}" data-cat="${k}" aria-pressed="${cat === k}">${esc(L(v))}</button>`).join('')}</div>
  <div class="masonry">${items.map((g, i) => `<button type="button" class="mi" data-gi="${i}" aria-label="${t('gal.open', { n: i + 1 })}">${img(g.file, { ratio: g.ratio, alt: L(g.alt) })}</button>`).join('')}</div>
</div></section>`;
}

function reviews() {
  return `${pageHero(t('nav.reviews'), t('rev.title'), t('rev.sub'))}${reviewsBlock(true)}
<section class="sec tight"><div class="wrap c"><a class="btn pri" href="${R().reviews.google.url}" target="_blank" rel="noopener">${t('rev.leave')}</a></div></section>`;
}

function faq() {
  const s = R().settings;
  const v = { in: s.checkIn, out: s.checkOut, days: s.cancellationDays, deposit: s.depositPct };
  return `${pageHero(t('nav.faq'), t('faq.title'))}
<section class="sec tight"><div class="wrap narrow">
  <h2 class="h3">${t('faq.booking')}</h2>
  ${C.BOOKING_FAQ.map((f) => `<details class="rv"><summary>${esc(L(f)[0])}${icon('down')}</summary><p>${todo(`policies.${f.key === 'times' ? 'checkIn' : f.key === 'cancel' ? 'cancellationDays' : 'depositPct'}`, esc(fill(L(f)[1], v)))}</p></details>`).join('')}
  <h2 class="h3">${t('faq.travel')}</h2>
  ${C.FAQ.map((f) => `<details class="rv"><summary>${esc(L(f)[0])}${icon('down')}</summary><p>${esc(L(f)[1])}</p></details>`).join('')}
</div></section>${finalCta()}`;
}

function contact() {
  const c = R().settings.contact;
  return `${pageHero(t('nav.contact'), t('contact.title'), t('contact.sub'))}
<section class="sec tight"><div class="wrap two top">
  <form class="f card-s" id="cf" novalidate>
    <div class="row2"><label>${t('form.name')}<input name="name" autocomplete="name" required /></label><label>${t('form.email')}<input type="email" name="email" autocomplete="email" required /></label></div>
    <div class="row2"><label>${t('form.phone')}<input type="tel" name="phone" autocomplete="tel" placeholder="+34 …" /></label><label>${t('contact.dates')} <span class="hint">${t('optional')}</span><input name="dates" placeholder="${t('contact.datesPh')}" /></label></div>
    <label>${t('form.message')}<textarea name="message" required></textarea></label>
    <label>${esc(L(C.CONTACT_QUESTION.q))}<input name="q" required autocomplete="off" /></label>
    <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" />
    <div class="err" hidden role="alert"></div>
    <button class="btn pri" type="submit">${t('contact.send')}</button>
  </form>
  <div class="cinfo">
    <a class="ci" href="${waLink(L(C.TEXT.whatsappHello))}" target="_blank" rel="noopener">${icon('wa')}<span><b>WhatsApp</b>${esc(c.phone)}</span></a>
    <a class="ci" href="tel:${c.phone.replace(/[^+\d]/g, '')}">${icon('phone')}<span><b>${t('form.phone')}</b>${esc(c.phone)} · ${t('trust.reception')}</span></a>
    ${c.emails.map((e) => `<a class="ci" href="mailto:${e}">${icon('mail')}<span><b>${t('form.email')}</b>${e}</span></a>`).join('')}
    <a class="ci" href="${c.maps}" target="_blank" rel="noopener">${icon('pin')}<span><b>${esc(c.address)}</b>${esc(L(C.CONTACT.addressNote))}</span></a>
    <div class="map sm"><div class="map-in">${icon('pin')}<p>${t('contact.mapPh')}</p></div></div>
    <p class="hint">${t('contact.directions')}</p>
  </div>
</div></section>`;
}

function offers() {
  const r = R().rates;
  return `${pageHero(t('nav.offers'), t('offers.title'), t('offers.sub'))}
<section class="sec tight"><div class="wrap">
  <div class="offers">
    <article class="offer big rv"><p class="kick">${t('offers.remoteKick')}</p><h2>${todo('offers.longStay', t('offers.remoteTitle', { pct: r.longStay.pct, n: r.longStay.nights }))}</h2><p>${t('offers.remoteBody')}</p><ul class="hl"><li>${icon('wifi')}${t('offers.remote1')}</li><li>${icon('desk')}${t('offers.remote2')}</li><li>${icon('cup')}${t('trust.breakfast')}</li></ul><a class="btn sun" href="${href('reserver')}">${t('cta.check')}</a><p class="hint">${t('offers.auto')}</p></article>
    ${r.promoCodes.map((p) => `<article class="offer rv"><p class="kick">${t('offers.codeKick')}</p><h3>${todo('offers.promoCodes', `−${p.pct} %`)}</h3><p>${t('offers.codeBody')}</p><code class="code">${esc(p.code)}</code></article>`).join('')}
  </div>
  <p class="hint c">${t('offers.demo')}</p>
</div></section>`;
}

function legal(id) {
  const l = C.LEGAL[id] || C.LEGAL.mentions;
  return `${pageHero(t('legal.kick'), esc(L(l.title)))}<section class="sec tight"><div class="wrap narrow"><div class="card-s"><p class="todo-note">${icon('edit')}${t('legal.placeholder')}</p><p>${esc(L(l.body))}</p></div></div></section>`;
}

/* ---------- Booking engine ---------- */
function breakdown(q, { compact = false } = {}) {
  return `<dl class="bd">${q.lines.map((l) => {
    let label = t(l.key, { n: l.n, pct: l.pct, code: l.code });
    let val = l.key === 'q.breakfast' ? `<span class="incl">${t('q.included')}</span>` : money(l.amount);
    if (l.key === 'q.tax') val = todo('pricing.touristTax', val);
    if (l.key === 'q.nights') val = todo('rooms.*.price', val);
    return `<div><dt>${label}</dt><dd>${val}</dd></div>`;
  }).join('')}<div class="tot"><dt>${t('q.total')}</dt><dd>${money(q.total)}</dd></div></dl>${compact ? '' : `<details class="nightly"><summary>${t('q.perNight')}</summary><ul>${q.nights.map((n) => `<li><span>${fdShort(n.date)}</span><span>${money(n.price)}</span></li>`).join('')}</ul></details>`}`;
}

function book() {
  if (flow?.step && flow.step > 1) return bookFlow();
  const ok = search.from && search.to;
  const n = ok ? diffDays(search.from, search.to) : 0;
  const min = ok ? minStayFor(search.from) : 0;
  const tooShort = ok && n < min;
  let list = '';
  if (ok && !tooShort) {
    const rows = R().rooms.filter((r) => r.active).map((r) => ({ r, fit: fits(r, search), free: isFree(r.slug, search.from, search.to) }));
    const avail = rows.filter((x) => x.fit && x.free); const other = rows.filter((x) => !(x.fit && x.free));
    list = `<p class="count" aria-live="polite">${t('book.found', { n: avail.length })} · ${nightsLabel(n)} · ${partyLabel(search.adults, search.children, search.infants)}</p>
<div class="results">${avail.map(({ r }) => { const q = quote({ room: r.slug, from: search.from, to: search.to, adults: search.adults, children: search.children }); return resultRow(r, q, true); }).join('') || `<p class="empty">${t('book.none')}</p>`}</div>
${other.length ? `<h2 class="h3 mt">${t('book.unavailable')}</h2><div class="results dim">${other.map(({ r, fit }) => resultRow(r, null, false, fit ? t('book.taken') : t('book.tooSmall'))).join('')}</div>` : ''}`;
  }
  return `${pageHero(t('cta.book'), t('book.title'), t('book.sub'))}
<section class="sec tight"><div class="wrap">
  ${searchBar()}
  ${!ok ? `<p class="empty">${t('book.pickDates')}</p>` : ''}
  ${tooShort ? `<p class="err" role="alert">${t('err.minStay', { n: min })}</p>` : ''}
  ${list}
  <p class="hint c mt">${icon('cup')} ${t('trust.breakfast')} · ${t('policy.cancelShort', { d: todo('policies.cancellationDays', R().settings.cancellationDays) })} · ${t('book.direct')}</p>
</div></section>`;
}
function resultRow(r, q, available, why = '') {
  return `<article class="res">
  <a class="res-img" href="${href(`chambre/${r.slug}`)}">${img(`rooms/${r.slug}-1.jpg`, { ratio: '4/3', alt: r.name })}</a>
  <div class="res-b"><h3>${esc(r.name)}</h3><p class="mut">${esc(L(r.floor))}</p>
    <ul class="facts">${r.size ? `<li>${icon('size')}${r.size} m²</li>` : ''}${r.beds ? `<li>${icon('bed')}${esc(L(C.BED_LABEL[r.beds]))}</li>` : ''}<li>${icon('users')}${t('room.upTo', { n: r.capacity })}</li><li>${icon('cup')}${t('q.breakfast')}</li></ul></div>
  <div class="res-p">${available ? `<p class="tot">${todo('rooms.*.price', money(q.total))}</p><p class="hint">${t('book.totalFor', { n: q.nights.length })}${search.adults + search.children === 1 ? ` · ${t('book.single')}` : ''}</p><button type="button" class="btn sun" data-pick="${r.slug}">${t('book.choose')}</button>` : `<p class="why">${why}</p><a class="link" href="${href(`chambre/${r.slug}`)}">${t('room.see')}</a>`}</div>
</article>`;
}

function startFlow(slug) {
  flow = { step: 2, room: slug, extras: { transfer: 0, lateCheckout: false, experiences: [], occasion: '' }, promo: '', guest: { first: '', last: '', email: '', phone: '', dial: '+34', country: '', arrivalTime: '', notes: '' }, account: false, password: '', payMode: R().settings.payOnArrival ? 'deposit' : 'deposit', terms: false };
  if (location.hash !== '#/reserver') location.hash = '#/reserver'; else route();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
const flowQuote = () => quote({ room: flow.room, from: search.from, to: search.to, adults: search.adults, children: search.children, promo: flow.promo, transfer: flow.extras.transfer, lateCheckout: flow.extras.lateCheckout });

function bookFlow() {
  if (flow.step === 6) return confirmation();
  const r = roomOf(flow.room); const q = flowQuote(); const s = R().settings;
  const steps = [t('fl.dates'), t('fl.extras'), t('fl.details'), t('fl.payment'), t('fl.done')];
  const body = { 2: stepExtras, 3: stepDetails, 4: stepPay }[flow.step]();
  return `<section class="sec tight flow"><div class="wrap">
  <ol class="steps" aria-label="${t('fl.progress')}">${steps.map((x, i) => `<li class="${i + 1 < flow.step ? 'done' : i + 1 === flow.step ? 'on' : ''}" ${i + 1 === flow.step ? 'aria-current="step"' : ''}><span>${i + 1 < flow.step ? icon('check') : i + 1}</span>${x}</li>`).join('')}</ol>
  <div class="flow-g">
    <div class="flow-main">${body}</div>
    <aside class="flow-sum"><div class="card-s sticky">
      ${img(`rooms/${r.slug}-1.jpg`, { ratio: '3/2', alt: r.name, cls: 'rounded' })}
      <h3>${esc(r.name)}</h3>
      <p class="mut">${fdLong(search.from)} → ${fdLong(search.to)}<br>${nightsLabel(q.nights.length)} · ${partyLabel(search.adults, search.children, search.infants)}</p>
      <button type="button" class="link" data-back1>${t('fl.change')}</button>
      ${breakdown(q)}
      ${flow.step >= 2 ? `<div class="promo"><label class="fl">${t('fl.promo')}<span class="promo-in"><input class="inp" id="promo" value="${esc(flow.promo)}" placeholder="BIENVENIDA10" /><button type="button" class="btn ghost sm" id="promoBtn">${t('fl.apply')}</button></span></label>${q.promoInvalid ? `<p class="err sm">${t('fl.promoBad')}</p>` : q.promo ? `<p class="ok-box sm">${t('fl.promoOk', { code: q.promo })}</p>` : ''}</div>` : ''}
      <ul class="pol"><li>${icon('clock')}${t('house.checkInOut', { in: todo('policies.checkIn', s.checkIn), out: todo('policies.checkOut', s.checkOut) })}</li><li>${icon('check')}${t('policy.cancel', { d: todo('policies.cancellationDays', s.cancellationDays), date: fd(addDays(search.from, -s.cancellationDays)) })}</li><li>${icon('cup')}${t('trust.breakfast')}</li></ul>
    </div></aside>
  </div>
</div></section>`;
}
function stepExtras() {
  const ex = flow.extras; const rr = R().rates.extras;
  return `<h1 class="h2">${t('fl.extrasTitle')}</h1>
<div class="ext card-s">
  <div class="ext-r"><div>${icon('plane')}<b>${t('fl.transfer')}</b><p class="hint">${t('fl.transferHint', { p: todo('extras.transfer', money(rr.transfer.price)) })}</p></div>
    <select class="inp" id="exTransfer"><option value="0" ${ex.transfer === 0 ? 'selected' : ''}>${t('fl.transfer0')}</option><option value="1" ${ex.transfer === 1 ? 'selected' : ''}>${t('fl.transfer1')}</option><option value="2" ${ex.transfer === 2 ? 'selected' : ''}>${t('fl.transfer2')}</option></select></div>
  <label class="ext-r chk"><input type="checkbox" id="exLate" ${ex.lateCheckout ? 'checked' : ''} /><div>${icon('clock')}<b>${t('fl.late', { until: rr.lateCheckout.until })}</b><p class="hint">${todo('extras.lateCheckout', money(rr.lateCheckout.price))} · ${t('fl.lateHint')}</p></div></label>
  <div class="ext-r col"><div>${icon('kite')}<b>${t('fl.exp')}</b><p class="hint">${t('fl.expHint')}</p></div>
    <div class="chips">${C.EXPERIENCES.map((e) => `<button type="button" class="chip ${ex.experiences.includes(e.id) ? 'on' : ''}" data-xp="${e.id}" aria-pressed="${ex.experiences.includes(e.id)}">${esc(L(e)[0])}</button>`).join('')}</div></div>
  <label class="fl">${t('fl.occasion')}<input class="inp" id="exOcc" value="${esc(ex.occasion)}" placeholder="${t('fl.occasionPh')}" /></label>
</div>
<div class="flow-nav"><button type="button" class="btn ghost" data-back1>${icon('chevL')}${t('back')}</button><button type="button" class="btn sun" data-next>${t('next')}${icon('arrow')}</button></div>`;
}
const DIALS = [['+34', 'ES'], ['+33', 'FR'], ['+212', 'MA'], ['+49', 'DE'], ['+44', 'GB'], ['+39', 'IT'], ['+31', 'NL'], ['+32', 'BE'], ['+41', 'CH'], ['+351', 'PT'], ['+1', 'US'], ['+971', 'AE']];
function stepDetails() {
  const g = flow.guest;
  return `<h1 class="h2">${t('fl.detailsTitle')}</h1>
<form class="f card-s" id="df" novalidate>
  <div class="row2"><label>${t('form.first')}<input name="first" autocomplete="given-name" required value="${esc(g.first)}" /></label><label>${t('form.last')}<input name="last" autocomplete="family-name" required value="${esc(g.last)}" /></label></div>
  <div class="row2"><label>${t('form.email')}<input type="email" name="email" autocomplete="email" required value="${esc(g.email)}" /></label>
  <label>${t('form.whatsapp')}<span class="tel"><select name="dial" class="inp" aria-label="${t('form.dial')}">${DIALS.map(([d, cc]) => `<option value="${d}" ${g.dial === d ? 'selected' : ''}>${cc} ${d}</option>`).join('')}</select><input type="tel" name="phone" autocomplete="tel-national" required value="${esc(g.phone)}" /></span></label></div>
  <div class="row2"><label>${t('form.country')}<select name="country" required><option value="">—</option>${['ES', 'FR', 'MA', 'DE', 'GB', 'IT', 'NL', 'BE', 'CH', 'PT', 'US', 'OTHER'].map((cc) => `<option value="${cc}" ${g.country === cc ? 'selected' : ''}>${cc === 'OTHER' ? t('form.other') : new Intl.DisplayNames([lang()], { type: 'region' }).of(cc)}</option>`).join('')}</select></label>
  <label>${t('form.arrival')}<select name="arrivalTime"><option value="">${t('form.unknown')}</option>${['12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00+'].map((h) => `<option ${g.arrivalTime === h ? 'selected' : ''}>${h}</option>`).join('')}</select></label></div>
  <label>${t('form.notes')} <span class="hint">${t('optional')}</span><textarea name="notes" placeholder="${t('form.notesPh')}">${esc(g.notes)}</textarea></label>
  <label class="chk"><input type="checkbox" name="account" ${flow.account ? 'checked' : ''} /><span>${t('fl.account')}</span></label>
  <label class="pw" ${flow.account ? '' : 'hidden'}>${t('form.password')}<input type="password" name="password" minlength="6" autocomplete="new-password" /></label>
  <div class="err" hidden role="alert"></div>
</form>
<div class="flow-nav"><button type="button" class="btn ghost" data-prev>${icon('chevL')}${t('back')}</button><button type="button" class="btn sun" data-next>${t('next')}${icon('arrow')}</button></div>`;
}
function stepPay() {
  const q = flowQuote(); const s = R().settings;
  return `<h1 class="h2">${t('fl.payTitle')}</h1>
<div class="card-s pay">
  <fieldset class="paym"><legend class="sr">${t('fl.payTitle')}</legend>
    <label class="pm ${flow.payMode === 'deposit' ? 'on' : ''}"><input type="radio" name="pm" value="deposit" ${flow.payMode === 'deposit' ? 'checked' : ''} /><span><b>${t('fl.payDeposit', { pct: todo('policies.depositPct', s.depositPct) })}</b><em>${money(q.deposit)} ${t('fl.now')} · ${money(q.total - q.deposit)} ${t('fl.atHouse')}</em></span></label>
    ${s.payOnArrival ? `<label class="pm ${flow.payMode === 'arrival' ? 'on' : ''}"><input type="radio" name="pm" value="arrival" ${flow.payMode === 'arrival' ? 'checked' : ''} /><span><b>${todo('policies.payOnArrival', t('fl.payArrival'))}</b><em>${money(q.total)} ${t('fl.atHouse')}</em></span></label>` : ''}
  </fieldset>
  <form class="f card" id="pf" ${flow.payMode === 'deposit' ? '' : 'hidden'} autocomplete="off">
    <p class="demo-note">${icon('lock')}${t('fl.cardDemo')}</p>
    <label>${t('fl.cardName')}<input name="cn" value="${esc(`${flow.guest.first} ${flow.guest.last}`.trim())}" required /></label>
    <label>${t('fl.cardNo')}<input name="no" inputmode="numeric" placeholder="4242 4242 4242 4242" required /></label>
    <div class="row2"><label>${t('fl.cardExp')}<input name="exp" placeholder="MM/YY" inputmode="numeric" required /></label><label>CVC<input name="cvc" inputmode="numeric" placeholder="123" required /></label></div>
    <p class="hint">${t('fl.cardTest')}</p>
  </form>
  <label class="chk"><input type="checkbox" id="terms" ${flow.terms ? 'checked' : ''} /><span>${t('fl.terms', { link: `<a href="${href('legal/terms')}" target="_blank">${L(C.LEGAL.terms.title)}</a>` })}</span></label>
  <div class="err" id="payErr" hidden role="alert"></div>
</div>
<div class="flow-nav"><button type="button" class="btn ghost" data-prev>${icon('chevL')}${t('back')}</button><button type="button" class="btn sun" id="payBtn">${flow.payMode === 'deposit' ? t('fl.payNow', { p: money(q.deposit) }) : t('fl.confirm')}</button></div>`;
}
function confirmation() {
  const b = bookingOf(flow.ref); if (!b) { flow = null; return book(); }
  const r = roomOf(b.room); const g = guestOf(b.guestId); const c = R().settings.contact;
  const waText = t('conf.waText', { ref: b.ref, room: r.name, from: fd(b.from), to: fd(b.to), name: g.first });
  return `<section class="sec tight"><div class="wrap narrow conf">
  <div class="conf-ok">${icon('check')}</div>
  <p class="kick c">${t('conf.kick')}</p>
  <h1 class="big c">${t('conf.title', { name: esc(g.first) })}</h1>
  <p class="lead c">${t('conf.sub')}</p>
  <div class="ref-box"><span>${t('conf.ref')}</span><b>${b.ref}</b></div>
  <div class="card-s"><h2 class="h3">${esc(r.name)}</h2><p class="mut">${fdLong(b.from)} → ${fdLong(b.to)} · ${nightsLabel(b.quote.nights.length)} · ${partyLabel(b.adults, b.children, b.infants)}</p>${breakdown(b.quote, { compact: true })}
  <p class="paid">${t('conf.paid')}: <b>${money(R().payments.filter((p) => p.ref === b.ref).reduce((a, p) => a + p.amount, 0))}</b> · ${t('conf.balance')}: <b>${money(b.total - R().payments.filter((p) => p.ref === b.ref).reduce((a, p) => a + p.amount, 0))}</b></p></div>
  <div class="conf-act">
    <button type="button" class="btn pri" id="ics">${icon('cal')}${t('conf.ics')}</button>
    <a class="btn ghost" href="${c.maps}" target="_blank" rel="noopener">${icon('pin')}${t('conf.directions')}</a>
    <a class="btn wa" href="${waLink(waText)}" target="_blank" rel="noopener">${icon('wa')}${t('conf.wa')}</a>
    <a class="btn ghost" href="guest.html#ref=${b.ref}">${icon('user')}${t('conf.portal')}</a>
  </div>
  <details class="mail-prev" open><summary>${icon('mail')}${t('conf.emailPrev')}</summary>
    <div class="mail"><p class="mail-h"><b>${t('conf.mailFrom')}</b> Casa Lola · Kite House Dakhla &lt;${c.emails[0]}&gt;<br><b>${t('conf.mailTo')}</b> ${esc(g.email)}<br><b>${t('conf.mailSubj')}</b> ${t('conf.mailSubject', { ref: b.ref })}</p>
    <p>${t('conf.mailBody', { name: esc(g.first), room: esc(r.name), from: fdLong(b.from), to: fdLong(b.to), in: R().settings.checkIn, out: R().settings.checkOut })}</p><p>${t('conf.mailSign')}</p></div>
  </details>
  <p class="c"><button type="button" class="link" id="again">${t('conf.another')}</button></p>
</div></section>`;
}

/* ---------- Bindings ---------- */
const bind = {
  '': () => {},
  chambres: () => { $('#filters')?.addEventListener('change', (e) => { const f = rooms.f; const v = e.target.value; f[e.target.name] = e.target.name === 'guests' ? +v : v; route(); }); },
  chambre: (slug) => {
    availCal(slug);
    const r = roomOf(slug); if (!r) return;
    $$('[data-lb]').forEach((b) => b.addEventListener('click', () => lightbox([1, 2, 3, 4, 5].map((n) => ({ file: `rooms/${slug}-${n}.jpg`, alt: `${r.name} ${n}` })), +b.dataset.lb - 1)));
    $('#bookRoom')?.addEventListener('click', () => startFlow(slug));
  },
  experiences: () => { $$('[data-exp]').forEach((b) => b.addEventListener('click', () => expRequest(b.dataset.exp))); },
  galerie: () => {
    $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { gallery.cat = b.dataset.cat; route(); }));
    const items = C.GALLERY.filter((g) => !gallery.cat || g.cat === gallery.cat).map((g) => ({ file: g.file, ratio: g.ratio, alt: L(g.alt) }));
    $$('[data-gi]').forEach((b) => b.addEventListener('click', () => lightbox(items, +b.dataset.gi)));
  },
  contact: () => {
    $('#cf').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const d = Object.fromEntries(new FormData(f)); const er = $('.err', f);
      if (d.company) return;
      if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email) || !d.message) { er.textContent = t('err.form'); er.hidden = false; return; }
      if (d.q.trim().toLowerCase() !== C.CONTACT_QUESTION.answer) { er.textContent = t('contact.qWrong'); er.hidden = false; return; }
      const msg = { name: d.name, email: d.email, phone: d.phone, subject: d.dates ? `${t('contact.dates')}: ${d.dates}` : t('contact.subject'), text: d.message };
      if (remote.live.on) {
        const btn = f.querySelector('[type=submit]'); btn.disabled = true;
        const r = await remote.publicContact(msg);
        btn.disabled = false;
        if (!r.ok) { er.textContent = t(r.error); er.hidden = false; return; }
      } else addMessage({ thread: `contact-${Date.now()}`, from: 'guest', ...msg });
      f.reset(); er.hidden = true; toast(t('contact.sent'));
    });
  },
  reserver: () => {
    $$('[data-pick]').forEach((b) => b.addEventListener('click', () => startFlow(b.dataset.pick)));
    if (!flow?.step) return;
    $$('[data-back1]').forEach((b) => b.addEventListener('click', () => { flow.step = 1; route(); }));
    $$('[data-prev]').forEach((b) => b.addEventListener('click', () => { if (flow.step === 3) saveDetails(); flow.step--; route(); }));
    const pb = $('#promoBtn'); pb?.addEventListener('click', () => { flow.promo = $('#promo').value.trim(); route(); });
    $('#promo')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pb.click(); } });
    if (flow.step === 2) {
      $('#exTransfer').addEventListener('change', (e) => { flow.extras.transfer = +e.target.value; route(); });
      $('#exLate').addEventListener('change', (e) => { flow.extras.lateCheckout = e.target.checked; route(); });
      $('#exOcc').addEventListener('input', (e) => { flow.extras.occasion = e.target.value; });
      $$('[data-xp]').forEach((b) => b.addEventListener('click', () => { const x = flow.extras.experiences; const i = x.indexOf(b.dataset.xp); i < 0 ? x.push(b.dataset.xp) : x.splice(i, 1); route(); }));
      $('[data-next]').addEventListener('click', () => { flow.step = 3; route(); window.scrollTo({ top: 0 }); });
    }
    if (flow.step === 3) {
      const f = $('#df');
      f.account.addEventListener('change', () => { flow.account = f.account.checked; $('.pw', f).hidden = !flow.account; });
      $('[data-next]').addEventListener('click', () => {
        saveDetails(); const g = flow.guest; const er = $('.err', f);
        const bad = !g.first || !g.last || !/^\S+@\S+\.\S+$/.test(g.email) || g.phone.replace(/\D/g, '').length < 6 || !g.country || (flow.account && (f.password.value || '').length < 6);
        if (bad) { er.textContent = t('err.form'); er.hidden = false; f.querySelector(':invalid, input:placeholder-shown')?.focus(); return; }
        flow.password = f.password.value; flow.step = 4; route(); window.scrollTo({ top: 0 });
      });
    }
    if (flow.step === 4) {
      $$('input[name=pm]').forEach((x) => x.addEventListener('change', () => { flow.payMode = x.value; route(); }));
      $('#terms').addEventListener('change', (e) => { flow.terms = e.target.checked; });
      $('#payBtn').addEventListener('click', pay);
    }
    if (flow.step === 6) {
      $('#ics')?.addEventListener('click', () => { const b = bookingOf(flow.ref); download(`${b.ref}.ics`, icsFor(b, roomName(b.room)), 'text/calendar'); toast(t('conf.icsDone')); });
      $('#again')?.addEventListener('click', () => { flow = null; route(); });
    }
  },
};
function saveDetails() {
  const f = $('#df'); if (!f) return;
  const d = Object.fromEntries(new FormData(f));
  Object.assign(flow.guest, { first: d.first.trim(), last: d.last.trim(), email: d.email.trim(), phone: d.phone.trim(), dial: d.dial, country: d.country, arrivalTime: d.arrivalTime, notes: d.notes });
}
async function pay() {
  const er = $('#payErr'); er.hidden = true;
  if (!flow.terms) { er.textContent = t('fl.termsErr'); er.hidden = false; return; }
  const q = flowQuote();
  if (flow.payMode === 'deposit') {
    const f = $('#pf'); const no = f.no.value.replace(/\s/g, '');
    if (!f.cn.value || no.length < 12 || !/^\d{2}\/\d{2}$/.test(f.exp.value.trim()) || f.cvc.value.length < 3) { er.textContent = t('fl.cardErr'); er.hidden = false; return; }
    const btn = $('#payBtn'); btn.disabled = true; btn.textContent = t('fl.processing');
    await new Promise((res) => setTimeout(res, 900));
    if (no === '4000000000000002') { btn.disabled = false; btn.textContent = t('fl.payNow', { p: money(q.deposit) }); er.textContent = t('fl.declined'); er.hidden = false; return; }
  }
  const g = flow.guest;
  const pwHash = flow.account && flow.password ? await hashPw(flow.password) : undefined;
  const btn = $('#payBtn'); btn.disabled = true; btn.textContent = t('fl.processing');
  const payload = {
    room: flow.room, from: search.from, to: search.to, adults: search.adults, children: search.children, childAges: search.childAges, infants: search.infants,
    promo: flow.promo, extras: flow.extras, source: 'direct', payMode: flow.payMode, payNow: flow.payMode === 'deposit' ? q.deposit : 0, arrivalTime: g.arrivalTime,
    notes: [g.notes, flow.extras.occasion && `${t('fl.occasion')}: ${flow.extras.occasion}`].filter(Boolean).join('\n'),
    guest: { first: g.first, last: g.last, email: g.email, phone: `${g.dial} ${g.phone}`, country: g.country === 'OTHER' ? '' : g.country, lang: lang(), pwHash }, status: 'confirmed', by: 'guest',
  };
  const res = remote.live.on ? await remote.book(payload) : createBooking(payload);
  if (!res.ok) { er.textContent = errText(res.error, search.from); er.hidden = false; btn.disabled = false; btn.textContent = flow.payMode === 'deposit' ? t('fl.payNow', { p: money(q.deposit) }) : t('fl.confirm'); return; }
  flow.ref = res.booking.ref; flow.step = 6; route(); window.scrollTo({ top: 0 });
}
function bindCommon() { bindSearch(app); }

/* ---------- Start ---------- */
// Live mode when the API answers (shared data for every visitor and the dashboard), local demo otherwise.
if (await remote.bootPublic()) remote.watchPublic();
chrome();
route();
onScroll();
