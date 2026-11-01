'use strict';
process.env.TZ = 'UTC'; // timestamps are stored and compared in UTC; Morocco dates are derived explicitly
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // Vercel: real client IP for rate limiting
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use('/api', express.json({ limit: '1mb' })); // the dashboard saves the whole guest-house document
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false, message: { ok: false, error: 'Trop de requêtes, réessayez dans une minute.' } }));
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', require('./routes'));

app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Introuvable.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Requête invalide.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ ok: false, error: 'Données trop volumineuses.' });
  console.error('[app]', err);
  res.status(500).json({ ok: false, error: 'Erreur serveur, réessayez.' });
});

module.exports = app;
