# Negotia — Voice Practice & Learning Platform (Phase 1)

AI voice negotiation practice tool. A trainee practices a sales negotiation
against "Gupta Ji", an AI-voiced dealer persona, by speaking out loud in the
browser. At the end of the call, the session is scored and saved so an admin
can see everyone's practice history on a dashboard.

This is the **Phase 1 (voice + dashboard)** scope — no login/registration,
no quiz engine, no admin knowledge-base panel yet. Those are planned as
later phases (see "Roadmap" below).

## Architecture

```
User opens site
      |
      v
 [ Start Practice ]
      |
      v
  You speak (mic) --> Groq Whisper (speech-to-text)
      ^                        |
      |                        v
 Browser speaks <-- Groq LLM (replies as Gupta Ji)
  reply aloud     (repeats each turn until call ends)
      |
      v
   Call ends --> outcome + score computed
      |
      v
  Saved to Supabase (transcript, outcome, cases ordered)
      |
      v
   Dashboard (admin sees every trainee's session history)
```

**Stack, and why:**

| Layer | Tool | Cost |
|---|---|---|
| Frontend + API routes | Next.js (Pages Router) | Free |
| Hosting | Vercel | Free tier |
| Code hosting | GitHub | Free |
| Speech-to-text | Groq Whisper (`whisper-large-v3`) | Free tier (rate-limited) |
| AI brain (Gupta Ji) | Groq LLM (`llama-3.3-70b-versatile`) | Free tier (rate-limited) |
| Text-to-speech | Browser `SpeechSynthesis` API | Free, no key needed |
| Database | Supabase (Postgres) | Free tier |

Only Groq has usage limits on the free tier (roughly 30 requests/minute,
with daily token caps that vary by model). Fine for a demo or small pilot;
if usage grows past that, Groq's paid tier is still inexpensive.

## Project structure

```
negotia/
├── pages/
│   ├── index.js          Landing page (Start Practice / Dashboard links)
│   ├── practice.js       The voice practice screen
│   ├── dashboard.js      Admin dashboard (session history per trainee)
│   ├── _app.js           Next.js app wrapper
│   └── api/
│       ├── transcribe.js     POST audio -> Groq Whisper -> text
│       ├── chat.js           POST conversation history -> Groq LLM -> Gupta Ji's reply
│       └── save-session.js   POST session result -> Supabase insert
├── lib/
│   ├── supabaseClient.js     Supabase client setup
│   └── guptaJiPrompt.js      Gupta Ji's system prompt (the "knowledge base" for now)
├── supabase/
│   └── schema.sql            Run this once in Supabase to create the sessions table
├── styles/
│   └── globals.css
├── .env.example
├── package.json
└── next.config.js
```

## Setup

### 1. Get a Groq API key (free)
1. Go to https://console.groq.com/keys
2. Sign up (no credit card needed) and create an API key.

### 2. Create a Supabase project (free)
1. Go to https://supabase.com and create a new project.
2. Open **SQL Editor** → **New query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates the `sessions` table.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Install and run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

**Note:** the browser will ask for microphone permission on the practice
page — allow it. Voice recording (`MediaRecorder`) works in Chrome, Edge,
and Firefox; Safari/iOS support is limited.

## Deploy to Vercel

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Gupta Ji voice practice"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. Go to https://vercel.com → **New Project** → import the GitHub repo.
3. In Vercel's project settings, add the same three environment variables
   from `.env.local` (Settings → Environment Variables).
4. Deploy. Vercel gives you a live `https://your-project.vercel.app` URL.

## How scoring currently works

This Phase 1 build uses a **simple heuristic** (in `pages/practice.js`,
`endCall()`) that checks Gupta Ji's last line for phrases like "2 cases" or
"5 cases" to guess the outcome. This is a placeholder — a more reliable
version would send the full transcript to an LLM as a separate "judge" call
after the session ends, scored against the rules in
`lib/guptaJiPrompt.js`. That's a good candidate for the next phase.

## Roadmap (future phases, not in this build)

- User login/registration (Supabase Auth)
- Admin panel to edit Gupta Ji's knowledge base without touching code
- Multiple scenarios/personas (Level 2, 3, 4 dealers)
- Real LLM-based scoring pass instead of the keyword heuristic
- n8n automation: admin notifications, onboarding form sync, reminders
- Quiz/assessment engine (age-wise categories)

## Known limitations of this free-tier build

- Groq's free tier is rate-limited (~30 requests/minute) — fine for a demo
  or small pilot, not for many concurrent users.
- Voice recording needs a Chromium-based browser or Firefox for best
  results; iOS Safari support is inconsistent.
- No authentication yet — the "trainee name" field is just a text input,
  not a real login. Anyone with the link can create sessions under any name.
- Row Level Security policies in `schema.sql` are wide open (`anon` can
  insert and read everything) — fine for an internal pilot, but tighten
  this before any public/production use.
