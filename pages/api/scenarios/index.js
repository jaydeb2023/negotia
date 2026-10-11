import { query } from '../../../lib/db';
import { requireUser, requireAdmin } from '../../../lib/auth';
import { pickScenarioFields } from '../../../lib/scenarioFields';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // ?all=1 is for the admin screen (includes switched-off personas).
      if (req.query.all === '1') {
        if (!(await requireAdmin(req, res))) return;
        const { rows } = await query('select * from scenarios order by difficulty, created_at');
        return res.status(200).json(rows);
      }
      if (!(await requireUser(req, res))) return;
      const { rows } = await query(
        'select * from scenarios where is_active = true order by difficulty, created_at'
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!(await requireAdmin(req, res))) return;
      const f = pickScenarioFields(req.body);
      if (!f.name || !f.system_prompt) {
        return res.status(400).json({ error: 'Name and system prompt are required' });
      }
      const { rows } = await query(
        `insert into scenarios (name, avatar_emoji, difficulty, tagline, opening_line, system_prompt, is_active)
         values ($1, $2, $3, $4, $5, $6, $7) returning *`,
        [
          f.name,
          f.avatar_emoji ?? '🧑‍💼',
          f.difficulty ?? 1,
          f.tagline ?? null,
          f.opening_line ?? 'Hello, haan boliye.',
          f.system_prompt,
          f.is_active ?? true,
        ]
      );
      return res.status(201).json(rows[0]);
    }

    res.status(405).end();
  } catch (err) {
    console.error('[scenarios]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
