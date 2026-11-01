// Local development: `npm run dev` → http://localhost:3000 (static app + API, like on Vercel).
require('dotenv').config();
const path = require('path');
const express = require('express');
const app = require('./app');

const pub = path.join(__dirname, '..', 'public');
// same security headers as vercel.json, so local testing matches production
const rules = require('../vercel.json').headers.map((h) => ({ re: new RegExp(`^${h.source}$`), headers: h.headers }));
app.use((req, res, next) => { for (const r of rules) if (r.re.test(req.path)) for (const h of r.headers) res.setHeader(h.key, h.value); next(); });
app.get('/admin', (req, res) => res.sendFile(path.join(pub, 'admin.html')));
app.get('/guest', (req, res) => res.sendFile(path.join(pub, 'guest.html')));
app.use(express.static(pub, { extensions: ['html'] }));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Casa Lola → http://localhost:${port}  (dashboard : /admin · guest : /guest)`));
