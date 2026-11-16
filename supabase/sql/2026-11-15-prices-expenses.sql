-- 2026-11-15  Price list + office expenses
--
-- Two NEW tables. Nothing existing is changed or deleted.
--   * service_prices  : the office price list ("Italy full package – Rs 150,000").
--                       Picked from when writing an invoice. Admins change it,
--                       counselors may read it.
--   * office_expenses : money the office spent (rent, salaries, courier, ads…).
--                       Admins only. Used by the Money page to show profit.
-- Students and website visitors cannot see either table.
-- Safe to run twice.

begin;

create table if not exists public.service_prices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'service_fee',
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PKR',
  description text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.office_expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  category text not null default 'other',
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'PKR',
  paid_to text,
  payment_method text,
  notes text,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists office_expenses_spent_on_idx on public.office_expenses (spent_on desc);

alter table public.service_prices enable row level security;
alter table public.office_expenses enable row level security;

revoke all on public.service_prices from anon, public;
revoke all on public.office_expenses from anon, public;
grant select, insert, update, delete on public.service_prices to authenticated;
grant select, insert, update, delete on public.office_expenses to authenticated;
grant all on public.service_prices to service_role;
grant all on public.office_expenses to service_role;

drop policy if exists zaifan_admin_all on public.service_prices;
create policy zaifan_admin_all on public.service_prices
  for all to authenticated
  using (public.is_zaifan_admin())
  with check (public.is_zaifan_admin());

drop policy if exists zaifan_staff_read on public.service_prices;
create policy zaifan_staff_read on public.service_prices
  for select to authenticated
  using (public.is_zaifan_staff());

drop policy if exists zaifan_admin_all on public.office_expenses;
create policy zaifan_admin_all on public.office_expenses
  for all to authenticated
  using (public.is_zaifan_admin())
  with check (public.is_zaifan_admin());

commit;
