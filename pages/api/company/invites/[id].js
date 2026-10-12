import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireCompanyContext } from '../../../../lib/companyCtx';
import { INVITE_DAYS, inviteLink } from '../../../../lib/invites';
import { newToken, hashToken } from '../../../../lib/tokens';
import { audit } from '../../../../lib/audit';
import { isUuid } from '../../../../lib/util';

export default route({
  // POST = create a fresh link for an open invitation (the old link stops working).
  POST: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    const token = newToken();
    const { rows } = await query(
      `update invitations set token_hash = $1, expires_at = now() + ($2 || ' days')::interval
        where id = $3 and company_id = $4 and accepted_at is null and revoked_at is null
        returning email, expires_at`,
      [hashToken(token), String(INVITE_DAYS), req.query.id, companyId]
    );
    if (!rows[0]) fail(404, 'Invitation not found');
    await audit(user, 'employee.invite_renew', { companyId, target: rows[0].email });
    res.status(200).json({ link: inviteLink(token), expires_at: rows[0].expires_at });
  },

  // DELETE = cancel the invitation.
  DELETE: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    const { rows } = await query(
      `update invitations set revoked_at = now()
        where id = $1 and company_id = $2 and accepted_at is null and revoked_at is null returning email`,
      [req.query.id, companyId]
    );
    if (rows[0]) await audit(user, 'employee.invite_cancel', { companyId, target: rows[0].email });
    res.status(200).json({ ok: true });
  },
});
