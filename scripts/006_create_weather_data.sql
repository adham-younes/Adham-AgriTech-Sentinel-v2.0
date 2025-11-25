-- Create weather data table
create table if not exists public.weather_data (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  date date not null default current_date,
  temperature numeric, -- celsius
  humidity numeric, -- percentage
  precipitation numeric, -- mm
  wind_speed numeric, -- km/h
  wind_direction text,
  pressure numeric, -- hPa
  weather_condition text,
  weather_condition_ar text,
  forecast_data jsonb, -- 7-day forecast
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.weather_data enable row level security;

-- RLS Policies
create policy "Users can view weather data for their farms"
  on public.weather_data for select
  using (
    exists (
      select 1 from public.farms
      where farms.id = weather_data.farm_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Managers and engineers can view all weather data"
  on public.weather_data for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'engineer')
    )
  );
