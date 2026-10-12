import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireUser, requireSuper } from '../../../lib/auth';
import { notify } from '../../../lib/notify';
import { int, isUuid, str } from '../../../lib/util';

const OUTCOMES = ['RP1_success', 'RP2_success', 'WP1', 'WP2', 'incomplete'];

export default route({
  // My own practice sessions. ?all=1 (super admin only) returns everyone's.
  GET: async (req, res) => {
    if (req.query.all === '1') {
      await requireSuper(req, res);
      const { rows } = await query('select * from sessions order by created_at desc limit 2000');
      return res.status(200).json(rows);
    }
    const user = await requireUser(req, res);
    const { rows } = await query('select * from sessions where user_id = $1 order by created_at desc', [user.id]);
    res.status(200).json(rows);
  },

  POST: async (req, res) => {
    const user = await requireUser(req, res);
    const b = req.body || {};

    const outcome = OUTCOMES.includes(b.outcome) ? b.outcome : 'incomplete';
    const scenarioId = isUuid(b.scenario_id) ? b.scenario_id : null;
    const transcript = Array.isArray(b.transcript) ? b.transcript : [];

    const { rows } = await query(
      `insert into sessions
         (user_id, company_id, trainee_name, scenario_id, scenario_name, transcript, outcome, cases_ordered, behaviour_score, feedback)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
       returning id`,
      [
        user.id,
        user.company_id || null, // taken from the account, never from the browser
        user.full_name || user.email,
        scenarioId,
        str(b.scenario_name, 200) || 'Unknown',
        JSON.stringify(transcript),
        outcome,
        int(b.cases_ordered, 0, 100, 0),
        int(b.behaviour_score, 0, 10, 0),
        str(b.feedback, 4000) || null,
      ]
    );
    const sessionId = rows[0].id;

    // A finished call on a persona that was assigned to me completes that assignment.
    if (scenarioId && outcome !== 'incomplete' && user.company_id) {
      const done = await query(
        `update assignment_users au
            set status = 'completed', completed_at = now(), session_id = $1
           from assignments a
          where a.id = au.assignment_id and au.user_id = $2 and au.status = 'pending'
            and a.kind = 'practice' and a.scenario_id = $3 and a.company_id = $4
          returning a.title, a.created_by`,
        [sessionId, user.id, scenarioId, user.company_id]
      );
      for (const row of done.rows) {
        await notify([row.created_by], {
          kind: 'assignment_completed',
          title: 'Assignment completed',
          body: `${user.full_name || user.email} finished "${row.title}".`,
          link: '/company/assignments',
        });
      }
    }
    res.status(201).json({ ok: true, id: sessionId });
  },
});
