-- 015_core_iot.sql
-- Core tables and policies for farms/fields telemetry and sensor ingestion

-- Ensure helper extension is available
create extension if not exists "pgcrypto";

-- Augment farms table with telemetry summary columns
alter table if exists public.farms
  add column if not exists avg_ndvi numeric,
  add column if not exists avg_evi numeric,
  add column if not exists avg_ndwi numeric,
  add column if not exists avg_moisture numeric,
  add column if not exists avg_temperature numeric;

-- Augment fields table with last-known metrics
alter table if exists public.fields
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists last_ndvi numeric,
  add column if not exists last_evi numeric,
  add column if not exists last_ndwi numeric,
  add column if not exists last_moisture numeric,
  add column if not exists last_temperature numeric,
  add column if not exists last_rainfall numeric,
  add column if not exists last_reading_at timestamptz;

-- Sensors metadata table
create table if not exists public.sensors (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  hardware_id text not null unique,
  sensor_type text not null check (sensor_type in ('moisture','weather','ph','salinity','climate','multi')),
  firmware_version text,
  location jsonb,
  calibration jsonb,
  status text not null default 'online' check (status in ('online','offline','maintenance','retired')),
  last_reading_at timestamptz,
  last_payload jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create trigger handle_sensors_updated_at
  before update on public.sensors
  for each row
  execute function public.handle_updated_at();

-- Time-series readings per sensor
create table if not exists public.sensor_readings (
  id bigint generated always as identity primary key,
  sensor_id uuid not null references public.sensors(id) on delete cascade,
  recorded_at timestamptz not null default timezone('utc'::text, now()),
  moisture numeric,
  temperature numeric,
  ph numeric,
  salinity numeric,
  battery_status numeric,
  payload jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists sensor_readings_sensor_ts_idx
  on public.sensor_readings(sensor_id, recorded_at desc);

-- Enable RLS
alter table public.sensors enable row level security;
alter table public.sensor_readings enable row level security;

drop policy if exists "Users can manage sensors of their fields" on public.sensors;
create policy "Users can manage sensors of their fields"
  on public.sensors
  for all
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = sensors.field_id
      and (farms.owner_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = field_id
      and farms.owner_id = auth.uid()
    )
  );

drop policy if exists "Managers and engineers can view sensors" on public.sensors;
create policy "Managers and engineers can view sensors"
  on public.sensors
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager','engineer')
    )
    or
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = sensors.field_id
      and farms.owner_id = auth.uid()
    )
  );

-- Policies for sensor_readings (inherit access via sensor)
drop policy if exists "Users can view readings of their sensors" on public.sensor_readings;
create policy "Users can view readings of their sensors"
  on public.sensor_readings
  for select
  using (
    exists (
      select 1
      from public.sensors
      join public.fields on fields.id = sensors.field_id
      join public.farms on farms.id = fields.farm_id
      where sensors.id = sensor_readings.sensor_id
      and farms.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert readings of their sensors" on public.sensor_readings;
create policy "Users can insert readings of their sensors"
  on public.sensor_readings
  for insert
  with check (
    exists (
      select 1
      from public.sensors
      join public.fields on fields.id = sensors.field_id
      join public.farms on farms.id = fields.farm_id
      where sensors.id = sensor_id
      and farms.owner_id = auth.uid()
    )
  );

drop policy if exists "Managers and engineers can view all readings" on public.sensor_readings;
create policy "Managers and engineers can view all readings"
  on public.sensor_readings
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager','engineer')
    )
  );
