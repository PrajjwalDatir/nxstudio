-- 0010_fix_promo_crypto_expiry_gating.sql
--
-- get_user_project_limit() and enforce_collections_access_trigger() (from
-- 0006/0007) unlock Pro whenever status = 'active' OR the grace-adjusted
-- current_period_end is in the future. That OR is correct for Razorpay,
-- whose status is kept fresh by webhooks on renewal/cancellation — but
-- promo (api/billing/promo/route.ts) and crypto (api/billing/crypto/verify/
-- route.ts) grants set status = 'active' exactly once, with no webhook or
-- job that ever flips it back. So a 30-day promo or a single crypto payment
-- currently unlocks unlimited projects and Collections at the DB layer
-- forever, past its real current_period_end — even though the app's own
-- deriveAccessState() (src/lib/billing.ts) already expires them correctly
-- client-side. This makes DB enforcement match that logic: promo/crypto are
-- gated purely on current_period_end (+ 48h grace); Razorpay keeps its
-- existing status-based check.

create or replace function public.get_user_project_limit(u_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  sub_plan text;
  sub_provider text;
  sub_status text;
  period_end timestamptz;
  is_pro boolean;
begin
  select plan_id, provider, status, current_period_end
    into sub_plan, sub_provider, sub_status, period_end
    from public.subscriptions
   where user_id = u_id;

  if sub_provider in ('promo', 'crypto') then
    is_pro := period_end is not null and period_end + interval '48 hours' > now();
  else
    is_pro := sub_status = 'active' or (period_end is not null and period_end + interval '48 hours' > now());
  end if;

  if (sub_plan = 'pro_10' or sub_plan = '10') and is_pro then
    return null; -- Unlimited
  end if;

  return 1; -- Free default
end;
$$;

create or replace function public.enforce_collections_access_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  sub_plan text;
  sub_provider text;
  sub_status text;
  period_end timestamptz;
  is_pro boolean;
begin
  select plan_id, provider, status, current_period_end
    into sub_plan, sub_provider, sub_status, period_end
    from public.subscriptions
   where user_id = NEW.user_id;

  if sub_provider in ('promo', 'crypto') then
    is_pro := (sub_plan = 'pro_10' or sub_plan = '10')
      and period_end is not null and period_end + interval '48 hours' > now();
  else
    is_pro := (sub_plan = 'pro_10' or sub_plan = '10')
      and (sub_status = 'active' or (period_end is not null and period_end + interval '48 hours' > now()));
  end if;

  if not is_pro then
    raise exception 'Project Collections are available on the Pro (10 USDT) tier.'
      using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;
