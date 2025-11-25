-- Create farms table
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  name_ar text,
  location text not null,
  area numeric not null, -- in hectares
  latitude numeric not null,
  longitude numeric not null,
  description text,
  description_ar text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.farms enable row level security;

-- RLS Policies for farms
create policy "Users can view their own farms"
  on public.farms for select
  using (auth.uid() = owner_id);

create policy "Users can insert their own farms"
  on public.farms for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own farms"
  on public.farms for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own farms"
  on public.farms for delete
  using (auth.uid() = owner_id);

-- Managers and engineers can view all farms
create policy "Managers and engineers can view all farms"
  on public.farms for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'engineer')
    )
  );

create trigger handle_farms_updated_at
  before update on public.farms
  for each row
  execute function public.handle_updated_at();
