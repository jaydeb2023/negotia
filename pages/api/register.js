import bcrypt from 'bcryptjs';
import { query } from '../../lib/db';
import { isAdminEmail } from '../../lib/auth';
import { route, fail } from '../../lib/api';
import { allow, clientIp } from '../../lib/ratelimit';
import { emailOk, str } from '../../lib/util';

// Public sign-up for individuals. Company members join through an invitation instead.
export default route({
  POST: async (req, res) => {
    if (!allow(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)) fail(429, 'Too many attempts. Please try again later.');

    const email = str(req.body?.email, 254).toLowerCase();
    const password = String(req.body?.password || '');
    const fullName = str(req.body?.fullName, 120);

    if (!emailOk(email)) fail(400, 'Please enter a valid email address.');
    if (password.length < 8) fail(400, 'Password must be at least 8 characters.');
    if (!fullName) fail(400, 'Please enter your full name.');

    const existing = await query('select 1 from users where lower(email) = $1', [email]);
    if (existing.rows[0]) fail(409, 'An account with this email already exists. Please sign in.');

    const hash = await bcrypt.hash(password, 10);
    await query('insert into users (email, password_hash, full_name, role) values ($1, $2, $3, $4)', [
      email,
      hash,
      fullName,
      isAdminEmail(email) ? 'super_admin' : 'individual',
    ]);
    res.status(201).json({ ok: true });
  },
});
