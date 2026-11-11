-- 0008_expert_prompts_approval.sql
-- 1. Create user_roles table for database-level role-based access control (RBAC)
create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'user' check (role in ('user', 'expert', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- RLS: Users can read their own role
drop policy if exists "Users can view their own role" on public.user_roles;
create policy "Users can view their own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Helper function: Check if a user is an admin
create or replace function public.is_admin(u_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  u_role text;
begin
  select role into u_role from public.user_roles where user_id = u_id;
  return u_role = 'admin';
end;
$$;

-- Helper function: Check if a user is an expert or admin
create or replace function public.is_expert_or_admin(u_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  u_role text;
begin
  select role into u_role from public.user_roles where user_id = u_id;
  return u_role in ('expert', 'admin');
end;
$$;

-- 2. Create enum for prompt approval status
do $$ begin
  create type public.prompt_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- 3. Add category and approval metadata columns to prompt_templates
alter table public.prompt_templates 
  add column if not exists category text not null default 'general',
  add column if not exists status public.prompt_status not null default 'approved',
  add column if not exists submitted_by text null,
  add column if not exists is_public boolean not null default true;

-- 4. Update existing templates with categories
update public.prompt_templates set category = 'qa' where id = 'qa';
update public.prompt_templates set category = 'security' where id = 'security';
update public.prompt_templates set category = 'performance' where id = 'performance';
update public.prompt_templates set category = 'visual' where id in ('accessibility');
update public.prompt_templates set category = 'deploy' where id = 'deploy';

-- 5. Insert Apple HIG prompt template
insert into public.prompt_templates (id, title, description, category, body, sort, status, is_public)
values (
  'apple_hig',
  'Apple HIG Compliance Audit',
  'Audit typography, touch targets, haptics, motion, and contrast against Apple HIG.',
  'visual',
  $body${{ctx}}

Act as a Principal Human Interface Guidelines (HIG) Designer for Apple platforms.
Audit "{{name}}" against Apple's HIG principles:
1. Typography & Hierarchy: System font scaling, dynamic type readability, and contrast ratios.
2. Touch & Click Targets: Minimum 44x44pt interactive bounds, clear focus indicators, keyboard shortcuts.
3. Motion & Transitions: Fluid micro-animations with spring physics and zero layout shifts.
4. Dark / Light Adaptability: Seamless color token usage, elevation shadows, and backdrop blurs.
Enforce HIG guidelines directly on the UI components and list any structural design recommendations.$body$,
  6,
  'approved',
  true
) on conflict (id) do update set 
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  body = excluded.body;

-- 6. RLS Policies for prompt_templates
alter table public.prompt_templates enable row level security;

drop policy if exists "Users can view approved public prompt templates" on public.prompt_templates;
create policy "Users can view approved public prompt templates"
  on public.prompt_templates for select
  using (status = 'approved' and is_public = true);

drop policy if exists "Experts and Admins can submit prompt templates" on public.prompt_templates;
create policy "Experts and Admins can submit prompt templates"
  on public.prompt_templates for insert
  with check (auth.uid() is not null and public.is_expert_or_admin(auth.uid()));
