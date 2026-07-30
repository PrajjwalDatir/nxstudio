-- Referrals / affiliate attribution. Run in the Supabase SQL editor AFTER
-- 0001_subscriptions.sql.
--
-- Two tables:
--   * referral_codes — one stable share code per user (the "resolve a code to a
--     person" mapping). Readable by the owner; codes are resolved server-side
--     with the service-role key during signup, so no public read policy exists.
--   * referrals — one attribution row per referred user (a user can be referred
--     at most once). Flips to 'converted' when the referred user goes premium.
--
-- Payout accounting (20–30% of the monthly fee for up to 6 months, prorated on
-- early cancellation) is computed from converted rows + subscription history at
-- payout time. It is intentionally NOT materialized here — payout mechanics
-- (wallet, schedule) aren't finalized yet.

create extension if not exists pgcrypto;

-- One stable code per user ----------------------------------------------------
create table if not exists public.referral_codes (
  code       text primary key,
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

-- Owner can read their own code. All writes go through the service-role key
-- (no insert/update/delete policy → denied for anon/authenticated).
drop policy if exists "read own referral code" on public.referral_codes;
create policy "read own referral code"
  on public.referral_codes for select to authenticated
  using (auth.uid() = user_id);

-- One attribution row per referred user --------------------------------------
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references auth.users (id) on delete cascade,
  -- A user can be referred at most once.
  referred_user_id  uuid not null unique references auth.users (id) on delete cascade,
  code              text not null references public.referral_codes (code),
  -- pending → referred user signed up; converted → they became premium.
  status            text not null default 'pending',
  converted_at      timestamptz,
  created_at        timestamptz not null default now(),
  constraint no_self_referral check (referrer_user_id <> referred_user_id)
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_user_id, status);

alter table public.referrals enable row level security;

-- Referrer sees who they referred (affiliate dashboard); the referred user sees
-- their own attribution row. All writes are service-role only.
drop policy if exists "read own referrals" on public.referrals;
create policy "read own referrals"
  on public.referrals for select to authenticated
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);
