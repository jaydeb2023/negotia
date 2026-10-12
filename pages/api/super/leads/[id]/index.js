import { query } from '../../../../../lib/db';
import { route, fail } from '../../../../../lib/api';
import { requireSuper } from '../../../../../lib/auth';
import { isUuid } from '../../../../../lib/util';

export default route({
  PATCH: async (req, res) => {
    await requireSuper(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    if (!['new', 'contacted', 'closed'].includes(req.body?.status)) fail(400, 'Invalid status.');
    await query("update leads set status = $2 where id = $1 and status <> 'converted'", [req.query.id, req.body.status]);
    res.status(200).json({ ok: true });
  },
  DELETE: async (req, res) => {
    await requireSuper(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    await query('delete from leads where id = $1', [req.query.id]);
    res.status(200).json({ ok: true });
  },
});
