-- ==============================================================================
-- Script: supabase/set-admin.sql
-- Description: Promote an existing user to Admin safely in Supabase SQL Editor
--
-- Instructions:
-- 1. Replace 'TARGET_USER_EMAIL@example.com' with the user's actual email.
-- 2. Run this block in the Supabase Dashboard SQL Editor.
-- ==============================================================================

do $$
declare
  target_email text := 'TARGET_USER_EMAIL@example.com'; -- Replace with the target email
  target_user_id uuid;
  match_count integer;
  current_role text;
begin
  if target_email = 'TARGET_USER_EMAIL@example.com' then
    raise exception 'Please edit this script and set target_email to the desired user email before executing.';
  end if;

  -- 1. Verify that exactly one user matches the email in auth.users
  select count(*), max(id) into match_count, target_user_id
  from auth.users
  where lower(email) = lower(target_email);

  if match_count = 0 then
    raise exception 'User not found for email: %', target_email;
  elsif match_count > 1 then
    raise exception 'Multiple users found for email: % (ambiguous match, please use user ID directly)', target_email;
  end if;

  -- 2. Fetch current role from public.profiles
  select role into current_role
  from public.profiles
  where id = target_user_id;

  if current_role = 'admin' then
    raise notice 'User % (%) is already an Admin.', target_email, target_user_id;
    return;
  end if;

  -- 3. Update role in public.profiles to 'admin'
  update public.profiles
  set role = 'admin',
      updated_at = timezone('utc'::text, now())
  where id = target_user_id;

  -- 4. Record action in public.admin_audit_logs
  insert into public.admin_audit_logs (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  )
  values (
    target_user_id,
    'role_changed',
    'profile',
    target_user_id,
    jsonb_build_object('email', target_email, 'previous_role', current_role),
    jsonb_build_object('email', target_email, 'new_role', 'admin', 'promoted_via', 'sql_editor')
  );

  raise notice 'Successfully promoted user % (%) to Admin.', target_email, target_user_id;
end $$;
