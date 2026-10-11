import { query } from '../../../lib/db';
import { requireUser, requireAdmin } from '../../../lib/auth';

const OUTCOMES = ['RP1_success', 'RP2_success', 'WP1', 'WP2', 'incomplete'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // ?all=1 -> every trainee's sessions (admin only). Otherwise just your own.
      if (req.query.all === '1') {
        if (!(await requireAdmin(req, res))) return;
        const { rows } = await query('select * from sessions order by created_at desc');
        return res.status(200).json(rows);
      }
      const user = await requireUser(req, res);
      if (!user) return;
      const { rows } = await query(
        'select * from sessions where user_id = $1 order by created_at desc',
        [user.id]
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const b = req.body || {};

      const outcome = OUTCOMES.includes(b.outcome) ? b.outcome : 'incomplete';
      const scenarioId = UUID.test(String(b.scenario_id)) ? b.scenario_id : null;
      const transcript = Array.isArray(b.transcript) ? b.transcript : [];
      const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

      const { rows } = await query(
        `insert into sessions
           (user_id, trainee_name, scenario_id, scenario_name, transcript, outcome, cases_ordered, behaviour_score)
         values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
         returning id`,
        [
          user.id,
          user.full_name || user.email, // taken from the account, not from the browser
          scenarioId,
          String(b.scenario_name || 'Unknown').slice(0, 200),
          JSON.stringify(transcript),
          outcome,
          clamp(b.cases_ordered, 0, 100),
          clamp(b.behaviour_score, 0, 10),
        ]
      );
      return res.status(201).json({ ok: true, id: rows[0].id });
    }

    res.status(405).end();
  } catch (err) {
    console.error('[sessions]', err);
    res.status(500).json({ error: 'Could not save the session.' });
  }
}
