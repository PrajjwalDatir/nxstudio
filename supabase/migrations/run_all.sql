-- ============================================================================
-- run_all.sql — full nx-studio schema, in dependency order.
-- Paste this whole file into the Supabase SQL editor and run once.
-- It is the concatenation of 0001 -> 0002 -> 0003 -> 0004 -> 0005 (all
-- idempotent, so re-running is safe). Order matters: 0001 defines
-- public.subscriptions and touch_updated_at(), which the rest depend on.
-- ============================================================================

-- >>> 0001_subscriptions.sql <<<
-- Subscriptions table for Razorpay billing.
-- Run this in the Supabase SQL editor (or via the Supabase CLI).
--
-- Security model:
--   * RLS is ON.
--   * Authenticated users may SELECT only their own row.
--   * There are NO insert/update/delete policies, so those are denied for the
--     anon and authenticated roles. All writes go through the service-role key
--     (the Razorpay webhook + the subscribe route), which bypasses RLS.

create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  razorpay_subscription_id text unique,
  razorpay_customer_id     text,
  plan_id                  text,
  -- created | authenticated | active | pending | halted | cancelled | completed | expired
  status                   text not null default 'created',
  current_start            timestamptz,
  current_end              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at current on every write.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row
  execute function public.touch_updated_at();


-- >>> 0002_projects.sql <<<
-- Projects: per-user workspaces. Run in the Supabase SQL editor.
--
-- One row per project. The document-shaped workspace lives in `data` (jsonb);
-- name, github_*, and due_dates are lifted into columns so the Projects list
-- and calendar can read them cheaply. RLS scopes every operation to the owner.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Untitled',
  data          jsonb not null default '{}'::jsonb,
  github_repo   text,
  github_branch text not null default 'main',
  due_dates     jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id, created_at);

alter table public.projects enable row level security;

-- Owner-only CRUD. `with check` on insert/update prevents assigning rows to
-- another user_id.
drop policy if exists "select own projects" on public.projects;
create policy "select own projects"
  on public.projects for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own projects" on public.projects;
create policy "insert own projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own projects" on public.projects;
create policy "update own projects"
  on public.projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own projects" on public.projects;
create policy "delete own projects"
  on public.projects for delete to authenticated
  using (auth.uid() = user_id);

-- Reuses the touch_updated_at() function from 0001_subscriptions.sql. If you
-- run this migration standalone, uncomment the function definition below.
-- create or replace function public.touch_updated_at()
-- returns trigger language plpgsql as $$
-- begin new.updated_at = now(); return new; end; $$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();


-- >>> 0003_web3_billing.sql <<<
-- Web3 (Solana USDC/USDT) billing + server-side prompt gating.
-- Run in the Supabase SQL editor (or via the Supabase CLI). Idempotent.
--
-- Three changes:
--   1. Extend `subscriptions` with crypto-cycle columns (Razorpay rows keep working).
--   2. `crypto_payments`  — verified on-chain payments; PK on the signature is the
--      replay guard. Service-role writes only; owners may read their history.
--   3. `prompt_templates` — the prompt prose, moved out of the client bundle. RLS is
--      ON with NO policies, so only the service-role key can read it; a logged-in
--      client querying it directly gets nothing. The server compiles the final
--      prompt from these rows for premium users only.

create extension if not exists pgcrypto;

/* ----------------------------------------------------------------- */
/* 1. subscriptions — crypto columns                                 */
/* ----------------------------------------------------------------- */

alter table public.subscriptions
  add column if not exists provider           text not null default 'razorpay',
  add column if not exists current_period_end timestamptz,
  add column if not exists pending_reference  text,
  add column if not exists pending_amount     numeric,
  add column if not exists pending_mint       text;

-- Look up a row by the reference we handed out (used during verify).
create index if not exists subscriptions_pending_reference_idx
  on public.subscriptions (pending_reference);

/* ----------------------------------------------------------------- */
/* 2. crypto_payments — audit log + replay guard                     */
/* ----------------------------------------------------------------- */

create table if not exists public.crypto_payments (
  signature   text primary key,                 -- unique => a tx extends one cycle, ever
  user_id     uuid not null references auth.users (id) on delete cascade,
  reference   text,
  mint        text,
  amount      numeric,
  verified_at timestamptz not null default now()
);

create index if not exists crypto_payments_user_id_idx
  on public.crypto_payments (user_id, verified_at);

alter table public.crypto_payments enable row level security;

