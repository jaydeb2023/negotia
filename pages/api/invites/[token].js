import { query } from '../../../lib/db';
import { route } from '../../../lib/api';
import { hashToken } from '../../../lib/tokens';

// Public: what the invitation page shows before the person signs up.
export default route({
  GET: async (req, res) => {
    const { rows } = await query(
      `select i.email, i.full_name, i.role, i.expires_at, i.accepted_at, i.revoked_at,
              c.name as company_name, c.status as company_status
         from invitations i join companies c on c.id = i.company_id
        where i.token_hash = $1`,
      [hashToken(req.query.token)]
    );
    const inv = rows[0];
    const valid = inv && !inv.accepted_at && !inv.revoked_at && new Date(inv.expires_at) > new Date() && inv.company_status === 'active';
    if (!valid) return res.status(200).json({ valid: false });
    res.status(200).json({ valid: true, email: inv.email, full_name: inv.full_name, role: inv.role, company_name: inv.company_name });
  },
});
