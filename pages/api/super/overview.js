import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireSuper } from '../../../lib/auth';

// Platform-wide numbers for the super admin home.
export default route({
  GET: async (req, res) => {
    await requireSuper(req, res);
    const [stats, roles, recentCompanies, recentLeads, series] = await Promise.all([
      query(
        `select
           (select count(*)::int from companies) as companies,
           (select count(*)::int from companies where status = 'active') as companies_active,
           (select count(*)::int from companies where status = 'suspended') as companies_suspended,
           (select count(*)::int from users where status = 'active') as users_active,
           (select count(*)::int from sessions where created_at > now() - interval '7 days') as calls_7d,
           (select count(*)::int from sessions) as calls_total,
           (select count(*)::int from leads where status = 'new') as leads_new`
      ),
      query("select role, count(*)::int as n from users where status = 'active' group by role"),
      query(
        `select c.id, c.name, c.status, c.seat_limit, c.created_at,
                (select count(*)::int from users u where u.company_id = c.id and u.status = 'active') as members
           from companies c order by c.created_at desc limit 6`
      ),
      query("select id, kind, name, email, company_name, status, created_at from leads order by created_at desc limit 6"),
      query(
        `select to_char(d, 'YYYY-MM-DD') as day, count(s.id)::int as n
           from generate_series(current_date - 13, current_date, interval '1 day') d
           left join sessions s on s.created_at::date = d::date
          group by d order by d`
      ),
    ]);
    res.status(200).json({
      stats: stats.rows[0],
      roles: Object.fromEntries(roles.rows.map((r) => [r.role, r.n])),
      recentCompanies: recentCompanies.rows,
      recentLeads: recentLeads.rows,
      series: series.rows,
    });
  },
});
