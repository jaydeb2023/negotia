import bcrypt from 'bcryptjs';
import { query } from '../../../lib/db';
import { route, fail } from '../../../lib/api';
import { hashToken } from '../../../lib/tokens';
import { consumeInvite, seatUsage } from '../../../lib/invites';
import { allow, clientIp } from '../../../lib/ratelimit';
import { str } from '../../../lib/util';

// Public: a new person sets a password and joins the company from an invitation link.
export default route({
  POST: async (req, res) => {
    if (!allow(`invite:${clientIp(req)}`, 20, 60 * 60 * 1000)) fail(429, 'Too many attempts. Please try again later.');

    const password = String(req.body?.password || '');
    const fullName = str(req.body?.fullName, 120);
    if (password.length < 8) fail(400, 'Password must be at least 8 characters.');

    const { rows } = await query(
      `select i.*, c.status as company_status from invitations i join companies c on c.id = i.company_id
        where i.token_hash = $1`,
      [hashToken(req.body?.token)]
    );
    const inv = rows[0];
    if (!inv || inv.accepted_at || inv.revoked_at || new Date(inv.expires_at) <= new Date() || inv.company_status !== 'active') {
      fail(410, 'This invitation is no longer valid. Ask your company admin for a new link.');
    }

    const existing = await query('select 1 from users where lower(email) = lower($1)', [inv.email]);
    if (existing.rows[0]) {
      fail(409, 'An account with this email already exists. Sign in, then open the invitation link again.');
    }

    const seats = await seatUsage(inv.company_id);
    if (seats.used >= seats.seat_limit) fail(409, 'This company has no free seats. Ask your company admin.');

    const name = fullName || str(inv.full_name, 120) || inv.email;
    const hash = await bcrypt.hash(password, 10);
    const created = await query(
      'insert into users (email, password_hash, full_name, role) values ($1, $2, $3, $4) returning id',
      [inv.email.toLowerCase(), hash, name, 'individual']
    );
    await consumeInvite(inv, created.rows[0].id);
    res.status(201).json({ ok: true, email: inv.email });
  },
});