-- Owners may read their own payment history. There are deliberately NO
-- insert/update/delete policies: all writes go through the service-role key
-- after on-chain verification, so the client can never fabricate a payment.
drop policy if exists "read own crypto payments" on public.crypto_payments;
create policy "read own crypto payments"
  on public.crypto_payments for select to authenticated
  using (auth.uid() = user_id);

/* ----------------------------------------------------------------- */
/* 3. prompt_templates — server-only prompt prose                    */
/* ----------------------------------------------------------------- */

create table if not exists public.prompt_templates (
  id          text primary key,   -- idea | master | qa | security | performance | accessibility | deploy
  title       text not null,
  description text not null default '',
  body        text not null,      -- prose with {{placeholders}} the server fills
  sort        int  not null default 0,
  updated_at  timestamptz not null default now()
);

-- RLS ON, no policies -> unreadable by anon/authenticated; service-role bypasses RLS.
alter table public.prompt_templates enable row level security;

drop trigger if exists prompt_templates_touch_updated_at on public.prompt_templates;
create trigger prompt_templates_touch_updated_at
  before update on public.prompt_templates
  for each row execute function public.touch_updated_at();

-- Seed from the current prompts.ts strings. Re-running updates the bodies in place.
insert into public.prompt_templates (id, title, description, body, sort) values
(
  'idea',
  'Idea pressure-test',
  'Stress-test the problem, users, and differentiation before you build.',
  $body$Act as a startup strategist. Pressure-test this idea for "{{productName}}".

Problem: {{problem}}
Target users: {{targetUsers}}
How they solve it today: {{currentSolutions}}
Our differentiation: {{differentiation}}

Return: the 3 riskiest assumptions, who to interview first, and a one-line
sharpened problem statement.$body$,
  -1
),
(
  'master',
  'Your build prompt',
  'One prompt that creates your .nx/ context and builds the foundation in a single run.',
  $body$You are the lead engineer building "{{name}}" in one continuous agentic run.
Stack: {{fe}} ({{lang}}). Research any API or library you're unsure about before you use it.

## Step 0 — Establish the context
Create a `{{nxRoot}}/` directory at the repo root with these files, verbatim.
This is your single source of truth — re-read it before each step and follow it exactly.

{{nxFileBlocks}}

## Step 1 — Build the foundation, end to end
Do NOT stop between steps. Work through them in order, verifying as you go:

{{buildSteps}}

After each feature, run the project's checks before moving on. When the foundation
is complete, commit it and summarise what was built and what remains.$body$,
  0
),
(
  'qa',
  'QA & test coverage',
  'Find broken states and cover the core flows with tests.',
  $body${{ctx}}

Act as the QA engineer for "{{name}}". Exercise the core user flows, enumerate the
edge cases and broken/empty/error states, and write automated tests that cover
them. Fix the bugs you surface. Report a short coverage summary and any risks left.$body$,
  1
),
(
  'security',
  'Security review',
  'Audit auth, input handling, secrets, and dependencies.',
  $body${{ctx}}

Act as an application security reviewer for "{{name}}". Audit: authentication and
session handling, authorization / object-level access, input validation and
injection, secrets or keys exposed to the client, and dependency CVEs. Fix what is
safe to fix and produce a prioritised list of what needs human review.$body$,
  2
),
(
  'performance',
  'Performance pass',
  'Profile and fix slow renders, bundles, and queries.',
  $body${{ctx}}

Profile "{{name}}" and improve performance: slow renders and re-renders, oversized
bundles, unoptimised images/assets, and N+1 or slow queries. Apply the fixes and
report before/after numbers for the metrics you moved.$body$,
  3
),
(
  'accessibility',
  'Accessibility audit',
  'Get the UI to WCAG AA.',
  $body${{ctx}}

Audit "{{name}}" against WCAG 2.2 AA: keyboard navigation and focus order, colour
contrast, form labels and error messaging, and screen-reader semantics. Fix the
issues directly in the components and note anything that needs design input.$body$,
  4
),
(
  'deploy',
  'Ship to production',
  'Set up CI/CD and deploy to your host.',
  $body${{ctx}}

Set up production deployment for "{{name}}" to {{host}}: CI/CD on push to `main`,
environment variables and secrets, preview builds for pull requests, framework-native
analytics/telemetry (structured logging + page/event tracking), and a post-deploy
smoke test. Write the runbook into `{{nxRoot}}/hosting.md`.$body$,
  5
)
on conflict (id) do update set
  title       = excluded.title,
  description = excluded.description,
  body        = excluded.body,
  sort        = excluded.sort,
  updated_at  = now();


