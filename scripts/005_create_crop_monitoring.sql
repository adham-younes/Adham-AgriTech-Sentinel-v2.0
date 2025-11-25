-- Create crop monitoring table for satellite data
create table if not exists public.crop_monitoring (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  monitoring_date date not null default current_date,
  ndvi_value numeric, -- Normalized Difference Vegetation Index
  evi_value numeric, -- Enhanced Vegetation Index
  ndwi_value numeric, -- Normalized Difference Water Index
  satellite_image_url text,
  health_status text check (health_status in ('excellent', 'good', 'fair', 'poor', 'critical')),
  notes text,
  notes_ar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.crop_monitoring enable row level security;

-- RLS Policies
create policy "Users can view crop monitoring of their fields"
  on public.crop_monitoring for select
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = crop_monitoring.field_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Managers and engineers can view all crop monitoring"
  on public.crop_monitoring for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'engineer')
    )
  );
