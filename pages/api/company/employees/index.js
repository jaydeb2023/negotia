import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireCompanyContext } from '../../../../lib/companyCtx';
import { INVITE_DAYS, inviteLink, seatUsage } from '../../../../lib/invites';
import { newToken, hashToken } from '../../../../lib/tokens';
import { audit } from '../../../../lib/audit';
import { emailOk, str } from '../../../../lib/util';

export default route({
  // People in my company, with simple practice stats, plus pending invitations and seat usage.
  GET: async (req, res) => {
    const { companyId } = await requireCompanyContext(req, res);
    const [people, invites, seats] = await Promise.all([
      query(
        `select u.id, u.email, u.full_name, u.role, u.status, u.last_login_at, u.created_at,
                coalesce(st.calls, 0) as calls, st.last_active, st.avg_score, coalesce(st.successes, 0) as successes,
                coalesce(pa.pending, 0) as pending_assignments
           from users u
           left join (
             select user_id, count(*)::int as calls, max(created_at) as last_active,
                    round(avg(behaviour_score) filter (where outcome <> 'incomplete')::numeric, 1) as avg_score,
                    count(*) filter (where outcome like 'RP%')::int as successes
               from sessions where company_id = $1 group by user_id
           ) st on st.user_id = u.id
           left join (
             select au.user_id, count(*)::int as pending
               from assignment_users au join assignments a on a.id = au.assignment_id
              where a.company_id = $1 and au.status = 'pending' group by au.user_id
           ) pa on pa.user_id = u.id
          where u.company_id = $1
          order by (u.status = 'active') desc, u.full_name nulls last`,
        [companyId]
      ),
      query(
        `select id, email, full_name, role, expires_at, created_at from invitations
          where company_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()
          order by created_at desc`,
        [companyId]
      ),
      seatUsage(companyId),
    ]);
    res.status(200).json({ people: people.rows, invites: invites.rows, seats });
  },

  // Invite a new employee. Returns a link the admin sends to them (WhatsApp, email, ...).
  POST: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    const email = str(req.body?.email, 254).toLowerCase();
    const fullName = str(req.body?.fullName, 120) || null;
    const role = req.body?.role === 'company_admin' ? 'company_admin' : 'employee';
    if (!emailOk(email)) fail(400, 'Please enter a valid email address.');

    const existing = await query('select id, company_id, role from users where lower(email) = $1', [email]);
    const ex = existing.rows[0];
    if (ex) {
      if (ex.company_id === companyId) fail(409, 'This person is already in your company.');
      if (ex.role === 'super_admin') fail(409, 'This email belongs to a platform administrator.');
      if (ex.company_id) fail(409, 'This email already belongs to another company.');
    }

    // A new invitation replaces any older open one for the same email.
    await query(
      `update invitations set revoked_at = now()
        where company_id = $1 and lower(email) = $2 and accepted_at is null and revoked_at is null`,
      [companyId, email]
    );
    const seats = await seatUsage(companyId);
    if (seats.used + seats.pending >= seats.seat_limit) {
      fail(409, `Your plan allows ${seats.seat_limit} seats and they are all in use. Contact Transcend to add more.`);
    }

    const token = newToken();
    const { rows } = await query(
      `insert into invitations (company_id, email, full_name, role, token_hash, invited_by, expires_at)
       values ($1, $2, $3, $4, $5, $6, now() + ($7 || ' days')::interval)
       returning id, email, full_name, role, expires_at`,
      [companyId, email, fullName, role, hashToken(token), user.id, String(INVITE_DAYS)]
    );
    await audit(user, 'employee.invite', { companyId, target: email, meta: { role } });
    res.status(201).json({ invite: rows[0], link: inviteLink(token) });
  },
});
