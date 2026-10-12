import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireSuper } from '../../../../lib/auth';
import { INVITE_DAYS, inviteLink } from '../../../../lib/invites';
import { newToken, hashToken } from '../../../../lib/tokens';
import { audit } from '../../../../lib/audit';
import { emailOk, int, str } from '../../../../lib/util';

export default route({
  GET: async (req, res) => {
    await requireSuper(req, res);
    const { rows } = await query(
      `select c.id, c.name, c.status, c.seat_limit, c.contact_name, c.contact_email, c.created_at,
              (select count(*)::int from users u where u.company_id = c.id and u.status = 'active') as members,
              (select count(*)::int from sessions s where s.company_id = c.id and s.created_at > now() - interval '7 days') as calls_7d,
              (select max(s.created_at) from sessions s where s.company_id = c.id) as last_active
         from companies c order by c.created_at desc`
    );
    res.status(200).json(rows);
  },

  // Create a company and (optionally) invite its first admin. Returns that invitation link.
  POST: async (req, res) => {
    const user = await requireSuper(req, res);
    const b = req.body || {};
    const name = str(b.name, 160);
    if (!name) fail(400, 'Please enter the company name.');
    const adminEmail = str(b.adminEmail, 254).toLowerCase();
    if (adminEmail && !emailOk(adminEmail)) fail(400, 'The admin email is not valid.');

    if (adminEmail) {
      const taken = await query('select company_id, role from users where lower(email) = $1', [adminEmail]);
      const t = taken.rows[0];
      if (t && (t.role === 'super_admin' || t.company_id)) fail(409, 'That email already belongs to a platform admin or another company.');
    }

    const created = await query(
      `insert into companies (name, seat_limit, contact_name, contact_email, contact_phone, notes)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [
        name,
        int(b.seat_limit, 1, 100000, 10),
        str(b.contact_name, 120) || null,
        str(b.contact_email, 254) || adminEmail || null,
        str(b.contact_phone, 40) || null,
        str(b.notes, 2000) || null,
      ]
    );
    const company = created.rows[0];

    let link = null;
    if (adminEmail) {
      const token = newToken();
      await query(
        `insert into invitations (company_id, email, full_name, role, token_hash, invited_by, expires_at)
         values ($1, $2, $3, 'company_admin', $4, $5, now() + ($6 || ' days')::interval)`,
        [company.id, adminEmail, str(b.adminName, 120) || null, hashToken(token), user.id, String(INVITE_DAYS)]
      );
      link = inviteLink(token);
    }
    await audit(user, 'company.create', { companyId: company.id, target: name });
    res.status(201).json({ company, link });
  },
});
