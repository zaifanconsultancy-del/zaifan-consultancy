-- Student portal access (2026-11-13). Safe to run more than once.
--
-- Students now log in with a real Supabase Auth account. Their login is linked
-- to ONE row in student_identities. Students never read tables directly: the
-- portal calls the functions below, which only ever return / write the
-- student's own file and leave out internal notes. The only direct access a
-- student gets is to their own files in storage.

alter table public.student_identities
  add column if not exists auth_user_id uuid,
  add column if not exists portal_email text,
  add column if not exists portal_active boolean not null default true,
  add column if not exists portal_created_at timestamptz;

-- The table had no grant for signed-in users at all, so even staff could not
-- read it (row security still limits it to staff).
grant select, insert, update, delete on public.student_identities to authenticated;
grant all on public.student_identities to service_role;

create unique index if not exists student_identities_auth_user_idx
  on public.student_identities (auth_user_id) where auth_user_id is not null;

-- Who am I? (null for staff, visitors and switched-off logins)
create or replace function public.zaifan_my_person_id()
returns uuid language sql stable security definer set search_path = public as $$
  select si.id from public.student_identities si
  where si.auth_user_id = auth.uid() and si.portal_active
  limit 1;
$$;

-- Is this (student_type, student_id) one of my own inquiries / appointments?
create or replace function public.zaifan_is_my_file(p_type text, p_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.zaifan_my_person_id() is not null and (
    exists (
      select 1 from public.inquiries i
      where lower(coalesce(p_type, 'inquiry')) = 'inquiry'
        and i.id::text = p_id and i.person_id = public.zaifan_my_person_id()
    )
    or exists (
      select 1 from public.appointments a
      where lower(p_type) = 'appointment'
        and a.id::text = p_id and a.person_id = public.zaifan_my_person_id()
    )
  );
$$;

-- The inquiry / appointment that new student rows get attached to: the one
-- that already has paperwork on it, otherwise the newest.
create or replace function public.zaifan_my_primary(out student_type text, out student_id bigint)
language sql stable security definer set search_path = public as $$
  with mine as (
    select 'inquiry'::text as t, i.id, i.created_at from public.inquiries i where i.person_id = public.zaifan_my_person_id()
    union all
    select 'appointment', a.id, a.created_at from public.appointments a where a.person_id = public.zaifan_my_person_id()
  )
  select m.t, m.id from mine m
  order by (
    exists (select 1 from public.student_documents d where d.student_type = m.t and d.student_id = m.id)
    or exists (select 1 from public.student_applications x where x.student_type = m.t and x.student_id = m.id)
    or exists (select 1 from public.student_invoices v where v.student_type = m.t and v.student_id = m.id::text)
  ) desc, m.created_at desc
  limit 1;
$$;

-- Everything the portal shows, in one call.
create or replace function public.student_portal_file()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := public.zaifan_my_person_id();
  result jsonb;
begin
  if me is null then
    return null;
  end if;

  with src as (
    select 'inquiry'::text as t, i.id::text as id, i.created_at, i.country as country, i.status
      from public.inquiries i where i.person_id = me
    union all
    select 'appointment', a.id::text, a.created_at, a.country_interest, a.status
      from public.appointments a where a.person_id = me
  )
  select jsonb_build_object(
    'person', (
      select jsonb_build_object(
        'id', si.id, 'name', si.full_name, 'email', coalesce(si.portal_email, si.primary_email),
        'phone', si.primary_phone, 'country', si.country,
        'stage', case when si.stage_changed_at is not null then si.stage end,
        'counselor', (
          select jsonb_build_object('name', coalesce(cp.full_name, ap.full_name), 'email', cp.email)
          from (select si.assigned_to as uid) u
          left join public.counselor_profiles cp on u.uid in (cp.id, cp.user_id, cp.auth_id)
          left join public.admin_profiles ap on ap.id = u.uid
          where u.uid is not null
          limit 1
        )
      )
      from public.student_identities si where si.id = me
    ),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('type', s.t, 'id', s.id, 'created_at', s.created_at, 'country', s.country, 'status', s.status) order by s.created_at desc) from src s), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'country', x.country, 'university', x.university, 'program', x.program, 'intake', x.intake,
        'application_status', x.application_status, 'offer_status', x.offer_status,
        'submission_deadline', x.submission_deadline, 'submitted_at', x.submitted_at,
        'offer_received_at', x.offer_received_at, 'offer_acceptance_deadline', x.offer_acceptance_deadline,
        'conditional_offer', x.conditional_offer, 'conditions_text', x.conditions_text,
        'deposit_required', x.deposit_required, 'deposit_amount', x.deposit_amount, 'deposit_currency', x.deposit_currency,
        'deposit_deadline', x.deposit_deadline, 'deposit_paid', x.deposit_paid,
        'scholarship_status', x.scholarship_status, 'scholarship_amount', x.scholarship_amount, 'scholarship_currency', x.scholarship_currency,
        'next_action', x.next_action, 'next_action_due', x.next_action_due, 'created_at', x.created_at
      ) order by x.created_at desc)
      from public.student_applications x join src s on s.t = x.student_type and s.id = x.student_id::text
      where not coalesce(x.is_archived, false)
    ), '[]'::jsonb),
    'visas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'country', v.country, 'case_name', v.case_name, 'visa_status', v.visa_status, 'visa_stage', v.visa_stage,
        'visa_center', v.visa_center, 'embassy_or_consulate', v.embassy_or_consulate,
        'appointment_date', v.appointment_date, 'appointment_time', v.appointment_time, 'appointment_location', v.appointment_location,
        'biometrics_date', v.biometrics_date, 'submitted_at', v.submitted_at, 'decision_at', v.decision_at,
        'passport_collection_date', v.passport_collection_date, 'visa_valid_from', v.visa_valid_from, 'visa_valid_until', v.visa_valid_until,
        'visa_fee_amount', v.visa_fee_amount, 'visa_fee_currency', v.visa_fee_currency, 'visa_fee_paid', v.visa_fee_paid,
        'next_action', v.next_action, 'next_action_due', v.next_action_due, 'student_notes', v.student_notes, 'created_at', v.created_at
      ) order by v.created_at desc)
      from public.student_visas v join src s on s.t = v.student_type and s.id = v.student_id::text
      where not coalesce(v.is_archived, false)
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'name', d.document_name, 'category', d.document_category, 'status', d.status,
        'rejection_reason', d.rejection_reason, 'file_path', d.file_path, 'file_url', d.file_url,
        'file_name', d.original_file_name, 'size', d.file_size_bytes, 'expiry_date', d.expiry_date, 'created_at', d.created_at
      ) order by d.created_at desc)
      from public.student_documents d join src s on s.t = d.student_type and s.id = d.student_id::text
      where not coalesce(d.is_deleted, false) and d.archived_at is null
    ), '[]'::jsonb),
    'requirements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'name', r.document_name, 'group', r.group_name, 'required', r.required, 'status', r.status, 'notes', r.notes
      ) order by r.created_at)
      from public.student_document_requirements r join src s on s.t = r.student_type and s.id = r.student_id::text
      where not coalesce(r.admin_only, false)
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'number', n.invoice_number, 'title', n.title, 'description', n.description, 'category', n.category,
        'total', coalesce(n.total_amount, n.amount), 'paid', n.paid_amount, 'outstanding', n.outstanding_amount,
        'currency', n.currency, 'status', n.status, 'due_date', n.due_date, 'created_at', n.created_at
      ) order by n.created_at desc)
      from public.student_invoices n join src s on s.t = n.student_type and s.id = n.student_id
      where lower(coalesce(n.status, '')) not in ('draft', 'void', 'cancelled')
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'invoice_id', p.invoice_id, 'amount', p.amount, 'currency', p.currency,
        'method', p.payment_method, 'reference', p.reference, 'status', p.status, 'paid_at', coalesce(p.paid_at, p.created_at)
      ) order by coalesce(p.paid_at, p.created_at) desc)
      from public.student_payments p join src s on s.t = p.student_type and s.id = p.student_id
    ), '[]'::jsonb),
    'receipts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'invoice_id', c.invoice_id, 'amount', c.amount, 'currency', c.currency, 'method', c.payment_method,
        'reference', c.reference, 'status', c.status, 'review_status', c.review_status, 'notes', c.notes,
        'file_path', c.file_path, 'file_name', c.file_name, 'submitted_at', coalesce(c.submitted_at, c.created_at)
      ) order by coalesce(c.submitted_at, c.created_at) desc)
      from public.student_receipts c join src s on s.t = c.student_type and s.id = c.student_id
    ), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'type', q.request_type, 'subject', q.subject, 'message', q.message, 'status', q.status, 'created_at', q.created_at,
        'replies', coalesce((
          select jsonb_agg(jsonb_build_object('id', m.id, 'from', m.sender_type, 'name', m.sender_name, 'message', m.message, 'created_at', m.created_at) order by m.created_at)
          from public.student_support_messages m
          where m.support_request_id = q.id and not coalesce(m.is_internal, false)
        ), '[]'::jsonb)
      ) order by q.created_at desc)
      from public.student_support_requests q join src s on s.t = q.student_type and s.id = q.student_id
    ), '[]'::jsonb),
    'pay_to', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'type', a.account_type, 'title', a.account_title, 'bank', a.bank_name, 'number', a.account_number,
        'iban', a.iban, 'wallet', a.mobile_wallet_number, 'instructions', a.instructions
      ) order by a.created_at)
      from public.payment_accounts a where coalesce(a.is_active, true)
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

