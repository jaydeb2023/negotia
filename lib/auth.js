import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { query } from './db';
import { fail } from './api';
import { consumeInvite, pendingInviteByEmail } from './invites';

// Emails listed in ADMIN_EMAILS (comma separated) are always super admins.
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || '').toLowerCase());
}

const ACCOUNT_SQL = `
  select u.*, c.name as company_name, c.status as company_status
    from users u left join companies c on c.id = u.company_id`;

async function accountByEmail(email) {
  const { rows } = await query(`${ACCOUNT_SQL} where lower(u.email) = lower($1)`, [email]);
  return rows[0] || null;
}

async function accountById(id) {
  const { rows } = await query(`${ACCOUNT_SQL} where u.id = $1`, [id]);
  return rows[0] || null;
}

// 'ACCOUNT_DISABLED' | 'COMPANY_SUSPENDED' | null
function blockReason(u) {
  if (u.status === 'disabled') return 'ACCOUNT_DISABLED';
  if (u.company_id && u.company_status === 'suspended' && u.role !== 'super_admin') return 'COMPANY_SUSPENDED';
  return null;
}

async function promoteIfAdmin(u) {
  if (u.role !== 'super_admin' && isAdminEmail(u.email)) {
    await query("update users set role = 'super_admin', company_id = null where id = $1", [u.id]);
    u.role = 'super_admin';
    u.company_id = null;
  }
  return u;
}

const touchLogin = (id) => query('update users set last_login_at = now() where id = $1', [id]).catch(() => {});

export const authOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email || '').trim().toLowerCase();
        const password = String(credentials?.password || '');
        if (!email || !password) return null;

        const user = await accountByEmail(email);
        if (!user || !user.password_hash) return null; // unknown, or Google-only account
        if (!(await bcrypt.compare(password, user.password_hash))) return null;

        const why = blockReason(user);
        if (why) throw new Error(why); // shown on the login page
        await promoteIfAdmin(user);
        await touchLogin(user.id);
        return { id: user.id, email: user.email, name: user.full_name };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true;
      if (profile?.email_verified !== true) return false; // only accept emails Google has verified
      const existing = await accountByEmail(profile.email);
      const why = existing && blockReason(existing);
      return why ? `/login?error=${why}` : true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        const email = profile.email.toLowerCase();
        let u = await accountByEmail(email);
        if (!u) {
          // New Google user: join the company if there is a pending invitation, otherwise individual.
          const invite = await pendingInviteByEmail(email);
          const { rows } = await query(
            'insert into users (email, full_name, role) values ($1, $2, $3) returning id',
            [email, profile.name || email, 'individual']
          );
          if (invite && invite.company_status === 'active') await consumeInvite(invite, rows[0].id);
          u = await accountById(rows[0].id);
        }
        await promoteIfAdmin(u);
        await touchLogin(u.id);
        token.uid = u.id;
      } else if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Always read the latest name, role and company from the database.
      const u = token.uid ? await accountById(token.uid) : null;
      if (!u || blockReason(u)) return { ...session, user: null }; // disabled or suspended: signed out
      session.user = {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        company_id: u.company_id,
        company_name: u.company_name,
      };
      return session;
    },
  },
};

// ---------- guards for API routes ----------
export async function currentUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  return session?.user?.id ? session.user : null;
}

export async function requireUser(req, res) {
  const user = await currentUser(req, res);
  if (!user) fail(401, 'Not signed in');
  return user;
}

export async function requireRoles(req, res, roles) {
  const user = await requireUser(req, res);
  if (!roles.includes(user.role)) fail(403, 'You do not have access to this');
  return user;
}

export const requireSuper = (req, res) => requireRoles(req, res, ['super_admin']);

// Kept for older routes: "admin" now means super admin.
export const requireAdmin = requireSuper;
