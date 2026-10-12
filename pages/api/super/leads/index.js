import { query } from '../../../../lib/db';
import { route } from '../../../../lib/api';
import { requireSuper } from '../../../../lib/auth';

// Website requests: contact messages and "sign up your company" requests.
export default route({
  GET: async (req, res) => {
    await requireSuper(req, res);
    const { rows } = await query('select * from leads order by (status = \'new\') desc, created_at desc limit 300');
    res.status(200).json(rows);
  },
});
