-- 2026-11-14 · Counselors only see their own students (enforced in the DB).
--
-- Before: every staff member (admin OR counselor) could read and change every
-- row (policy `zaifan_staff_all` = is_zaifan_staff()).
-- After:
--   * admins: still everything.
--   * counselors: only rows that belong to a person whose
--     student_identities.assigned_to is them. Everything that hangs off an
--     inquiry/appointment (student_type + student_id) follows that person.
--   * staff lists (admin_profiles, counselor_profiles, payment_accounts):
--     counselors may read, only admins may change.
--   * anything else (logs, AI tables, lead_assignments…): admins only.
--   * files: counselors open/upload only their own students' files.
--   * new RPC staff_add_person(): "Add a person" for admins and counselors;
--     a counselor's walk-in is assigned to them automatically.
-- Anonymous website forms (insert into inquiries/appointments) are untouched.
-- Students are untouched: their portal uses security-definer RPCs.
-- Safe to run twice.

begin;

-- 1. Helpers --------------------------------------------------------------

-- Every id that means "me" for the signed-in staff member (auth uid plus any
-- counselor_profiles.id linked to it). People are assigned by these ids.
create or replace function public.zaifan_my_staff_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select auth.uid() where auth.uid() is not null
  union
  select cp.id from public.counselor_profiles cp
  where auth.uid() is not null and auth.uid() in (cp.id, cp.user_id, cp.auth_id)
$$;

