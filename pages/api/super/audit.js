import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireSuper } from '../../../lib/auth';
import { isUuid } from '../../../lib/util';

// Who did what, newest first. Optionally one company: ?companyId=...
export default route({
  GET: async (req, res) => {
    await requireSuper(req, res);
    const companyId = isUuid(req.query.companyId) ? req.query.companyId : null;
    const { rows } = await query(
      `select a.id, a.actor_email, a.action, a.target, a.meta, a.created_at, c.name as company_name
         from audit_log a left join companies c on c.id = a.company_id
        where ($1::uuid is null or a.company_id = $1)
        order by a.created_at desc limit 300`,
      [companyId]
    );
    res.status(200).json(rows);
  },
});
