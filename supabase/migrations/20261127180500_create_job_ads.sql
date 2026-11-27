-- Already applied to the Supabase project "JobApp". Kept here as a record of the schema.
create table public.job_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_url text,
  raw_text text,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'done', 'failed')),
  title text,
  company text,
  location text,
  work_mode text check (work_mode in ('remote', 'hybrid', 'onsite', 'unknown')),
  contract_types text[] not null default '{}',
  seniority text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text,
  salary_period text,
  benefits text[] not null default '{}',
  tech_requirements text[] not null default '{}',
  nice_to_have text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_ads_user_id_idx on public.job_ads (user_id);

-- Row Level Security: every user sees and changes only their own ads.
alter table public.job_ads enable row level security;

create policy "Users read own ads" on public.job_ads
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own ads" on public.job_ads
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own ads" on public.job_ads
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own ads" on public.job_ads
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger job_ads_set_updated_at
  before update on public.job_ads
  for each row execute function public.set_updated_at();
