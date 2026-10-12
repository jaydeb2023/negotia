import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireCompanyContext } from '../../../lib/companyCtx';
import { csvCell } from '../../../lib/util';

// Downloads the company's practice calls as a CSV file (opens in Excel).
export default route({
  GET: async (req, res) => {
    const { companyId, company } = await requireCompanyContext(req, res);
    const { rows } = await query(
      `select s.created_at, s.trainee_name, u.email, s.scenario_name, s.outcome, s.cases_ordered, s.behaviour_score
         from sessions s left join users u on u.id = s.user_id
        where s.company_id = $1 order by s.created_at desc`,
      [companyId]
    );
    const head = ['Date', 'Employee', 'Email', 'Persona', 'Outcome', 'Cases ordered', 'Behaviour score'];
    const lines = [head.join(',')].concat(
      rows.map((r) =>
        [new Date(r.created_at).toISOString(), r.trainee_name, r.email, r.scenario_name, r.outcome, r.cases_ordered, r.behaviour_score]
          .map(csvCell)
          .join(',')
      )
    );
    const safeName = company.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'company';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="practice-${safeName}.csv"`);
    res.status(200).send('\uFEFF' + lines.join('\r\n'));
  },
});
