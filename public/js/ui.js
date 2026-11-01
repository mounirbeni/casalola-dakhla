/* Casa Lola — shared UI helpers for the site, the guest portal and the admin. */
import { DICT } from './i18n.js';
import { PHOTOS, TODO_CONFIRM, LANGS } from './config.js';
import { db, parse, iso, addDays, today, diffDays } from './store.js';

/* ---------- Language & currency ---------- */
const LKEY = 'cl-lang';
const CKEY = 'cl-cur';
const LOCALE = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES' };
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
const qsLang = new URLSearchParams(location.search).get('lang');
let LANG = (qsLang && LANGS[qsLang] ? qsLang : store.get(LKEY)) || 'fr';
if (!LANGS[LANG]) LANG = 'fr';
let CUR = store.get(CKEY) === 'MAD' ? 'MAD' : 'EUR';
const IDX = { fr: 0, en: 1, es: 2 };

export const lang = () => LANG;
export const cur = () => CUR;
export function setLang(l) { LANG = l; store.set(LKEY, l); document.documentElement.lang = l; }
export function setCur(c) { CUR = c; store.set(CKEY, c); }
document.documentElement.lang = LANG;

/** UI string. Vars: t('k', { n: 3 }) replaces {n}. */
export function t(key, vars) {
  const e = DICT[key];
  let s = e ? e[IDX[LANG]] : key;
  if (!e && typeof console !== 'undefined') console.warn('[i18n] missing', key);
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
/** Content field from config: { fr, en, es } → current language. Arrays/strings pass through. */
export const L = (o) => (o == null ? '' : typeof o === 'object' && !Array.isArray(o) ? (o[LANG] ?? o.fr ?? '') : o);

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Formatting ---------- */
export function money(eur, opts = {}) {
  const v = CUR === 'MAD' ? eur * db.s.rates.eurToMad : eur;
  const frac = Math.abs(v % 1) > 0.001 && CUR === 'EUR' ? 2 : 0;
  return new Intl.NumberFormat(LOCALE[LANG], { style: 'currency', currency: CUR, maximumFractionDigits: frac, minimumFractionDigits: frac, ...opts }).format(CUR === 'MAD' ? Math.round(v) : v);
}
export const fd = (s, o = { day: 'numeric', month: 'short', year: 'numeric' }) => (s ? new Intl.DateTimeFormat(LOCALE[LANG], o).format(parse(s.slice(0, 10))) : '—');
export const fdShort = (s) => fd(s, { day: 'numeric', month: 'short' });
export const fdLong = (s) => fd(s, { weekday: 'long', day: 'numeric', month: 'long' });
export const ftime = (stamp) => new Intl.DateTimeFormat(LOCALE[LANG], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(stamp));
export const num = (n, d = 0) => new Intl.NumberFormat(LOCALE[LANG], { maximumFractionDigits: d }).format(n);

/* ---------- TODO_CONFIRM (preview mode) ---------- */
export function isTodo(path) {
  return TODO_CONFIRM.some((p) => p === path || (p.includes('*') && new RegExp(`^${p.replace(/\./g, '\\.').replace('*', '[^.]+')}$`).test(path)) || path.startsWith(`${p}.`));
}
/** Wrap a value that may be a placeholder. Visible styling only when <html class="preview">. */
export const todo = (path, html) => (isTodo(path) ? `<span class="todo" data-todo="${esc(path)}" title="${esc(t('todo.tip'))}">${html}</span>` : html);
export const previewOn = () => store.get('cl-preview') === '1' || new URLSearchParams(location.search).has('preview');
export function setPreview(on) { store.set('cl-preview', on ? '1' : '0'); }

/* ---------- Images: named placeholder until the file is listed in PHOTOS ---------- */
export function img(file, { ratio = '3/2', alt = '', cls = '', eager = false, sizes = '100vw' } = {}) {
  const has = PHOTOS.includes(file);
  const inner = has
    ? `<img src="img/${esc(file)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" sizes="${sizes}" />`
    : `<span class="ph-in" aria-hidden="true">${icon('image')}<code>${esc(file)}</code></span>`;
  return `<figure class="ph ${has ? 'has' : ''} ${cls}" style="aspect-ratio:${ratio}" ${has ? '' : `role="img" aria-label="${esc(alt || file)}"`}>${inner}</figure>`;
}

/* ---------- Icons (24px stroke) ---------- */
const P = {
  wave: '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M7 9a5 5 0 0 1 10 0"/>',
  window: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15ZM5 19l7-7"/>',
  balcony: '<path d="M4 12h16M6 12v8M10 12v8M14 12v8M18 12v8M4 20h16M7 12V5h10v7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  desk: '<path d="M3 9h18M5 9v11M19 9v11M9 9v5h6V9M8 5h8v4H8z"/>',
  sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2v-5ZM5 18v2M19 18v2"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 17v4"/>',
  family: '<circle cx="8" cy="6" r="2.5"/><circle cx="16" cy="6" r="2.5"/><circle cx="12" cy="13" r="2"/><path d="M4 21v-5a4 4 0 0 1 8-2M20 21v-5a4 4 0 0 0-8-2M10 21v-3a2 2 0 0 1 4 0v3"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  cup: '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM17 10h1.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2M15 3v2M3 21h16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  camera: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3.5"/>',
  moto: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 10 9h4l4.5 7.5M14 9l-2-4H9M10 9l2 7.5"/>',
  car: '<path d="M3 16v-4l2-5h14l2 5v4H3ZM3 12h18"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  kite: '<path d="M14 3c4 0 7 3 7 7L9 21l-1-3L3 12 14 3Z"/><path d="M14 3 9 21M3 12l18-2"/>',
  boat: '<path d="M3 17h18l-2 4H5l-2-4ZM12 3v14M12 3l7 11h-7M12 6 6 14h6"/>',
  quad: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6M6 14l3-6h6l3 6M10 8V5h4"/>',
  camel: '<path d="M3 20v-6l2-4 3 2 2-4 2 1 2-3 3 1 2 3-2 2v8M8 20v-5M14 20v-5M18 20v-6"/>',
  fish: '<path d="M2 12s4-6 10-6c4 0 7 3 8 6-1 3-4 6-8 6-6 0-10-6-10-6ZM20 12l2-3v6l-2-3"/><circle cx="8" cy="11" r="1"/>',
  mask: '<path d="M3 9h18v5a3 3 0 0 1-3 3h-2.5l-1.5-2h-4L8.5 17H6a3 3 0 0 1-3-3V9ZM20 6v4"/>',
  lotus: '<path d="M12 20c-4 0-8-2-9-6 3-1 6 0 9 2 3-2 6-3 9-2-1 4-5 6-9 6ZM12 16c-2-2-3-5-2-9 1 1 2 2 2 3 0-1 1-2 2-3 1 4 0 7-2 9Z"/>',
  horse: '<path d="M6 21v-6l-3-1 2-5 5-5 2 1 4-1 3 4-2 3-3-1-2 3v8M14 21v-5"/>',
  city: '<path d="M3 21h18M5 21V9l4-2v14M9 21V5l6-2v18M15 21v-9l4 2v7"/>',
  plane: '<path d="M10.5 13 3 11l1-2 8 .5L16 4a2 2 0 0 1 3 3l-5.5 4 .5 8-2 1-2-7.5L7 15v3l-1.5 1-1-3.5L1 14.5 2 13h3l2.5-1.5"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 4 6.5"/>',
  bed: '<path d="M3 18V6M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="10" r="2"/>',
  size: '<path d="M4 4h6M4 4v6M4 4l6 6M20 20h-6M20 20v-6M20 20l-6-6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  print: '<path d="M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2M6 14h12v7H6z"/>',
  dl: '<path d="M12 3v12M6 10l6 6 6-6M4 21h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  tag: '<path d="M20 12 12 20l-9-9V3h8l9 9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  door: '<path d="M4 21h16M6 21V3h12v18M14 12h.01"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 20a2 2 0 0 0 4 0"/>',
  handshake: '<path d="m11 17 2 2a1.5 1.5 0 0 0 2-2M14 14l2.5 2.5a1.5 1.5 0 0 0 2-2L15 11l-3 1-2-2 4-4h3l4 4-2 2M3 7l4-1 4 4-4 4-4-4"/>',
  chat: '<path d="M4 5h16v11H8l-4 4V5Z"/>',
  broom: '<path d="M14 4 10 14M6 14h8l2 7H4l2-7ZM8 17v4M12 17v4"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15v-5M3 7h17v4"/><path d="M16 13h5v4h-5a2 2 0 0 1 0-4Z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  send: '<path d="M3 20.5V14l9-2-9-2V3.5L22 12z" fill="currentColor" stroke="none"/>',
  wa: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z"/>',
};
export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.image}</svg>`;

/* ---------- WhatsApp ---------- */
export const waLink = (text, number = db.s.settings.contact.whatsapp) => `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
export const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));

