import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireCompanyContext } from '../../../lib/companyCtx';
import { seatUsage } from '../../../lib/invites';

// Numbers for the company dashboard. Everything is filtered by ctx.companyId.
export default route({
  GET: async (req, res) => {
    const { companyId, company } = await requireCompanyContext(req, res);

    const [stats, seats, recent, attention, series, assignmentTotals] = await Promise.all([
      query(
        `select
           (select count(*)::int from users where company_id = $1 and status = 'active') as members,
           (select count(*)::int from sessions where company_id = $1 and created_at > now() - interval '7 days') as calls_7d,
           (select count(*)::int from sessions where company_id = $1) as calls_total,
           (select round(avg(behaviour_score)::numeric, 1) from sessions where company_id = $1 and outcome <> 'incomplete') as avg_score,
           (select count(distinct user_id)::int from sessions where company_id = $1 and created_at > now() - interval '7 days') as active_7d,
           (select count(*)::int from sessions where company_id = $1 and outcome like 'RP%') as successes`,
        [companyId]
      ),
      seatUsage(companyId),
      query(
        `select id, user_id, trainee_name, scenario_name, outcome, behaviour_score, created_at
           from sessions where company_id = $1 order by created_at desc limit 8`,
        [companyId]
      ),
      query(
        `select u.id, u.full_name, u.email, max(s.created_at) as last_active
           from users u left join sessions s on s.user_id = u.id and s.company_id = $1
          where u.company_id = $1 and u.status = 'active' and u.role = 'employee'
          group by u.id
         having max(s.created_at) is null or max(s.created_at) < now() - interval '7 days'
          order by max(s.created_at) nulls first limit 8`,
        [companyId]
      ),
      query(
        `select to_char(d, 'YYYY-MM-DD') as day, count(s.id)::int as n
           from generate_series(current_date - 13, current_date, interval '1 day') d
           left join sessions s on s.company_id = $1 and s.created_at::date = d::date
          group by d order by d`,
        [companyId]
      ),
      query(
        `select
           count(*) filter (where au.status = 'pending')::int as pending,
           count(*) filter (where au.status = 'pending' and a.due_date < current_date)::int as overdue,
           count(*) filter (where au.status = 'completed')::int as completed
           from assignment_users au join assignments a on a.id = au.assignment_id
          where a.company_id = $1`,
        [companyId]
      ),
    ]);

    res.status(200).json({
      company: { id: company.id, name: company.name, status: company.status },
      stats: stats.rows[0],
      seats,
      recent: recent.rows,
      attention: attention.rows,
      series: series.rows,
      assignments: assignmentTotals.rows[0],
    });
  },
});
