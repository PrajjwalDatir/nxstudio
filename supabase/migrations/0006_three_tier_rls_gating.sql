-- 0006_three_tier_rls_gating.sql
-- 3-Tier Subscription & RLS Gating Model (Free: 1 project, 10 USDT: 5 projects + Collections, 50 USDT: Unlimited + Workflows)

alter table public.subscriptions
  add column if not exists plan_tier   text not null default 'free',
  add column if not exists plan_amount numeric not null default 0;

-- Helper function: Returns integer project limit for user based on active sub (1 for free, 5 for 10 USDT, NULL for 50 USDT)
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

  -- Active or grace period check
  if sub_status = 'active' or (period_end is not null and period_end + interval '48 hours' > now()) then
    if sub_plan = 'master_50' or sub_plan = '50' then
      return null; -- Unlimited
    elsif sub_plan = 'pro_10' or sub_plan = '10' then
      return 5;
    end if;
  end if;

  return 1; -- Free default
end;
$$;

-- Trigger: Enforce Project Limit BEFORE INSERT on public.projects
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

-- Trigger: Enforce Collections Access BEFORE INSERT on public.collections (Free users cannot create Collections)
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
