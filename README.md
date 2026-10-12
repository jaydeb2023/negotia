# Negotia (Transcend): voice sales-negotiation training platform

Next.js 14 app with its own PostgreSQL database, NextAuth login (email + Google) and the Groq API
for the AI dealers, speech-to-text and scoring.

## What is inside
- **Website:** `/` Home, `/about`, `/lms`, `/contact`, `/company-signup`
- **Practice app** (`/app`, `/practice`): individuals and employees practice with AI dealers
- **Company dashboard** (`/company/*`): employees, invitations, assignments, activity, export
- **Super admin** (`/super/*`): companies, requests, personas, all users, activity log
- **Roles:** `super_admin`, `company_admin`, `employee`, `individual`. Companies are fully separated.

## Setup (new server)
1. Create the database:
   ```sql
   CREATE USER negotia WITH PASSWORD 'choose-a-strong-password';
   CREATE DATABASE negotia OWNER negotia;
   ```
2. `cp .env.example .env.local` and fill in every value.
3. `npm install`
4. `npm run db:init` (creates or upgrades the tables; safe to run again)
5. `npm run db:import-scenarios -- scenarios.json` (optional, personas exported from the old system)
6. `npm run build && npm start` (use PM2 in production)

See `UPGRADE.md` for moving an existing install to this version.

## Super admins
Emails in `ADMIN_EMAILS` become super admins when they sign in.

## Things to edit
- `lib/site.js`: public email, phone and address shown in the website footer and Contact page.

## Backups
`pg_dump -U negotia negotia | gzip > negotia-$(date +%F).sql.gz`
