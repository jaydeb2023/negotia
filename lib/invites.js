import { query } from './db';
import { companyAdminIds, notify } from './notify';

export const INVITE_DAYS = 14;

export function inviteLink(token) {
  const base = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
  return `${base}/invite/${token}`;
}

// Seats = active people in the company. Pending invitations also reserve a seat.
export async function seatUsage(companyId) {
  const { rows } = await query(
    `select
       (select count(*)::int from users where company_id = $1 and status = 'active') as used,
       (select count(*)::int from invitations
          where company_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()) as pending,
       (select seat_limit from companies where id = $1) as seat_limit`,
    [companyId]
  );
  return rows[0];
}

export async function pendingInviteByEmail(email) {
  const { rows } = await query(
    `select i.*, c.name as company_name, c.status as company_status
       from invitations i join companies c on c.id = i.company_id
      where lower(i.email) = lower($1) and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
      order by i.created_at desc limit 1`,
    [email]
  );
  return rows[0] || null;
}

// Attaches an existing user to the company from an invitation and closes the invitation.
export async function consumeInvite(invite, userId) {
  await query(
    `update users set company_id = $1, role = $2, status = 'active' where id = $3`,
    [invite.company_id, invite.role, userId]
  );
  await query('update invitations set accepted_at = now() where id = $1', [invite.id]);
  const admins = await companyAdminIds(invite.company_id);
  await notify(admins, {
    kind: 'invite_accepted',
    title: 'New team member joined',
    body: `${invite.email} accepted the invitation.`,
    link: '/company/employees',
  });
}
