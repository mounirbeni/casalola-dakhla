// `npm run migrate` — creates / updates the tables (also done automatically on first request).
require('dotenv').config();
const db = require('./db');
(async () => {
  for (const sql of require('./schema')) await db.$executeRawUnsafe(sql);
  console.log('Schéma à jour.');
  await db.end();
})().catch(async (e) => { console.error(e); await db.end(); process.exit(1); });
