import { query } from '../../../../lib/db';
import { route } from '../../../../lib/api';
import { requireUser } from '../../../../lib/auth';

// My assignments (practice calls and training given to me by my company).
export default route({
  GET: async (req, res) => {
    const user = await requireUser(req, res);
    const { rows } = await query(
      `select a.id, a.kind, a.title, a.instructions, a.resource_url, a.scenario_id, a.due_date, a.created_at,
              s.name as scenario_name, s.avatar_emoji,
              au.status, au.completed_at,
              (au.status = 'pending' and a.due_date is not null and a.due_date < current_date) as overdue
         from assignment_users au
         join assignments a on a.id = au.assignment_id
         left join scenarios s on s.id = a.scenario_id
        where au.user_id = $1
        order by (au.status = 'pending') desc, a.due_date nulls last, a.created_at desc`,
      [user.id]
    );
    res.status(200).json(rows);
  },
});
