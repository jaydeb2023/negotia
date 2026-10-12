import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireUser } from '../../../../lib/auth';
import { notify } from '../../../../lib/notify';
import { isUuid } from '../../../../lib/util';

// POST = "mark as done" for a training item. (Practice assignments complete automatically after a call.)
export default route({
  POST: async (req, res) => {
    const user = await requireUser(req, res);
    const { id } = req.query;
    if (!isUuid(id)) fail(404, 'Not found');
    const { rows } = await query(
      `update assignment_users au set status = 'completed', completed_at = now()
         from assignments a
        where a.id = au.assignment_id and au.assignment_id = $1 and au.user_id = $2
          and au.status = 'pending' and a.kind = 'training'
        returning a.title, a.created_by`,
      [id, user.id]
    );
    if (!rows[0]) fail(404, 'Nothing to mark as done');
    await notify([rows[0].created_by], {
      kind: 'assignment_completed',
      title: 'Training completed',
      body: `${user.full_name || user.email} finished "${rows[0].title}".`,
      link: '/company/assignments',
    });
    res.status(200).json({ ok: true });
  },
});
