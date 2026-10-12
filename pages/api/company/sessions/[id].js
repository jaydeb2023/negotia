import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireCompanyContext } from '../../../../lib/companyCtx';
import { isUuid } from '../../../../lib/util';

// One full call (transcript and feedback), only if it belongs to my company.
export default route({
  GET: async (req, res) => {
    const { companyId } = await requireCompanyContext(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    const { rows } = await query('select * from sessions where id = $1 and company_id = $2', [req.query.id, companyId]);
    if (!rows[0]) fail(404, 'Not found');
    res.status(200).json(rows[0]);
  },
});
