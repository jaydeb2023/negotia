# Upgrading an existing install (previous version with admin / trainee roles)

Run on the server, in the project folder (`/var/www/negotia`):

```bash
cd /var/www/negotia
pg_dump negotia | gzip > ~/negotia-before-upgrade.sql.gz   # run as the postgres user if asked
git pull
npm install
npm run db:init          # upgrades the tables; old "admin" users become super admins, "trainee" become individuals
npm run build
pm2 restart negotia --update-env
```

Check the settings file keeps these values (no change is needed if they are already there):
`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GROQ_API_KEY`, `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

Optional: `GROQ_REASONING_EFFORT=medium` (already the default).

What changes for people:
- `/` is now the public website. The practice app moved to `/app`. People sign in at `/login`.
- Existing Google users sign in as before and are matched by email.
- The AI routes (`/api/chat`, `/api/transcribe`, `/api/score`) now require a signed-in user.

After the first sign-in, a super admin can add companies at `/super/companies`.
