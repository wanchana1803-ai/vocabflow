-- ==============================================================================
-- Migration: 0003_auth_roles_and_permissions.sql
-- Description: Role-Based Access Control (Admin/User), RLS, Bookmarks & Audit Logs
-- ==============================================================================

-- 1. Alter profiles table to add role column with constraint
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles
    add column role text not null default 'user';
  end if;
end $$;

-- Enforce role constraint (only 'user' or 'admin')
alter table public.profiles drop constraint if exists chk_profiles_role;
alter table public.profiles add constraint chk_profiles_role check (role in ('user', 'admin'));

-- Index on role for fast permission lookups
create index if not exists idx_profiles_role on public.profiles (role);

-- ------------------------------------------------------------------------------
-- 2. Helper function: is_admin()
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role into v_role
  from public.profiles
  where id = auth.uid();

  return coalesce(v_role = 'admin', false);
end;
$$ language plpgsql security definer
set search_path = public, pg_temp;

-- Restrict execution rights: anonymous cannot execute is_admin
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. Trigger: Protect role modification on profiles
-- ------------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if (new.role is distinct from old.role) then
    -- Only existing admins or service_role can change roles
    if not public.is_admin() and (coalesce(auth.role(), '') <> 'service_role') then
      raise exception 'Only administrators can modify user roles';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer
set search_path = public, pg_temp;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- 4. Auto-provision profile on signup (guaranteed role = 'user')
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    'user' -- Always forced to 'user' on signup
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer
set search_path = public, pg_temp;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. Bookmarks Table
-- ------------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabularies(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint uq_user_bookmark unique (user_id, vocabulary_id)
);

create index if not exists idx_bookmarks_user on public.bookmarks (user_id);
create index if not exists idx_bookmarks_vocab on public.bookmarks (vocabulary_id);

alter table public.bookmarks enable row level security;

drop policy if exists "Users can view own bookmarks" on public.bookmarks;
create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add own bookmarks" on public.bookmarks;
create policy "Users can add own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Admin Audit Logs Table
-- ------------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in (
    'vocabulary_created',
    'vocabulary_updated',
    'vocabulary_deleted',
    'vocabulary_imported',
    'image_uploaded',
    'image_replaced',
    'role_changed'
  )),
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_audit_admin_user on public.admin_audit_logs (admin_user_id);
create index if not exists idx_audit_action on public.admin_audit_logs (action);
create index if not exists idx_audit_created_at on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select
  using (public.is_admin());

drop policy if exists "Admins or service role can insert audit logs" on public.admin_audit_logs;
create policy "Admins or service role can insert audit logs"
  on public.admin_audit_logs for insert
  with check (public.is_admin() or coalesce(auth.role(), '') = 'service_role');

-- ------------------------------------------------------------------------------
-- 7. Update Vocabularies RLS Policies
-- ------------------------------------------------------------------------------
alter table public.vocabularies enable row level security;

drop policy if exists "Vocabularies are viewable by all users" on public.vocabularies;
drop policy if exists "Public vocabulary read access" on public.vocabularies;
create policy "Public vocabulary read access"
  on public.vocabularies for select
  using (true);

drop policy if exists "Admins or service role can manage vocabularies" on public.vocabularies;
drop policy if exists "Admins can insert vocabularies" on public.vocabularies;
create policy "Admins can insert vocabularies"
  on public.vocabularies for insert
  with check (public.is_admin() or coalesce(auth.role(), '') = 'service_role');

drop policy if exists "Admins can update vocabularies" on public.vocabularies;
create policy "Admins can update vocabularies"
  on public.vocabularies for update
  using (public.is_admin() or coalesce(auth.role(), '') = 'service_role')
  with check (public.is_admin() or coalesce(auth.role(), '') = 'service_role');

drop policy if exists "Admins can delete vocabularies" on public.vocabularies;
create policy "Admins can delete vocabularies"
  on public.vocabularies for delete
  using (public.is_admin() or coalesce(auth.role(), '') = 'service_role');

-- ------------------------------------------------------------------------------
-- 8. Update Profiles RLS Policies
-- ------------------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile or admins can view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());
