-- Create reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  report_type text not null check (report_type in ('farm_summary', 'soil_analysis', 'crop_health', 'irrigation', 'weather', 'financial')),
  title text not null,
  title_ar text,
  content jsonb not null,
  date_from date,
  date_to date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reports enable row level security;

-- RLS Policies
create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can create their own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Managers can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'manager'
    )
  );
