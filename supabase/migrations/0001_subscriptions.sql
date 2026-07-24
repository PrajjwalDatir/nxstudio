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