-- Internal: one line in the student's history so the team sees what happened.
create or replace function public.zaifan_student_log(p_type text, p_id bigint, p_action text, p_title text)
returns void language sql security definer set search_path = public as $$
  insert into public.crm_timeline (student_id, student_type, action_type, title, description, old_value, new_value, created_by_name, metadata)
  values (p_id::text, p_type, p_action, left(p_title, 200), '', '', '', 'Student (portal)', '{"source":"student_portal"}'::jsonb);
$$;

-- Student uploads a document (the file itself is already in their storage folder).
create or replace function public.student_add_document(
  p_name text, p_category text, p_file_path text, p_file_name text, p_mime text, p_size bigint
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.zaifan_my_person_id();
  k record;
  new_id uuid;
begin
  if me is null then raise exception 'Please sign in again.'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Please say which document this is.'; end if;
  if p_file_path is null or p_file_path not like 'p/' || me::text || '/%' then raise exception 'This file is not in your folder.'; end if;
  select * into k from public.zaifan_my_primary();
  if k.student_id is null then raise exception 'Your file is not set up yet. Please contact Zaifan.'; end if;

  insert into public.student_documents (student_id, student_type, document_name, document_category, status, file_path, original_file_name, mime_type, file_size_bytes)
  values (k.student_id, k.student_type, left(trim(p_name), 120), left(coalesce(nullif(trim(p_category), ''), 'Other'), 60), 'pending_review', p_file_path, left(p_file_name, 200), left(p_mime, 100), p_size)
  returning id into new_id;

  perform public.zaifan_student_log(k.student_type, k.student_id, 'document_uploaded', 'Student uploaded: ' || trim(p_name));
  return new_id;
end;
$$;

-- Student sends proof of a payment.
create or replace function public.student_add_receipt(
  p_invoice_id uuid, p_amount numeric, p_currency text, p_method text, p_reference text, p_notes text, p_file_path text, p_file_name text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.zaifan_my_person_id();
  k record;
  inv record;
  new_id uuid;
begin
  if me is null then raise exception 'Please sign in again.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Please type the amount you paid.'; end if;
  if p_file_path is not null and p_file_path not like 'p/' || me::text || '/%' then raise exception 'This file is not in your folder.'; end if;
  select * into k from public.zaifan_my_primary();
  if k.student_id is null then raise exception 'Your file is not set up yet. Please contact Zaifan.'; end if;

  if p_invoice_id is not null then
    select n.student_type, n.student_id into inv from public.student_invoices n where n.id = p_invoice_id;
    if inv.student_id is null or not public.zaifan_is_my_file(inv.student_type, inv.student_id) then
      raise exception 'That invoice is not on your file.';
    end if;
  end if;

  insert into public.student_receipts (student_id, student_type, invoice_id, amount, currency, payment_method, reference, notes, file_path, file_name, status, review_status, submitted_at)
  values (
    coalesce(inv.student_id, k.student_id::text), coalesce(inv.student_type, k.student_type), p_invoice_id, p_amount,
    left(coalesce(nullif(trim(p_currency), ''), 'PKR'), 8), left(coalesce(nullif(trim(p_method), ''), 'bank_transfer'), 40),
    left(p_reference, 120), left(p_notes, 1000), p_file_path, left(p_file_name, 200), 'pending_review', 'pending', now()
  )
  returning id into new_id;

  perform public.zaifan_student_log(k.student_type, k.student_id, 'receipt_uploaded', 'Student sent a payment receipt: ' || p_amount::text);
  return new_id;
end;
$$;

-- Student asks a question.
create or replace function public.student_ask(p_subject text, p_message text, p_type text default 'general')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.zaifan_my_person_id();
  k record;
  new_id uuid;
begin
  if me is null then raise exception 'Please sign in again.'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'Please type your question.'; end if;
  select * into k from public.zaifan_my_primary();
  if k.student_id is null then raise exception 'Your file is not set up yet. Please contact Zaifan.'; end if;

  if (select count(*) from public.student_support_requests q
      where q.student_type = k.student_type and q.student_id = k.student_id::text and q.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'That is a lot of questions in one hour. Please wait a little or message us on WhatsApp.';
  end if;

  insert into public.student_support_requests (student_id, student_type, request_type, priority, subject, message, status)
  values (k.student_id::text, k.student_type, left(coalesce(nullif(trim(p_type), ''), 'general'), 40), 'normal',
          left(coalesce(nullif(trim(p_subject), ''), 'Question'), 160), left(trim(p_message), 4000), 'open')
  returning id into new_id;

  perform public.zaifan_student_log(k.student_type, k.student_id, 'support_request', 'Student asked: ' || coalesce(nullif(trim(p_subject), ''), 'Question'));
  return new_id;
end;
$$;

-- Student replies inside one of their own questions.
create or replace function public.student_reply(p_request_id uuid, p_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.zaifan_my_person_id();
  q record;
  my_name text;
  new_id uuid;
begin
  if me is null then raise exception 'Please sign in again.'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'Please type a message.'; end if;
  select r.id, r.student_type, r.student_id into q from public.student_support_requests r where r.id = p_request_id;
  if q.id is null or not public.zaifan_is_my_file(q.student_type, q.student_id) then
    raise exception 'That question is not on your file.';
  end if;
  select full_name into my_name from public.student_identities where id = me;

  insert into public.student_support_messages (support_request_id, student_id, student_type, sender_type, sender_id, sender_name, message, is_internal)
  values (q.id, q.student_id, q.student_type, 'student', auth.uid(), my_name, left(trim(p_message), 4000), false)
  returning id into new_id;

  update public.student_support_requests set status = 'open', resolved_at = null, updated_at = now() where id = q.id;
  return new_id;
end;
$$;

-- Is this storage path a file that staff put on my file?
create or replace function public.zaifan_is_my_stored_file(p_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.student_documents d
    where d.file_path = p_path and not coalesce(d.is_deleted, false)
      and public.zaifan_is_my_file(d.student_type, d.student_id::text)
  ) or exists (
    select 1 from public.student_receipts c
    where c.file_path = p_path and public.zaifan_is_my_file(c.student_type, c.student_id)
  );
$$;

-- Only signed-in people may call these (and they return nothing unless you are a student).
do $$
declare fn text;
begin
  foreach fn in array array[
    'zaifan_my_person_id()', 'zaifan_is_my_file(text, text)', 'zaifan_my_primary()', 'zaifan_is_my_stored_file(text)', 'student_portal_file()',
    'student_add_document(text, text, text, text, text, bigint)',
    'student_add_receipt(uuid, numeric, text, text, text, text, text, text)',
    'student_ask(text, text, text)', 'student_reply(uuid, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
  revoke all on function public.zaifan_student_log(text, bigint, text, text) from public, anon, authenticated;
end $$;

-- Storage: a student may put files in their own folder (p/<their person id>/…)
-- and open files that are on their own file.
drop policy if exists zaifan_student_upload_own on storage.objects;
create policy zaifan_student_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('student-documents', 'student-receipts')
    and (storage.foldername(name))[1] = 'p'
    and (storage.foldername(name))[2] = public.zaifan_my_person_id()::text
  );

drop policy if exists zaifan_student_read_own on storage.objects;
create policy zaifan_student_read_own on storage.objects
  for select to authenticated
  using (
    bucket_id in ('student-documents', 'student-receipts')
    and public.zaifan_my_person_id() is not null
    and (
      ((storage.foldername(name))[1] = 'p' and (storage.foldername(name))[2] = public.zaifan_my_person_id()::text)
      or public.zaifan_is_my_stored_file(name)
    )
  );
