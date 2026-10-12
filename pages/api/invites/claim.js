import { query } from '../../../lib/db';
import { route, fail } from '../../../lib/api';
import { requireUser } from '../../../lib/auth';
import { hashToken } from '../../../lib/tokens';
import { consumeInvite, seatUsage } from '../../../lib/invites';

// Signed-in person (for example after Google sign-in) joins the company from an invitation.
export default route({
  POST: async (req, res) => {
    const user = await requireUser(req, res);
    const { rows } = await query(
      `select i.*, c.status as company_status from invitations i join companies c on c.id = i.company_id
        where i.token_hash = $1`,
      [hashToken(req.body?.token)]
    );
    const inv = rows[0];
    if (!inv || inv.accepted_at || inv.revoked_at || new Date(inv.expires_at) <= new Date() || inv.company_status !== 'active') {
      fail(410, 'This invitation is no longer valid. Ask your company admin for a new link.');
    }
    if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
      fail(403, `This invitation is for ${inv.email}. You are signed in as ${user.email}.`);
    }
    if (user.role === 'super_admin') fail(409, 'Super admin accounts cannot join a company.');
    if (user.company_id && user.company_id !== inv.company_id) fail(409, 'You already belong to another company.');

    if (user.company_id !== inv.company_id) {
      const seats = await seatUsage(inv.company_id);
      if (seats.used >= seats.seat_limit) fail(409, 'This company has no free seats. Ask your company admin.');
    }
    await consumeInvite(inv, user.id);
    res.status(200).json({ ok: true });
  },
});