/* ------------------------------------------------------------------ */
/* 0004_collections — named groups that hold products (projects)      */
/* ------------------------------------------------------------------ */

create table if not exists public.collections (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null default 'Untitled',
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_user_id_idx on public.collections (user_id, sort);

alter table public.collections enable row level security;

drop policy if exists "select own collections" on public.collections;
create policy "select own collections"
  on public.collections for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own collections" on public.collections;
create policy "insert own collections"
  on public.collections for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own collections" on public.collections;
create policy "update own collections"
  on public.collections for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own collections" on public.collections;
create policy "delete own collections"
  on public.collections for delete to authenticated
  using (auth.uid() = user_id);

drop trigger if exists collections_touch_updated_at on public.collections;
create trigger collections_touch_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();

alter table public.projects
  add column if not exists collection_id text
  references public.collections (id) on delete set null;

create index if not exists projects_collection_id_idx on public.projects (collection_id);


/* ------------------------------------------------------------------ */
/* 0005_referrals — affiliate attribution (codes + referred users)    */
/* ------------------------------------------------------------------ */

create table if not exists public.referral_codes (
  code       text primary key,
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

drop policy if exists "read own referral code" on public.referral_codes;
create policy "read own referral code"
  on public.referral_codes for select to authenticated
  using (auth.uid() = user_id);

create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references auth.users (id) on delete cascade,
  referred_user_id  uuid not null unique references auth.users (id) on delete cascade,
  code              text not null references public.referral_codes (code),
  status            text not null default 'pending',
  converted_at      timestamptz,
  created_at        timestamptz not null default now(),
  constraint no_self_referral check (referrer_user_id <> referred_user_id)
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_user_id, status);

alter table public.referrals enable row level security;

drop policy if exists "read own referrals" on public.referrals;
create policy "read own referrals"
  on public.referrals for select to authenticated
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

/* ------------------------------------------------------------------ */
/* 0006_three_tier_rls_gating — 3-tier RLS triggers & limits          */
/* ------------------------------------------------------------------ */

alter table public.subscriptions
  add column if not exists plan_tier   text not null default 'free',
  add column if not exists plan_amount numeric not null default 0;

create or replace function public.get_user_project_limit(u_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  sub_plan text;
  sub_status text;
  period_end timestamptz;
begin
  select plan_id, status, current_period_end
    into sub_plan, sub_status, period_end
    from public.subscriptions
   where user_id = u_id;

  if sub_status = 'active' or (period_end is not null and period_end + interval '48 hours' > now()) then
    if sub_plan = 'master_50' or sub_plan = '50' then
      return null;
    elsif sub_plan = 'pro_10' or sub_plan = '10' then
      return 5;
    end if;
  end if;

  return 1;
end;
$$;

create or replace function public.enforce_project_limit_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  lim integer;
  cnt integer;
begin
  lim := public.get_user_project_limit(NEW.user_id);
  if lim is not null then
    select count(*) into cnt from public.projects where user_id = NEW.user_id;
    if cnt >= lim then
      raise exception 'Project limit of % reached for your subscription tier. Upgrade your plan to build more workspaces.', lim
        using errcode = 'P0001';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists check_project_limit_before_insert on public.projects;
create trigger check_project_limit_before_insert
  before insert on public.projects
  for each row execute function public.enforce_project_limit_trigger();

create or replace function public.enforce_collections_access_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  lim integer;
begin
  lim := public.get_user_project_limit(NEW.user_id);
  if lim = 1 then
    raise exception 'Project Collections are available on Atelier (10 USDT) and Black Label (50 USDT) tiers.'
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

drop trigger if exists check_collections_access_before_insert on public.collections;
create trigger check_collections_access_before_insert
  before insert on public.collections
  for each row execute function public.enforce_collections_access_trigger();


-- 0007_two_tier_simplify.sql
-- Collapse to a 2-tier model (Free, Pro 10 USDT/28 days). Free gets 1 Active
-- Project Workspace; Pro is unlimited and has no gates at all — Collections,
-- Prompt Gallery, and Autonomous Machine Workflows are all unlocked on Pro
-- (Machine Workflows are also unlocked on Free — only Collections/Gallery
-- distinguish the tiers).
--
-- Also (re-)adds plan_tier/plan_amount in case 0006 was never applied to this
-- database — this is what causes "Could not find the 'plan_amount' column of
-- 'subscriptions' in the schema cache" when redeeming a promo code.

alter table public.subscriptions
  add column if not exists plan_tier   text not null default 'free',
  add column if not exists plan_amount numeric not null default 0;

-- Returns the project-workspace limit for a user: NULL (unlimited) on an
-- active/grace Pro subscription, 1 otherwise (Free).
create or replace function public.get_user_project_limit(u_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  sub_plan text;
  sub_status text;
  period_end timestamptz;
begin
  select plan_id, status, current_period_end
    into sub_plan, sub_status, period_end
    from public.subscriptions
   where user_id = u_id;

  if (sub_plan = 'pro_10' or sub_plan = '10')
     and (sub_status = 'active' or (period_end is not null and period_end + interval '48 hours' > now())) then
    return null; -- Unlimited
  end if;

  return 1; -- Free default
end;
$$;

-- Trigger: Enforce Project Limit BEFORE INSERT on public.projects.
create or replace function public.enforce_project_limit_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  lim integer;
  cnt integer;
begin
  lim := public.get_user_project_limit(NEW.user_id);
  if lim is not null then
    select count(*) into cnt from public.projects where user_id = NEW.user_id;
    if cnt >= lim then
      raise exception 'Project limit of % reached for your subscription tier. Upgrade your plan to build more workspaces.', lim
        using errcode = 'P0001';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists check_project_limit_before_insert on public.projects;
create trigger check_project_limit_before_insert
  before insert on public.projects
  for each row execute function public.enforce_project_limit_trigger();

-- Trigger: Enforce Collections Access BEFORE INSERT on public.collections
-- (Free users cannot create Collections; Pro can, along with everything else).
create or replace function public.enforce_collections_access_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  sub_plan text;
  sub_status text;
  period_end timestamptz;
  is_pro boolean;
begin
  select plan_id, status, current_period_end
    into sub_plan, sub_status, period_end
    from public.subscriptions
   where user_id = NEW.user_id;

  is_pro := (sub_plan = 'pro_10' or sub_plan = '10')
    and (sub_status = 'active' or (period_end is not null and period_end + interval '48 hours' > now()));

  if not is_pro then
    raise exception 'Project Collections are available on the Pro (10 USDT) tier.'
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;

drop trigger if exists check_collections_access_before_insert on public.collections;
create trigger check_collections_access_before_insert
  before insert on public.collections
  for each row execute function public.enforce_collections_access_trigger();


-- >>> 0011_mcp_tokens.sql <<<
-- Model Context Protocol (MCP) authentication and agent telemetry

create table if not exists public.mcp_tokens (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Agent Client',
  token_hash    text not null unique,
  token_prefix  text not null,
  expires_at    timestamptz,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists mcp_tokens_user_id_idx on public.mcp_tokens (user_id, created_at desc);
create index if not exists mcp_tokens_hash_idx on public.mcp_tokens (token_hash);

alter table public.mcp_tokens enable row level security;

drop policy if exists "select own mcp tokens" on public.mcp_tokens;
create policy "select own mcp tokens"
  on public.mcp_tokens for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own mcp tokens" on public.mcp_tokens;
create policy "insert own mcp tokens"
  on public.mcp_tokens for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own mcp tokens" on public.mcp_tokens;
create policy "update own mcp tokens"
  on public.mcp_tokens for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own mcp tokens" on public.mcp_tokens;
create policy "delete own mcp tokens"
  on public.mcp_tokens for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists public.mcp_agent_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  project_id    text references public.projects (id) on delete cascade,
  node_id       text not null,
  status        text not null check (status in ('pending', 'in_progress', 'completed', 'failed')),
  agent_id      text,
  notes         text,
  commit_hash   text,
  created_at    timestamptz not null default now()
);

create index if not exists mcp_agent_progress_proj_node_idx on public.mcp_agent_progress (project_id, node_id, created_at desc);
create index if not exists mcp_agent_progress_user_idx on public.mcp_agent_progress (user_id, created_at desc);

alter table public.mcp_agent_progress enable row level security;

drop policy if exists "select own mcp progress" on public.mcp_agent_progress;
create policy "select own mcp progress"
  on public.mcp_agent_progress for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own mcp progress" on public.mcp_agent_progress;
create policy "insert own mcp progress"
  on public.mcp_agent_progress for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "delete own mcp progress" on public.mcp_agent_progress;
create policy "delete own mcp progress"
  on public.mcp_agent_progress for delete to authenticated
  using (auth.uid() = user_id);
