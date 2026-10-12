import { query } from './db';

// Records who did what. Never blocks the request if logging fails.
export async function audit(actor, action, { companyId = null, target = null, meta = null } = {}) {
  try {
    await query(
      'insert into audit_log (actor_id, actor_email, company_id, action, target, meta) values ($1, $2, $3, $4, $5, $6)',
      [actor?.id || null, actor?.email || null, companyId, action, target, meta ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    console.error('[audit] failed:', err.message);
  }
}
