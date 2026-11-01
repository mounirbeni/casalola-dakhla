const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('./controller');

const limiter = (name, windowMin, max, extra = {}) => rateLimit({
  windowMs: windowMin * 60 * 1000, max,
  standardHeaders: true, legacyHeaders: false, message: { ok: false, error: 'err.tooMany' }, ...extra,
});
const writeLimiter = limiter('write', 60, 30);                                       // bookings, requests, messages
const loginLimiter = limiter('login', 15, 10, { skipSuccessfulRequests: true });      // PIN / booking-ref guessing

// Public website
router.get('/public',   c.publicState);
router.post('/book',    writeLimiter, c.book);
router.post('/request', writeLimiter, c.request);
router.post('/contact', writeLimiter, c.contact);

// Guest portal
router.post('/guest/login',   loginLimiter, c.guestLogin);
router.post('/guest/account', loginLimiter, c.guestAccount);
router.get('/guest/state',    c.guestState);
router.post('/guest/op',      writeLimiter, c.guestOp);

// Owner / reception dashboard
router.post('/admin/login', loginLimiter, c.staffLogin);
router.get('/admin/state',  c.staffState);
router.put('/admin/state',  c.staffSave);
router.post('/admin/reset', c.staffReset);

module.exports = router;
