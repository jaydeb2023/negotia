-- Negotia schema for PostgreSQL on the VPS.
-- Run once:  psql "$DATABASE_URL" -f db/schema.sql

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text,                       -- null for Google-only accounts
  full_name     text,
  role          text not null default 'trainee' check (role in ('trainee', 'admin')),
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_lower_idx on users (lower(email));

create table if not exists scenarios (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  avatar_emoji text default '🧑‍💼',
  difficulty   int not null default 1,
  tagline      text,
  opening_line text default 'Hello, haan boliye.',
  system_prompt text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete set null,
  trainee_name    text not null,
  scenario_id     uuid references scenarios(id) on delete set null,
  scenario_name   text,
  transcript      jsonb not null default '[]',
  outcome         text,   -- 'RP1_success' | 'RP2_success' | 'WP1' | 'WP2' | 'incomplete'
  cases_ordered   int not null default 0,
  behaviour_score int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_created_idx on sessions (created_at desc);
