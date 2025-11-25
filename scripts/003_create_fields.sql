-- Create fields table
create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  name_ar text,
  area numeric not null, -- in hectares
  crop_type text,
  crop_type_ar text,
  planting_date date,
  expected_harvest_date date,
  soil_type text,
  irrigation_type text check (irrigation_type in ('drip', 'sprinkler', 'flood', 'manual')),
  -- GPS coordinates for field boundaries (stored as JSON array of lat/lng points)
  boundaries jsonb,
  status text default 'active' check (status in ('active', 'inactive', 'fallow')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.fields enable row level security;

-- RLS Policies for fields
create policy "Users can view fields of their farms"
  on public.fields for select
  using (
    exists (
      select 1 from public.farms
      where farms.id = fields.farm_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can insert fields to their farms"
  on public.fields for insert
  with check (
    exists (
      select 1 from public.farms
      where farms.id = farm_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can update fields of their farms"
  on public.fields for update
  using (
    exists (
      select 1 from public.farms
      where farms.id = fields.farm_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can delete fields of their farms"
  on public.fields for delete
  using (
    exists (
      select 1 from public.farms
      where farms.id = fields.farm_id
      and farms.owner_id = auth.uid()
    )
  );

-- Managers and engineers can view all fields
create policy "Managers and engineers can view all fields"
  on public.fields for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'engineer')
    )
  );

create trigger handle_fields_updated_at
  before update on public.fields
  for each row
  execute function public.handle_updated_at();
