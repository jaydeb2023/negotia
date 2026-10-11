import bcrypt from 'bcryptjs';
import { query } from '../../lib/db';
import { isAdminEmail } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const fullName = String(req.body?.fullName || '').trim().slice(0, 120);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!fullName) return res.status(400).json({ error: 'Please enter your full name.' });

    const existing = await query('select 1 from users where lower(email) = $1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await query(
      'insert into users (email, password_hash, full_name, role) values ($1, $2, $3, $4)',
      [email, hash, fullName, isAdminEmail(email) ? 'admin' : 'trainee']
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Could not create the account.' });
  }
}
