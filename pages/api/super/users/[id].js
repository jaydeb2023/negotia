import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireSuper } from '../../../../lib/auth';
import { audit } from '../../../../lib/audit';
import { isUuid } from '../../../../lib/util';

export default route({
  // Switch an account on or off.
  PATCH: async (req, res) => {
    const user = await requireSuper(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    if (!['active', 'disabled'].includes(req.body?.status)) fail(400, 'Invalid status.');
    if (req.query.id === user.id) fail(400, 'You cannot disable your own account.');
    const { rows } = await query('update users set status = $2 where id = $1 returning email, company_id', [req.query.id, req.body.status]);
    if (!rows[0]) fail(404, 'Not found');
    await audit(user, `user.${req.body.status === 'active' ? 'enable' : 'disable'}`, { companyId: rows[0].company_id, target: rows[0].email });
    res.status(200).json({ ok: true });
  },

  DELETE: async (req, res) => {
    const user = await requireSuper(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    if (req.query.id === user.id) fail(400, 'You cannot delete your own account.');
    const { rows } = await query('delete from users where id = $1 returning email, company_id', [req.query.id]);
    if (rows[0]) await audit(user, 'user.delete', { companyId: rows[0].company_id, target: rows[0].email });
    res.status(200).json({ ok: true });
  },
});
