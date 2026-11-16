-- 2026-11-14 · Stop the public form emails being used to spam people.
-- send-email / send-appointment-email now only send for a real submission
-- saved in the last 15 minutes, once per submission (this column marks it),
-- and at most 3 confirmations per email address per day.
alter table public.inquiries add column if not exists confirmation_sent_at timestamptz;
alter table public.appointments add column if not exists confirmation_sent_at timestamptz;
