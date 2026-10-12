-- Negotia platform schema (v2). Safe to run many times: works for a fresh database
-- and upgrades an existing v1 database (companies, roles, assignments, notifications...).
--   npm run db:init

-- ---------- companies ----------
create table if not exists companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  status        text not null default 'active',
  seat_limit    int  not null default 10,
  contact_name  text,
  contact_email text,
  contact_phone text,
  notes         text,
  created_at    timestamptz not null default now()
);
alter table companies drop constraint if exists companies_status_check;
alter table companies add  constraint companies_status_check check (status in ('active', 'suspended'));
alter table companies drop constraint if exists companies_seat_check;
alter table companies add  constraint companies_seat_check check (seat_limit >= 1);

-- ---------- users ----------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text,                       -- null for Google-only accounts
  full_name     text,
  role          text not null default 'individual',
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_lower_idx on users (lower(email));
alter table users add column if not exists company_id    uuid references companies(id) on delete set null;
alter table users add column if not exists status        text not null default 'active';
alter table users add column if not exists last_login_at timestamptz;
-- v1 had roles trainee/admin; v2 has super_admin / company_admin / employee / individual
alter table users drop constraint if exists users_role_check;
update users set role = 'super_admin' where role = 'admin';
update users set role = 'individual'  where role = 'trainee';
alter table users alter column role set default 'individual';
alter table users add constraint users_role_check check (role in ('super_admin', 'company_admin', 'employee', 'individual'));
alter table users drop constraint if exists users_status_check;
alter table users add  constraint users_status_check check (status in ('active', 'disabled'));
create index if not exists users_company_idx on users (company_id);

-- ---------- personas ----------
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
-- company_id null = shared library (everyone); set = visible only to that company
alter table scenarios add column if not exists company_id uuid references companies(id) on delete cascade;
create index if not exists scenarios_company_idx on scenarios (company_id);

-- ---------- practice sessions ----------
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
alter table sessions add column if not exists company_id uuid references companies(id) on delete set null;
alter table sessions add column if not exists feedback   text;
-- (sessions made before someone joined a company stay private to that person: company_id stays null)
create index if not exists sessions_user_idx    on sessions (user_id);
create index if not exists sessions_company_idx on sessions (company_id);
create index if not exists sessions_created_idx on sessions (created_at desc);

-- ---------- invitations (company admin invites an employee by link) ----------
create table if not exists invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'employee' check (role in ('employee', 'company_admin')),
  token_hash  text not null unique,
  invited_by  uuid references users(id) on delete set null,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists invitations_company_idx on invitations (company_id);
create index if not exists invitations_email_idx   on invitations (lower(email));

-- ---------- assignments (practice calls or training given to employees) ----------
create table if not exists assignments (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  created_by   uuid references users(id) on delete set null,
  kind         text not null check (kind in ('practice', 'training')),
  title        text not null,
  instructions text,
  resource_url text,
  scenario_id  uuid references scenarios(id) on delete set null,
  due_date     date,
  created_at   timestamptz not null default now()
);
create index if not exists assignments_company_idx on assignments (company_id);

create table if not exists assignment_users (
  assignment_id uuid not null references assignments(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'completed')),
  completed_at  timestamptz,
  session_id    uuid references sessions(id) on delete set null,
  primary key (assignment_id, user_id)
);
create index if not exists assignment_users_user_idx on assignment_users (user_id);

-- ---------- notifications ----------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  kind       text not null default 'system',
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

-- ---------- website requests (contact form + "sign up your company") ----------
create table if not exists leads (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'contact' check (kind in ('contact', 'company')),
  name         text not null,
  email        text not null,
  phone        text,
  company_name text,
  team_size    text,
  message      text,
  status       text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  company_id   uuid references companies(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists leads_created_idx on leads (created_at desc);

-- ---------- audit log ----------
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references users(id) on delete set null,
  actor_email text,
  company_id  uuid references companies(id) on delete set null,
  action      text not null,
  target      text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_created_idx on audit_log (created_at desc);
create index if not exists audit_company_idx on audit_log (company_id);
