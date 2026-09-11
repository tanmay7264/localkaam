-- Add schedule_interview and onboarding to hiring pipeline

alter type public.application_status add value if not exists 'schedule_interview';
alter type public.application_status add value if not exists 'onboarding';

alter table public.applications
  add column if not exists stage_actions jsonb default '{}'::jsonb;
