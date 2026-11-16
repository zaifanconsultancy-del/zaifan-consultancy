-- One record per person (student_identities) now carries the journey stage,
-- the assigned counselor and admin notes, so the Leads/Students pages hang off it.
-- Safe to run more than once.
alter table public.student_identities
  add column if not exists stage text not null default 'lead',
  add column if not exists assigned_to uuid,
  add column if not exists country text,
  add column if not exists admin_notes text,
  add column if not exists priority text not null default 'normal',
  add column if not exists stage_changed_at timestamptz;

create index if not exists student_identities_stage_idx on public.student_identities (stage);
