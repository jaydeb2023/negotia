import { query } from '../../../../../lib/db';
import { route, fail } from '../../../../../lib/api';
import { requireSuper } from '../../../../../lib/auth';
import { INVITE_DAYS, inviteLink } from '../../../../../lib/invites';
import { newToken, hashToken } from '../../../../../lib/tokens';
import { audit } from '../../../../../lib/audit';
import { int, isUuid, str } from '../../../../../lib/util';

// Approve a company request: creates the company and an invitation for the person who asked.
export default route({
  POST: async (req, res) => {
    const user = await requireSuper(req, res);
    if (!isUuid(req.query.id)) fail(404, 'Not found');
    const { rows } = await query('select * from leads where id = $1', [req.query.id]);
    const lead = rows[0];
    if (!lead) fail(404, 'Not found');
    if (lead.status === 'converted') fail(409, 'This request was already converted.');

    const name = str(req.body?.name, 160) || lead.company_name;
    if (!name) fail(400, 'Enter a company name.');
    const taken = await query('select company_id, role from users where lower(email) = lower($1)', [lead.email]);
    if (taken.rows[0] && (taken.rows[0].role === 'super_admin' || taken.rows[0].company_id)) {
      fail(409, 'That email already belongs to a platform admin or another company.');
    }

    const created = await query(
      'insert into companies (name, seat_limit, contact_name, contact_email, contact_phone) values ($1, $2, $3, $4, $5) returning id, name',
      [name, int(req.body?.seat_limit, 1, 100000, 10), lead.name, lead.email, lead.phone]
    );
    const company = created.rows[0];
    const token = newToken();
    await query(
      `insert into invitations (company_id, email, full_name, role, token_hash, invited_by, expires_at)
       values ($1, $2, $3, 'company_admin', $4, $5, now() + ($6 || ' days')::interval)`,
      [company.id, lead.email.toLowerCase(), lead.name, hashToken(token), user.id, String(INVITE_DAYS)]
    );
    await query("update leads set status = 'converted', company_id = $2 where id = $1", [lead.id, company.id]);
    await audit(user, 'lead.convert', { companyId: company.id, target: company.name });
    res.status(201).json({ company, link: inviteLink(token) });
  },
});
