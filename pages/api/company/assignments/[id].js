import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireCompanyContext } from '../../../../lib/companyCtx';
import { audit } from '../../../../lib/audit';
import { isUuid } from '../../../../lib/util';

async function loadAssignment(id, companyId) {
  if (!isUuid(id)) fail(404, 'Not found');
  const { rows } = await query(
    `select a.*, s.name as scenario_name from assignments a left join scenarios s on s.id = a.scenario_id
      where a.id = $1 and a.company_id = $2`,
    [id, companyId]
  );
  if (!rows[0]) fail(404, 'Not found');
  return rows[0];
}

export default route({
  GET: async (req, res) => {
    const { companyId } = await requireCompanyContext(req, res);
    const assignment = await loadAssignment(req.query.id, companyId);
    const { rows } = await query(
      `select au.user_id, u.full_name, u.email, au.status, au.completed_at, au.session_id
         from assignment_users au join users u on u.id = au.user_id
        where au.assignment_id = $1 order by au.status, u.full_name`,
      [assignment.id]
    );
    res.status(200).json({ assignment, people: rows });
  },

  DELETE: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    const assignment = await loadAssignment(req.query.id, companyId);
    await query('delete from assignments where id = $1 and company_id = $2', [assignment.id, companyId]);
    await audit(user, 'assignment.delete', { companyId, target: assignment.title });
    res.status(200).json({ ok: true });
  },
});
