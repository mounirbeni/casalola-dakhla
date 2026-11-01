'use strict';
/**
 * Tiny PostgreSQL layer with the same calling style the code was written for:
 *   db.$queryRaw`SELECT … WHERE id = ${id}`      → rows
 *   db.$executeRaw`UPDATE …`                      → number of rows changed
 *   db.$queryRawUnsafe(text, ...values)           → rows
 *   db.$transaction(async (tx) => { … })          → BEGIN / COMMIT / ROLLBACK on one connection
 * Tagged templates are always sent as parameters ($1, $2 …): no string concatenation of values.
 */
const { Pool, types } = require('pg');

types.setTypeParser(1082, (v) => v); // DATE → 'YYYY-MM-DD' (no time-zone shifting)

let pool = null;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_SIZE || 3), // serverless: keep it small
      idleTimeoutMillis: 10000,
      ssl: /sslmode=disable|localhost|127\.0\.0\.1|host=\//.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
    });
    pool.on('error', (e) => console.error('[db] idle client error', e.message));
  }
  return pool;
}

function sql(strings, values) {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
  return { text, values };
}

function api(run) {
  return {
    $queryRaw: async (strings, ...values) => (await run(sql(strings, values))).rows,
    $executeRaw: async (strings, ...values) => (await run(sql(strings, values))).rowCount,
    $queryRawUnsafe: async (text, ...values) => (await run({ text, values })).rows,
    $executeRawUnsafe: async (text, ...values) => (await run({ text, values })).rowCount,
  };
}

const db = {
  ...api((q) => getPool().query(q)),
  async $transaction(fn) {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const out = await fn(api((q) => client.query(q)));
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally { client.release(); }
  },
  async end() { if (pool) { await pool.end(); pool = null; } },
};

module.exports = db;