/* ---------- Toast ---------- */
export function toast(msg, kind = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.textContent = msg; el.className = `toast on ${kind}`;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.className = 'toast'; }, 3200);
}

/* ---------- Modal (native <dialog>) ---------- */
export function modal(html, { wide = false, cls = '', onClose } = {}) {
  const d = document.createElement('dialog');
  d.className = `dlg ${wide ? 'wide' : ''} ${cls}`;
  d.innerHTML = `<div class="dlg-in">${html}</div>`;
  document.body.appendChild(d);
  const close = () => { if (d.open) d.close(); };
  d.addEventListener('close', () => { d.remove(); document.documentElement.classList.remove('lock'); onClose?.(); });
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) close(); });
  document.documentElement.classList.add('lock');
  d.showModal();
  return { el: d, close };
}
export const dlgHead = (title) => `<div class="dlg-h"><h2>${title}</h2><button type="button" class="x" data-close aria-label="${esc(t('close'))}">${icon('x')}</button></div>`;

/* ---------- Files ---------- */
export function download(name, content, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
export function icsFor(b, roomName) {
  const s = db.s; const d = (x) => x.replace(/-/g, '');
  const [ih, im] = s.settings.checkIn.split(':'); const [oh, om] = s.settings.checkOut.split(':');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Casa Lola Kite House Dakhla//Demo//EN', 'BEGIN:VEVENT', `UID:${b.ref}@casalola-demo`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Africa/Casablanca:${d(b.from)}T${ih}${im}00`, `DTEND;TZID=Africa/Casablanca:${d(b.to)}T${oh}${om}00`,
    `SUMMARY:Casa Lola · Kite House Dakhla — ${roomName} (${b.ref})`, `LOCATION:${s.settings.contact.address.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${b.ref}\\n${s.settings.contact.phone}\\n${s.settings.contact.maps}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
export const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');

/* ---------- Date range picker ---------- */
/** opts: { from, to, minDate, busy: {date:'booked'|'closed'}, minNights, onApply(from,to) } */
export function rangePicker(opts) {
  let from = opts.from || null; let to = opts.to || null;
  const min = opts.minDate || today();
  let view = (from || min).slice(0, 7);
  const busy = opts.busy || {};
  const loc = LOCALE[LANG];
  const wk = [...Array(7)].map((_, i) => new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
  const m = modal(`${dlgHead(t('pick.title'))}<div class="rp" aria-live="polite"></div><div class="dlg-f"><span class="rp-sum"></span><button type="button" class="btn ghost sm" data-clear>${t('pick.clear')}</button><button type="button" class="btn pri" data-apply disabled>${t('pick.apply')}</button></div>`, { cls: 'rp-dlg' });
  const box = m.el.querySelector('.rp');
  const blocked = (a, b) => { for (let d = a; d < b; d = addDays(d, 1)) if (busy[d]) return true; return false; };
  function month(ym) {
    const first = parse(`${ym}-01`);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < pad; i++) cells += '<span></span>';
    for (let n = 1; n <= days; n++) {
      const d = `${ym}-${String(n).padStart(2, '0')}`;
      const off = d < min || (busy[d] && !from) || (from && !to && d > from && blocked(from, d)) || (from && !to && busy[d] && d <= from);
      const cl = [d === from && 'start', d === to && 'end', from && to && d > from && d < to && 'in', busy[d] && 'busy', d === today() && 'today'].filter(Boolean).join(' ');
      cells += `<button type="button" class="${cl}" data-d="${d}" ${off ? 'disabled' : ''} aria-pressed="${d === from || d === to}" aria-label="${fd(d, { weekday: 'long', day: 'numeric', month: 'long' })}${busy[d] ? ` — ${t('pick.unavailable')}` : ''}">${n}</button>`;
    }
    return `<div class="rp-m"><h3>${new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(first)}</h3><div class="rp-w">${wk.map((x) => `<span>${x}</span>`).join('')}</div><div class="rp-g">${cells}</div></div>`;
  }
  const nextYm = (ym, k) => { const d = parse(`${ym}-01`); d.setMonth(d.getMonth() + k); return iso(d).slice(0, 7); };
  function draw() {
    box.innerHTML = `<div class="rp-nav"><button type="button" class="ib" data-nav="-1" aria-label="${t('pick.prev')}" ${view <= min.slice(0, 7) ? 'disabled' : ''}>${icon('chevL')}</button><button type="button" class="ib" data-nav="1" aria-label="${t('pick.next')}">${icon('chev')}</button></div><div class="rp-ms">${month(view)}${month(nextYm(view, 1))}</div>`;
    const n = from && to ? diffDays(from, to) : 0;
    m.el.querySelector('.rp-sum').textContent = from && to ? `${fdShort(from)} → ${fdShort(to)} · ${t(n === 1 ? 'nights.one' : 'nights.many', { n })}` : from ? t('pick.chooseOut') : t('pick.chooseIn');
    m.el.querySelector('[data-apply]').disabled = !(from && to);
  }
  box.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]'); if (nav) { view = nextYm(view, +nav.dataset.nav); draw(); return; }
    const b = e.target.closest('[data-d]'); if (!b || b.disabled) return;
    const d = b.dataset.d;
    if (!from || to || d <= from) { from = d; to = null; } else to = d;
    draw();
  });
  m.el.querySelector('[data-clear]').addEventListener('click', () => { from = null; to = null; draw(); });
  m.el.querySelector('[data-apply]').addEventListener('click', () => { opts.onApply(from, to); m.close(); });
  draw();
  return m;
}

/* ---------- Small helpers ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const statusPill = (st) => `<span class="pill st-${st}">${t(`st.${st}`)}</span>`;
export const countryName = (cc) => { try { return new Intl.DisplayNames([LOCALE[LANG]], { type: 'region' }).of(cc); } catch { return cc; } };
export const nightsLabel = (n) => t(n === 1 ? 'nights.one' : 'nights.many', { n });
export const partyLabel = (a, c = 0, i = 0) => [t(a === 1 ? 'party.adult' : 'party.adults', { n: a }), c ? t(c === 1 ? 'party.child' : 'party.children', { n: c }) : '', i ? t(i === 1 ? 'party.infant' : 'party.infants', { n: i }) : ''].filter(Boolean).join(' · ');
