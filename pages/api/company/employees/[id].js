import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireCompanyContext } from '../../../../lib/companyCtx';
import { seatUsage } from '../../../../lib/invites';
import { audit } from '../../../../lib/audit';
import { isUuid, str } from '../../../../lib/util';

// Loads the person, but only if they belong to THIS company.
async function loadMember(id, companyId) {
  if (!isUuid(id)) fail(404, 'Not found');
  const { rows } = await query(
    `select id, email, full_name, role, status, last_login_at, created_at
       from users where id = $1 and company_id = $2`,
    [id, companyId]
  );
  if (!rows[0]) fail(404, 'Not found');
  return rows[0];
}

async function activeAdminCount(companyId) {
  const { rows } = await query("select count(*)::int as n from users where company_id = $1 and role = 'company_admin' and status = 'active'", [companyId]);
  return rows[0].n;
}

export default route({
  GET: async (req, res) => {
    const { companyId } = await requireCompanyContext(req, res);
    const person = await loadMember(req.query.id, companyId);
    const [sessions, assignments] = await Promise.all([
      query(
        `select id, scenario_name, outcome, cases_ordered, behaviour_score, created_at
           from sessions where user_id = $1 and company_id = $2 order by created_at desc limit 100`,
        [person.id, companyId]
      ),
      query(
        `select a.id, a.title, a.kind, a.due_date, au.status, au.completed_at
           from assignment_users au join assignments a on a.id = au.assignment_id
          where au.user_id = $1 and a.company_id = $2 order by a.created_at desc`,
        [person.id, companyId]
      ),
    ]);
    res.status(200).json({ person, sessions: sessions.rows, assignments: assignments.rows });
  },

  // Edit name, role or status (active / disabled).
  PATCH: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    const person = await loadMember(req.query.id, companyId);
    const b = req.body || {};
    const changes = {};

    if (b.fullName !== undefined) {
      const name = str(b.fullName, 120);
      if (!name) fail(400, 'Name cannot be empty.');
      changes.full_name = name;
    }
    if (b.role !== undefined) {
      if (!['employee', 'company_admin'].includes(b.role)) fail(400, 'Invalid role.');
      if (b.role !== person.role) {
        if (person.id === user.id) fail(400, 'You cannot change your own role.');
        if (person.role === 'company_admin' && (await activeAdminCount(companyId)) <= 1) fail(409, 'A company needs at least one admin.');
        changes.role = b.role;
      }
    }
    if (b.status !== undefined) {
      if (!['active', 'disabled'].includes(b.status)) fail(400, 'Invalid status.');
      if (b.status !== person.status) {
        if (person.id === user.id) fail(400, 'You cannot disable your own account.');
        if (b.status === 'disabled' && person.role === 'company_admin' && (await activeAdminCount(companyId)) <= 1) {
          fail(409, 'A company needs at least one admin.');
        }
        if (b.status === 'active') {
          const seats = await seatUsage(companyId);
          if (seats.used >= seats.seat_limit) fail(409, 'No free seats left to reactivate this person.');
        }
        changes.status = b.status;
      }
    }

    const keys = Object.keys(changes);
    if (keys.length) {
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      await query(`update users set ${sets} where id = $1`, [person.id, ...keys.map((k) => changes[k])]);
      await audit(user, 'employee.update', { companyId, target: person.email, meta: changes });
    }
    res.status(200).json({ ok: true });
  },

  // Permanently removes the person. Their practice records stay in the company's reports.
  DELETE: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    const person = await loadMember(req.query.id, companyId);
    if (person.id === user.id) fail(400, 'You cannot delete your own account.');
    if (person.role === 'company_admin' && person.status === 'active' && (await activeAdminCount(companyId)) <= 1) {
      fail(409, 'A company needs at least one admin.');
    }
    await query('delete from users where id = $1 and company_id = $2', [person.id, companyId]);
    await audit(user, 'employee.delete', { companyId, target: person.email });
    res.status(200).json({ ok: true });
  },
});
