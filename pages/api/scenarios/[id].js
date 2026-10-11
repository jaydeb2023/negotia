import { query } from '../../../lib/db';
import { requireUser, requireAdmin } from '../../../lib/auth';
import { pickScenarioFields } from '../../../lib/scenarioFields';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const { id } = req.query;
  if (!UUID.test(String(id))) return res.status(404).json({ error: 'Not found' });

  try {
    if (req.method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { rows } = await query('select * from scenarios where id = $1', [id]);
      const row = rows[0];
      if (!row || (!row.is_active && user.role !== 'admin')) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(row);
    }

    if (req.method === 'PUT') {
      if (!(await requireAdmin(req, res))) return;
      const f = pickScenarioFields(req.body);
      const keys = Object.keys(f);
      if (keys.length === 0) return res.status(400).json({ error: 'Nothing to update' });
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const { rows } = await query(`update scenarios set ${sets} where id = $1 returning *`, [
        id,
        ...keys.map((k) => f[k]),
      ]);
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      if (!(await requireAdmin(req, res))) return;
      await query('delete from scenarios where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error('[scenarios/id]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
