import { Pool } from 'pg';

// One shared connection pool (survives hot reloads in dev).
const globalForPg = globalThis;
export const pool =
  globalForPg.__negotiaPool ||
  new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== 'production') globalForPg.__negotiaPool = pool;

export function query(text, params) {
  return pool.query(text, params);
}
