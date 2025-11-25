-- Create reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  field_id uuid references public.fields(id) on delete set null,
  report_type text not null check (report_type in ('soil', 'crop', 'weather', 'irrigation', 'comprehensive')),
  title text not null,
  title_ar text,
  date_from date not null,
  date_to date not null,
  data jsonb not null, -- Report data in JSON format
  file_url text, -- PDF export URL
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

create policy "Users can delete their own reports"
  on public.reports for delete
  using (auth.uid() = user_id);