create or replace function public.zaifan_can_see_person(p_person uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_zaifan_admin()
    or (
      p_person is not null
      and public.is_zaifan_staff()
      and exists (
        select 1 from public.student_identities si
        where si.id = p_person
          and si.assigned_to in (select public.zaifan_my_staff_ids())
      )
    );
$$;

-- Rows keyed on (student_type, student_id) → the inquiry/appointment → person.
create or replace function public.zaifan_can_see_student(p_type text, p_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_zaifan_admin()
    or (
      public.is_zaifan_staff()
      and exists (
        select 1
        from public.student_identities si
        where si.assigned_to in (select public.zaifan_my_staff_ids())
          and (
            (lower(p_type) = 'inquiry' and exists (select 1 from public.inquiries i where i.person_id = si.id and i.id::text = p_id))
            or (lower(p_type) = 'appointment' and exists (select 1 from public.appointments a where a.person_id = si.id and a.id::text = p_id))
          )
      )
    );
$$;

-- A stored file belongs to a person I can see (new p/<person>/… paths, or
-- an older path that a document/receipt row points to).
create or replace function public.zaifan_staff_can_open_file(p_path text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_zaifan_admin()
    or (
      public.is_zaifan_staff()
      and (
        (split_part(p_path, '/', 1) = 'p'
          and split_part(p_path, '/', 2) ~ '^[0-9a-f-]{36}$'
          and public.zaifan_can_see_person(split_part(p_path, '/', 2)::uuid))
        or exists (
          select 1 from public.student_documents d
          where (d.file_path = p_path or d.file_url like '%' || p_path)
            and public.zaifan_can_see_student(d.student_type, d.student_id::text)
        )
        or exists (
          select 1 from public.student_receipts c
          where c.file_path = p_path
            and public.zaifan_can_see_student(c.student_type, c.student_id::text)
        )
        -- uploads by staff go to <student_id>/<doc name>/<file>
        or exists (
          select 1 from public.inquiries i
          join public.student_identities si on si.id = i.person_id
          where i.id::text = split_part(p_path, '/', 1)
            and si.assigned_to in (select public.zaifan_my_staff_ids())
        )
        or exists (
          select 1 from public.appointments a
          join public.student_identities si on si.id = a.person_id
          where a.id::text = split_part(p_path, '/', 1)
            and si.assigned_to in (select public.zaifan_my_staff_ids())
        )
      )
    );
$$;

do $$
declare fn text;
begin
  foreach fn in array array[
    'zaifan_my_staff_ids()', 'zaifan_can_see_person(uuid)', 'zaifan_can_see_student(text, text)', 'zaifan_staff_can_open_file(text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;

-- 2. Table rules ----------------------------------------------------------

do $$
declare
  t record;
  p record;
  staff_read text[] := array['admin_profiles', 'counselor_profiles', 'payment_accounts'];
begin
  for t in
    select c.relname as name,
      exists (select 1 from information_schema.columns x where x.table_schema = 'public' and x.table_name = c.relname and x.column_name = 'student_id') as has_sid,
      exists (select 1 from information_schema.columns x where x.table_schema = 'public' and x.table_name = c.relname and x.column_name = 'student_type') as has_stype
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', t.name);

    -- Remove the staff-wide rule(s) from yesterday and any earlier run of this file.
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t.name
        and policyname in ('zaifan_staff_all', 'zaifan_admin_all', 'zaifan_staff_scoped', 'zaifan_staff_read', 'zaifan_staff_log')
    loop
      execute format('drop policy %I on public.%I', p.policyname, t.name);
    end loop;

    -- Admins: everything, everywhere.
    execute format(
      'create policy zaifan_admin_all on public.%I for all to authenticated using (public.is_zaifan_admin()) with check (public.is_zaifan_admin())',
      t.name
    );

    if t.has_sid and t.has_stype then
      execute format(
        'create policy zaifan_staff_scoped on public.%I for all to authenticated '
        'using (public.zaifan_can_see_student(student_type, student_id::text)) '
        'with check (public.zaifan_can_see_student(student_type, student_id::text))',
        t.name
      );
    elsif t.name in ('inquiries', 'appointments') then
      execute format(
        'create policy zaifan_staff_scoped on public.%I for all to authenticated '
        'using (public.zaifan_can_see_person(person_id)) with check (public.zaifan_can_see_person(person_id))',
        t.name
      );
    elsif t.name = 'student_identities' then
      -- A counselor sees and edits their own people, and cannot hand them to someone else.
      execute
        'create policy zaifan_staff_scoped on public.student_identities for all to authenticated '
        'using (public.is_zaifan_staff() and assigned_to in (select public.zaifan_my_staff_ids())) '
        'with check (public.is_zaifan_staff() and assigned_to in (select public.zaifan_my_staff_ids()))';
    elsif t.name = 'student_application_requirements' then
      execute
        'create policy zaifan_staff_scoped on public.student_application_requirements for all to authenticated '
        'using (exists (select 1 from public.student_applications x where x.id = application_id and public.zaifan_can_see_student(x.student_type, x.student_id::text))) '
        'with check (exists (select 1 from public.student_applications x where x.id = application_id and public.zaifan_can_see_student(x.student_type, x.student_id::text)))';
    elsif t.name = 'student_university_requirements' then
      execute
        'create policy zaifan_staff_scoped on public.student_university_requirements for all to authenticated '
        'using (exists (select 1 from public.student_universities x where x.id = student_university_id and public.zaifan_can_see_student(x.student_type, x.student_id::text))) '
        'with check (exists (select 1 from public.student_universities x where x.id = student_university_id and public.zaifan_can_see_student(x.student_type, x.student_id::text)))';
    elsif t.name = 'student_visa_requirements' then
      execute
        'create policy zaifan_staff_scoped on public.student_visa_requirements for all to authenticated '
        'using (exists (select 1 from public.student_visas x where x.id = visa_id and public.zaifan_can_see_student(x.student_type, x.student_id::text))) '
        'with check (exists (select 1 from public.student_visas x where x.id = visa_id and public.zaifan_can_see_student(x.student_type, x.student_id::text)))';
    elsif t.name = any (staff_read) then
      execute format('create policy zaifan_staff_read on public.%I for select to authenticated using (public.is_zaifan_staff())', t.name);
    elsif t.name = 'activity_logs' then
      execute 'create policy zaifan_staff_log on public.activity_logs for insert to authenticated with check (public.is_zaifan_staff())';
    end if;
    -- everything else: admins only.
  end loop;
end $$;

-- 3. Files ----------------------------------------------------------------

drop policy if exists zaifan_staff_student_files on storage.objects;
drop policy if exists zaifan_staff_scoped_files on storage.objects;
create policy zaifan_staff_scoped_files on storage.objects
  for all to authenticated
  using (bucket_id in ('student-documents', 'student-receipts') and public.zaifan_staff_can_open_file(name))
  with check (bucket_id in ('student-documents', 'student-receipts') and public.zaifan_staff_can_open_file(name));

-- 4. "Add a person" -------------------------------------------------------

create or replace function public.staff_add_person(p jsonb)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_inquiry public.inquiries%rowtype;
  v_owner uuid;
  v_admin boolean := public.is_zaifan_admin();
begin
  if not public.is_zaifan_staff() then
    raise exception 'Only Zaifan staff can add people.' using errcode = '42501';
  end if;
  if coalesce(trim(p->>'full_name'), '') = '' then
    raise exception 'Name is required.' using errcode = '22023';
  end if;

  insert into public.inquiries (full_name, phone, email, country, study_level, field_of_interest, message, status, priority, lead_source, pipeline_stage, counseling_mode)
  values (
    trim(p->>'full_name'),
    nullif(trim(p->>'phone'), ''),
    nullif(lower(trim(p->>'email')), ''),
    nullif(p->>'country', ''),
    nullif(p->>'study_level', ''),
    nullif(trim(p->>'field_of_interest'), ''),
    coalesce(nullif(trim(p->>'message'), ''), 'Added by the Zaifan team.'),
    'contacted',
    'normal',
    'admin_manual',
    coalesce(nullif(p->>'stage', ''), 'consulting'),
    'In person / phone'
  )
  returning * into v_inquiry; -- the identity trigger fills person_id (new or matched by phone/email)

  select assigned_to into v_owner from public.student_identities where id = v_inquiry.person_id;

  -- A counselor's walk-in goes onto their own list, unless someone already looks after this person.
  if not v_admin and v_owner is null then
    update public.student_identities set assigned_to = auth.uid(), updated_at = now() where id = v_inquiry.person_id;
    v_owner := auth.uid();
  end if;

  return jsonb_build_object(
    'person_id', v_inquiry.person_id,
    'inquiry_id', v_inquiry.id,
    'assigned_to', v_owner,
    'visible', v_admin or v_owner = auth.uid()
  );
end;
$$;

revoke all on function public.staff_add_person(jsonb) from public, anon;
grant execute on function public.staff_add_person(jsonb) to authenticated, service_role;

commit;
