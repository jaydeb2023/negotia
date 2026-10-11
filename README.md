# Negotia (Transcend) — voice negotiation practice

Next.js 14 app. Runs on a VPS with its own **PostgreSQL** database and **NextAuth** login
(email/password + Google). AI replies and scoring use the Groq API.

## Setup

1. Create the database (once, as the Postgres admin):
   ```sql
   CREATE USER negotia WITH PASSWORD 'choose-a-strong-password';
   CREATE DATABASE negotia OWNER negotia;
   ```
2. `cp .env.example .env.local` and fill in every value (see comments inside).
3. `npm install`
4. `npm run db:init` — creates the tables.
5. `npm run db:import-scenarios -- scenarios.json` — loads the personas (optional, from an export).
6. `npm run build && npm start` (use PM2 in production).

## Roles
Emails listed in `ADMIN_EMAILS` become admins (they see Dashboard and Admin). Everyone else is a trainee.

## Layout
- `pages/api/auth/[...nextauth].js` login · `pages/api/register.js` sign-up
- `pages/api/scenarios/*` personas (admin edits) · `pages/api/sessions` practice results
- `pages/api/chat.js`, `score.js`, `transcribe.js` — Groq calls
- `lib/db.js` database pool · `lib/auth.js` login rules and API guards
- `db/schema.sql` tables

## Backups
`pg_dump -U negotia negotia | gzip > negotia-$(date +%F).sql.gz`
