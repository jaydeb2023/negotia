import { query, pool } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireSuper } from '../../../../lib/auth';
import { seatUsage } from '../../../../lib/invites';
import { audit } from '../../../../lib/audit';
import { int, isUuid, str } from '../../../../lib/util';

async function loadCompany(id) {
  if (!isUuid(id)) fail(404, 'Not found');
  const { rows } = await query('select * from companies where id = $1', [id]);
  if (!rows[0]) fail(404, 'Not found');
  return rows[0];
}

export default route({
  GET: async (req, res) => {
    await requireSuper(req, res);
    const company = await loadCompany(req.query.id);
    const [admins, seats, stats, log] = await Promise.all([
      query(
        `select id, email, full_name, status, last_login_at from users
          where company_id = $1 and role = 'company_admin' order by created_at`,
        [company.id]
      ),
      seatUsage(company.id),
      query(
        `select
           (select count(*)::int from sessions where company_id = $1) as calls_total,
           (select count(*)::int from sessions where company_id = $1 and created_at > now() - interval '7 days') as calls_7d,
           (select round(avg(behaviour_score)::numeric, 1) from sessions where company_id = $1 and outcome <> 'incomplete') as avg_score`,
        [company.id]
      ),
      query(
        `select actor_email, action, target, created_at from audit_log
          where company_id = $1 order by created_at desc limit 15`,
        [company.id]
      ),
    ]);
    res.status(200).json({ company, admins: admins.rows, seats, stats: stats.rows[0], log: log.rows });
  },

  PATCH: async (req, res) => {
    const user = await requireSuper(req, res);
    const company = await loadCompany(req.query.id);
    const b = req.body || {};
    const changes = {};

    if (b.name !== undefined) {
      const name = str(b.name, 160);
      if (!name) fail(400, 'Company name cannot be empty.');
      changes.name = name;
    }
    if (b.status !== undefined) {
      if (!['active', 'suspended'].includes(b.status)) fail(400, 'Invalid status.');
      changes.status = b.status;
    }
    if (b.seat_limit !== undefined) {
      const seats = await seatUsage(company.id);
      const limit = int(b.seat_limit, 1, 100000, company.seat_limit);
      if (limit < seats.used) fail(409, `${seats.used} seats are already in use. Choose ${seats.used} or more.`);
      changes.seat_limit = limit;
    }
    for (const k of ['contact_name', 'contact_email', 'contact_phone', 'notes']) {
      if (b[k] !== undefined) changes[k] = str(b[k], k === 'notes' ? 2000 : 254) || null;
    }

    const keys = Object.keys(changes);
    if (keys.length) {
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await query(`update companies set ${sets} where id = $1`, [company.id, ...keys.map((k) => changes[k])]);
      await audit(user, changes.status ? `company.${changes.status === 'suspended' ? 'suspend' : 'activate'}` : 'company.update', {
        companyId: company.id,
        target: company.name,
        meta: changes,
      });
    }
    res.status(200).json({ ok: true });
  },

  // Deleting needs the company name typed as confirmation. People keep their accounts as individuals.
  DELETE: async (req, res) => {
    const user = await requireSuper(req, res);
    const company = await loadCompany(req.query.id);
    if (str(req.body?.confirmName, 160) !== company.name) fail(400, 'Type the company name exactly to confirm.');

    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(
        "update users set role = 'individual', company_id = null where company_id = $1 and role in ('employee', 'company_admin')",
        [company.id]
      );
      await client.query('delete from companies where id = $1', [company.id]);
      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
    await audit(user, 'company.delete', { target: company.name });
    res.status(200).json({ ok: true });
  },
});
