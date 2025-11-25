-- Create soil analysis table
create table if not exists public.soil_analysis (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  analysis_date date not null default current_date,
  ph_level numeric,
  nitrogen numeric, -- N (mg/kg)
  phosphorus numeric, -- P (mg/kg)
  potassium numeric, -- K (mg/kg)
  organic_matter numeric, -- percentage
  moisture numeric, -- percentage
  temperature numeric, -- celsius
  electrical_conductivity numeric, -- EC (dS/m)
  -- AI recommendations
  ai_recommendations text,
  ai_recommendations_ar text,
  fertilizer_recommendations jsonb,
  irrigation_recommendations text,
  irrigation_recommendations_ar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.soil_analysis enable row level security;

-- RLS Policies
create policy "Users can view soil analysis of their fields"
  on public.soil_analysis for select
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = soil_analysis.field_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can insert soil analysis for their fields"
  on public.soil_analysis for insert
  with check (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = field_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Managers and engineers can view all soil analysis"
  on public.soil_analysis for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'engineer')
    )
  );

create trigger handle_soil_analysis_updated_at
  before update on public.soil_analysis
  for each row
  execute function public.handle_updated_at();
