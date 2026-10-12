import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { requireUser } from '../../../lib/auth';
import { isUuid } from '../../../lib/util';

export default route({
  // My latest notifications and how many are unread.
  GET: async (req, res) => {
    const user = await requireUser(req, res);
    const [list, count] = await Promise.all([
      query('select * from notifications where user_id = $1 order by created_at desc limit 60', [user.id]),
      query('select count(*)::int as n from notifications where user_id = $1 and read_at is null', [user.id]),
    ]);
    res.status(200).json({ items: list.rows, unread: count.rows[0].n });
  },

  // Mark as read: { all: true } or { ids: [...] }.
  POST: async (req, res) => {
    const user = await requireUser(req, res);
    if (req.body?.all) {
      await query('update notifications set read_at = now() where user_id = $1 and read_at is null', [user.id]);
    } else {
      const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).filter(isUuid);
      if (ids.length) {
        await query('update notifications set read_at = now() where user_id = $1 and id = any($2::uuid[]) and read_at is null', [user.id, ids]);
      }
    }
    res.status(200).json({ ok: true });
  },
});
