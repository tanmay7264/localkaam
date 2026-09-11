-- Expand application hiring pipeline statuses
-- Postgres requires ADD VALUE outside a transaction block for some versions;
-- Supabase migrations run each file in a transaction — use DO blocks carefully.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction in older PG;
-- on PG 12+ it can run in a transaction if not used in the same transaction.

alter type public.application_status add value if not exists 'applied';
alter type public.application_status add value if not exists 'under_review';
alter type public.application_status add value if not exists 'shortlisted';
alter type public.application_status add value if not exists 'employee_chat';
alter type public.application_status add value if not exists 'interview';
alter type public.application_status add value if not exists 'verification';

alter table public.applications
  add column if not exists peak_stage public.application_status;

-- Migrate legacy pending → applied
update public.applications
set status = 'applied'
where status::text = 'pending';

update public.applications
set peak_stage = case
  when status::text in ('accepted', 'rejected') then 'applied'::public.application_status
  else status
end
where peak_stage is null;

alter table public.applications
  alter column status set default 'applied';

comment on column public.applications.peak_stage is
  'Furthest non-terminal hiring stage reached; used for progress UI after accept/reject.';
