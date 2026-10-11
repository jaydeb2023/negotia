// Creates the tables (safe to run more than once).   npm run db:init
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  console.log('Database tables are ready.');
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
