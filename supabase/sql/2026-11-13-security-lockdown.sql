-- Zaifan security lockdown (2026-11-13)
-- Before: anyone with the public website key could read, change and delete student data.
-- After:  visitors can only SEND an inquiry or book an appointment;
--         signed-in Zaifan staff (admins + active counselors) can see and manage data;
--         student files are private.
-- Undo:   backups/2026-11-13-security-before-lockdown.sql (outside the repo).
-- Safe to run more than once.

begin;

-- 1. "Is this signed-in person Zaifan staff?" -------------------------------
create or replace function public.is_zaifan_staff(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select check_user_id is not null and (
    public.is_zaifan_admin(check_user_id)
    or exists (
      select 1
      from public.counselor_profiles cp
      where check_user_id in (cp.id, cp.user_id, cp.auth_id)
        and coalesce(cp.is_active, true)
    )
  );
$$;

revoke execute on function public.is_zaifan_staff(uuid) from public, anon;
grant execute on function public.is_zaifan_staff(uuid) to authenticated, service_role;

-- 2. Every table: security ON, old rules removed, one staff-only rule -------
do $$
declare
  t record;
  p record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', t.relname);

    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t.relname loop
      execute format('drop policy %I on public.%I', p.policyname, t.relname);
    end loop;

    execute format(
      'create policy zaifan_staff_all on public.%I for all to authenticated '
      'using (public.is_zaifan_staff()) with check (public.is_zaifan_staff())',
      t.relname
    );
  end loop;
end $$;

-- 3. The public website may only SEND these two forms -----------------------
create policy website_can_send_inquiry on public.inquiries
  for insert to anon, authenticated with check (true);

create policy website_can_book_appointment on public.appointments
  for insert to anon, authenticated with check (true);

-- 4. Student portal password functions --------------------------------------
-- Admin-only: create a portal account (used by the admin "portal access" screen).
create or replace function public.create_student_portal_account(
  p_email text,
  p_password text,
  p_student_id text,
  p_student_type text default 'inquiry'::text
)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if not public.is_zaifan_admin(auth.uid()) then
    raise exception 'You are not authorised to create portal accounts.';
  end if;

  insert into student_portal_accounts (email, password_hash, student_id, student_type, is_active)
  values (lower(trim(p_email)), crypt(p_password, gen_salt('bf')), p_student_id, p_student_type, true)
  on conflict (email)
  do update set
    password_hash = crypt(p_password, gen_salt('bf')),
    student_id = excluded.student_id,
    student_type = excluded.student_type,
    is_active = true;
end;
$function$;

create or replace function public.create_student_portal_account(
  p_email text,
  p_password text,
  p_student_id text,
  p_student_type text,
  p_is_active boolean default true,
  p_must_change_password boolean default true,
  p_admin_id uuid default null::uuid
)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if not public.is_zaifan_admin(auth.uid()) then
    raise exception 'You are not authorised to create portal accounts.';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception 'Student email is required.';
  end if;

  if length(coalesce(p_password, '')) < 10 then
    raise exception 'Temporary password must be at least 10 characters.';
  end if;

  insert into public.student_portal_accounts (
    email, password_hash, student_id, student_type, is_active, must_change_password, updated_at
  )
  values (
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    p_student_id,
    p_student_type,
    coalesce(p_is_active, true),
    coalesce(p_must_change_password, true),
    now()
  )
  on conflict (email)
  do update set
    password_hash = crypt(p_password, gen_salt('bf')),
    student_id = excluded.student_id,
    student_type = excluded.student_type,
    is_active = excluded.is_active,
    must_change_password = excluded.must_change_password,
    updated_at = now();
end;
$function$;

revoke execute on function public.create_student_portal_account(text, text, text, text) from public, anon;
revoke execute on function public.create_student_portal_account(text, text, text, text, boolean, boolean, uuid) from public, anon;
grant execute on function public.create_student_portal_account(text, text, text, text) to authenticated, service_role;
grant execute on function public.create_student_portal_account(text, text, text, text, boolean, boolean, uuid) to authenticated, service_role;

-- Already checks for an admin inside; also stop visitors from calling it at all.
revoke execute on function public.reset_student_portal_password(uuid, text, text, text, boolean, uuid) from public, anon;
grant execute on function public.reset_student_portal_password(uuid, text, text, text, boolean, uuid) to authenticated, service_role;

-- Not used by the app and had no admin check: nobody but the server may call it.
revoke execute on function public.upsert_student_portal_account(text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.upsert_student_portal_account(text, text, text, text, boolean) to service_role;

revoke execute on function public.refresh_invoice_payment_status(uuid) from public, anon;
grant execute on function public.refresh_invoice_payment_status(uuid) to authenticated, service_role;

-- Student login + "change my password" stay callable (both need the student's own password).

-- 5. Storage: student files private, staff only ------------------------------
update storage.buckets set public = false where id in ('student-documents', 'student-receipts');

drop policy if exists "Allow public receipt uploads" on storage.objects;
drop policy if exists "Allow public document uploads" on storage.objects;
drop policy if exists "Allow public document reads" on storage.objects;
drop policy if exists "Allow public document updates" on storage.objects;
drop policy if exists zaifan_staff_student_files on storage.objects;

create policy zaifan_staff_student_files on storage.objects
  for all to authenticated
  using (bucket_id in ('student-documents', 'student-receipts') and public.is_zaifan_staff())
  with check (bucket_id in ('student-documents', 'student-receipts') and public.is_zaifan_staff());

commit;
