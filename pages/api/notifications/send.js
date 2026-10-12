import { query } from '../../../lib/db';
import { route, fail } from '../../../lib/api';
import { requireRoles } from '../../../lib/auth';
import { notify } from '../../../lib/notify';
import { audit } from '../../../lib/audit';
import { isUuid, str } from '../../../lib/util';

// Announcements.
//  - Company admin: to everyone in their own company, or chosen people (userIds).
//  - Super admin: scope "all" (everyone), "company_admins", a company ({ companyId }) or chosen people.
export default route({
  POST: async (req, res) => {
    const user = await requireRoles(req, res, ['company_admin', 'super_admin']);
    const title = str(req.body?.title, 140);
    const body = str(req.body?.body, 1000) || null;
    if (!title) fail(400, 'Please write a title.');

    const userIds = (Array.isArray(req.body?.userIds) ? req.body.userIds : []).filter(isUuid);
    let recipients;

    if (user.role === 'company_admin') {
      // Locked to their own company, even if they pass other ids.
      recipients = userIds.length
        ? (await query("select id from users where company_id = $1 and status = 'active' and id = any($2::uuid[])", [user.company_id, userIds])).rows
        : (await query("select id from users where company_id = $1 and status = 'active' and id <> $2", [user.company_id, user.id])).rows;
    } else {
      const scope = req.body?.scope;
      if (userIds.length) {
        recipients = (await query("select id from users where status = 'active' and id = any($1::uuid[])", [userIds])).rows;
      } else if (scope === 'company_admins') {
        recipients = (await query("select id from users where status = 'active' and role = 'company_admin'")).rows;
      } else if (isUuid(req.body?.companyId)) {
        recipients = (await query("select id from users where status = 'active' and company_id = $1", [req.body.companyId])).rows;
      } else if (scope === 'all') {
        recipients = (await query("select id from users where status = 'active'")).rows;
      } else {
        fail(400, 'Choose who should receive this.');
      }
    }

    const sent = await notify(recipients.map((r) => r.id), { kind: 'announcement', title, body });
    await audit(user, 'announcement.send', { companyId: user.company_id || null, target: title, meta: { recipients: sent } });
    res.status(200).json({ ok: true, sent });
  },
});
