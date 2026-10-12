import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireCompanyContext } from '../../../lib/companyCtx';
import { isUuid } from '../../../lib/util';

// Practice calls made by people in my company (optionally one person: ?userId=...).
export default route({
  GET: async (req, res) => {
    const { companyId } = await requireCompanyContext(req, res);
    const userId = isUuid(req.query.userId) ? req.query.userId : null;
    const { rows } = await query(
      `select id, user_id, trainee_name, scenario_name, outcome, cases_ordered, behaviour_score, created_at
         from sessions where company_id = $1 and ($2::uuid is null or user_id = $2)
        order by created_at desc limit 300`,
      [companyId, userId]
    );
    res.status(200).json(rows);
  },
});
