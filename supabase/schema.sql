-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  trainee_name text not null,
  scenario text not null default 'gupta_ji_level1',
  transcript jsonb not null default '[]',
  outcome text,                -- 'RP1_success' | 'RP2_success' | 'WP1' | 'WP2' | 'incomplete'
  cases_ordered int default 0,
  behaviour_score int default 0,
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;

create policy "Allow anon insert" on sessions
  for insert to anon
  with check (true);

create policy "Allow anon select" on sessions
  for select to anon
  using (true);
