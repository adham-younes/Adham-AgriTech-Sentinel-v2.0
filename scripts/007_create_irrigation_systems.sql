-- Create irrigation systems table
create table if not exists public.irrigation_systems (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  system_name text not null,
  system_type text check (system_type in ('drip', 'sprinkler', 'flood')),
  status text default 'off' check (status in ('on', 'off', 'scheduled', 'maintenance')),
  flow_rate numeric, -- liters per hour
  pressure numeric, -- bar
  last_maintenance_date date,
  next_maintenance_date date,
  -- IoT sensor data
  sensor_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create irrigation schedules table
create table if not exists public.irrigation_schedules (
  id uuid primary key default gen_random_uuid(),
  irrigation_system_id uuid not null references public.irrigation_systems(id) on delete cascade,
  start_time time not null,
  duration integer not null, -- minutes
  days_of_week integer[] not null, -- 0=Sunday, 6=Saturday
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.irrigation_systems enable row level security;
alter table public.irrigation_schedules enable row level security;

-- RLS Policies for irrigation systems
create policy "Users can view irrigation systems of their fields"
  on public.irrigation_systems for select
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = irrigation_systems.field_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can manage irrigation systems of their fields"
  on public.irrigation_systems for all
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = irrigation_systems.field_id
      and farms.owner_id = auth.uid()
    )
  );

-- RLS Policies for irrigation schedules
create policy "Users can view irrigation schedules"
  on public.irrigation_schedules for select
  using (
    exists (
      select 1 from public.irrigation_systems
      join public.fields on fields.id = irrigation_systems.field_id
      join public.farms on farms.id = fields.farm_id
      where irrigation_systems.id = irrigation_schedules.irrigation_system_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can manage irrigation schedules"
  on public.irrigation_schedules for all
  using (
    exists (
      select 1 from public.irrigation_systems
      join public.fields on fields.id = irrigation_systems.field_id
      join public.farms on farms.id = fields.farm_id
      where irrigation_systems.id = irrigation_schedules.irrigation_system_id
      and farms.owner_id = auth.uid()
    )
  );

create trigger handle_irrigation_systems_updated_at
  before update on public.irrigation_systems
  for each row
  execute function public.handle_updated_at();
