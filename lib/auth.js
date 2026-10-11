import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { query } from './db';

// Emails listed in ADMIN_EMAILS (comma separated) always get the admin role.
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || '').toLowerCase());
}

async function promoteIfAdmin(user) {
  if (user.role !== 'admin' && isAdminEmail(user.email)) {
    await query("update users set role = 'admin' where id = $1", [user.id]);
    user.role = 'admin';
  }
  return user;
}

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

        const { rows } = await query('select * from users where lower(email) = $1', [email]);
        const user = rows[0];
        if (!user || !user.password_hash) return null; // unknown, or Google-only account
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        await promoteIfAdmin(user);
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
      // Only accept Google accounts whose email Google has verified.
      if (account?.provider === 'google') return profile?.email_verified === true;
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        // Find or create the user for this Google account (matched by email).
        const email = profile.email.toLowerCase();
        let { rows } = await query('select * from users where lower(email) = $1', [email]);
        if (!rows[0]) {
          ({ rows } = await query(
            'insert into users (email, full_name) values ($1, $2) returning *',
            [email, profile.name || email]
          ));
        }
        const dbUser = await promoteIfAdmin(rows[0]);
        token.uid = dbUser.id;
      } else if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Always read the latest name/role from the database.
      const { rows } = await query('select id, email, full_name, role from users where id = $1', [token.uid]);
      if (!rows[0]) return { ...session, user: null };
      session.user = rows[0];
      return session;
    },
  },
};

// ---- helpers for API routes ----
export async function requireUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    res.status(401).json({ error: 'Not signed in' });
    return null;
  }
  return session.user;
}

export async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admins only' });
    return null;
  }
  return user;
}
