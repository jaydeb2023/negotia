import { query } from '../../../lib/db';
import { route, fail } from '../../../lib/api';
import { requireUser, requireSuper } from '../../../lib/auth';
import { pickScenarioFields } from '../../../lib/scenarioFields';
import { audit } from '../../../lib/audit';
import { isUuid } from '../../../lib/util';

export default route({
  GET: async (req, res) => {
    const user = await requireUser(req, res);
    const { id } = req.query;
    if (!isUuid(id)) fail(404, 'Not found');
    const { rows } = await query('select * from scenarios where id = $1', [id]);
    const row = rows[0];
    const visible =
      row &&
      (user.role === 'super_admin' ||
        (row.is_active && (row.company_id === null || row.company_id === user.company_id)));
    if (!visible) fail(404, 'Not found');
    if (user.role !== 'super_admin') delete row.system_prompt; // secret rules stay on the server
    res.status(200).json(row);
  },

  PUT: async (req, res) => {
    const user = await requireSuper(req, res);
    const { id } = req.query;
    if (!isUuid(id)) fail(404, 'Not found');
    const f = pickScenarioFields(req.body);
    const keys = Object.keys(f);
    if (req.body && 'company_id' in req.body) {
      keys.push('company_id');
      f.company_id = isUuid(req.body.company_id) ? req.body.company_id : null;
    }
    if (keys.length === 0) fail(400, 'Nothing to update');
    const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const { rows } = await query(`update scenarios set ${sets} where id = $1 returning *`, [id, ...keys.map((k) => f[k])]);
    if (!rows[0]) fail(404, 'Not found');
    await audit(user, 'persona.update', { target: rows[0].name, meta: { fields: keys } });
    res.status(200).json(rows[0]);
  },

  DELETE: async (req, res) => {
    const user = await requireSuper(req, res);
    const { id } = req.query;
    if (!isUuid(id)) fail(404, 'Not found');
    const { rows } = await query('delete from scenarios where id = $1 returning name', [id]);
    if (rows[0]) await audit(user, 'persona.delete', { target: rows[0].name });
    res.status(200).json({ ok: true });
  },
});
