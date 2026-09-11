create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('worker', 'employer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('unverified', 'pending', 'verified', 'needs_review', 'rejected', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  display_name text not null check (char_length(display_name) between 1 and 120),
  email text,
  phone text,
  verification_status public.verification_status not null default 'unverified',
  verification_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worker_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null,
  skills text[] not null default '{}',
  experience_years integer not null default 0 check (experience_years >= 0),
  distance_km numeric not null default 0 check (distance_km >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  employer_name text not null,
  location text not null check (char_length(location) between 1 and 200),
  salary integer not null check (salary >= 0),
  working_hours text not null,
  skills text[] not null default '{}',
  workers_needed integer not null default 1 check (workers_needed > 0),
  distance_km numeric not null default 0 check (distance_km >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  worker_name text not null,
  status public.application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  unique (job_id, worker_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  present boolean not null,
  unique (job_id, worker_id, date)
);

create table if not exists public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'setu_digilocker',
  provider_request_id text,
  state_hash text not null unique,
  status public.verification_status not null default 'pending',
  verified_name text,
  verified_date_of_birth text,
  verified_address jsonb,
  document_hash text,
  provider_transaction_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  purpose text not null,
  scope text[] not null default '{}',
  notice_version text not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  verification_id uuid references public.identity_verifications(id) on delete set null,
  event_type text not null,
  provider_status text,
  error_code text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists worker_profiles_touch_updated_at on public.worker_profiles;
create trigger worker_profiles_touch_updated_at before update on public.worker_profiles for each row execute function public.touch_updated_at();

create or replace function public.set_job_owner_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.employer_id = auth.uid();
    select display_name into new.employer_name from public.profiles where id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_set_owner_name on public.jobs;
create trigger jobs_set_owner_name before insert on public.jobs for each row execute function public.set_job_owner_name();

create or replace function public.set_application_worker_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.worker_id = auth.uid();
    select display_name into new.worker_name from public.profiles where id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists applications_set_worker_name on public.applications;
create trigger applications_set_worker_name before insert on public.applications for each row execute function public.set_application_worker_name();

create or replace function public.is_verified_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and verification_status = 'verified'
      and (verification_expires_at is null or verification_expires_at > now())
  ) and exists (
    select 1 from auth.users
    where id = auth.uid() and email_confirmed_at is not null
  );
$$;

create or replace view public.worker_directory as
select
  wp.id,
  wp.name,
  wp.skills,
  wp.experience_years,
  wp.distance_km,
  (p.verification_status = 'verified') as verified
from public.worker_profiles wp
join public.profiles p on p.id = wp.id;

alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.attendance enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.consents enable row level security;
alter table public.verification_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists worker_profiles_select_own on public.worker_profiles;
create policy worker_profiles_select_own on public.worker_profiles for select to authenticated using (id = auth.uid());
drop policy if exists worker_profiles_insert_own on public.worker_profiles;
create policy worker_profiles_insert_own on public.worker_profiles for insert to authenticated with check (
  id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'worker')
);
drop policy if exists worker_profiles_update_own on public.worker_profiles;
create policy worker_profiles_update_own on public.worker_profiles for update to authenticated using (
  id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'worker')
) with check (
  id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'worker')
);

grant select on public.worker_directory to authenticated;

drop policy if exists jobs_read_published on public.jobs;
create policy jobs_read_published on public.jobs for select to authenticated using (published or employer_id = auth.uid());
drop policy if exists jobs_insert_verified on public.jobs;
create policy jobs_insert_verified on public.jobs for insert to authenticated with check (
  employer_id = auth.uid() and is_verified_user() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer')
);
drop policy if exists jobs_update_own on public.jobs;
create policy jobs_update_own on public.jobs for update to authenticated using (employer_id = auth.uid()) with check (employer_id = auth.uid());
drop policy if exists jobs_delete_own on public.jobs;
create policy jobs_delete_own on public.jobs for delete to authenticated using (employer_id = auth.uid());

drop policy if exists applications_read_related on public.applications;
create policy applications_read_related on public.applications for select to authenticated using (
  worker_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);
drop policy if exists applications_insert_verified_worker on public.applications;
create policy applications_insert_verified_worker on public.applications for insert to authenticated with check (
  worker_id = auth.uid() and is_verified_user() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'worker')
);
drop policy if exists applications_update_employer on public.applications;
create policy applications_update_employer on public.applications for update to authenticated using (
  exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);

drop policy if exists attendance_read_related on public.attendance;
create policy attendance_read_related on public.attendance for select to authenticated using (
  worker_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
);
drop policy if exists attendance_write_employer on public.attendance;
create policy attendance_write_employer on public.attendance for all to authenticated using (
  exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer')
) with check (
  exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid()) and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer')
);

drop policy if exists identity_verifications_read_own on public.identity_verifications;
create policy identity_verifications_read_own on public.identity_verifications for select to authenticated using (user_id = auth.uid());
drop policy if exists consents_read_own on public.consents;
create policy consents_read_own on public.consents for select to authenticated using (user_id = auth.uid());
drop policy if exists verification_events_read_own on public.verification_events;
create policy verification_events_read_own on public.verification_events for select to authenticated using (user_id = auth.uid());

revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert (id, role, display_name, email, phone) on public.profiles to authenticated;
grant update (display_name, email, phone) on public.profiles to authenticated;
grant select, insert, update on public.worker_profiles to authenticated;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, update on public.attendance to authenticated;
grant select on public.identity_verifications, public.consents, public.verification_events to authenticated;
