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
