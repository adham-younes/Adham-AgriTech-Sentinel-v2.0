begin;

set search_path = public;

-- ------------------------------------------------------------------
-- Global crop knowledge base (bilingual, vendor‑neutral)
-- ------------------------------------------------------------------

-- 1. Crop categories (حبوب، خضروات، فواكه، إلخ)
create table if not exists public.crop_categories (
  id serial primary key,
  name_en text not null,
  name_ar text not null
);

-- 2. Main crops table (المحاصيل الرئيسية)
create table if not exists public.crops (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  category_id integer not null references public.crop_categories(id),
  water_requirement_en text not null,
  water_requirement_ar text not null,
  soil_type_en text,
  soil_type_ar text,
  ph_min numeric(3,1),
  ph_max numeric(3,1),
  ec_min numeric(4,2),
  ec_max numeric(4,2),
  salt_sensitivity_en text,
  salt_sensitivity_ar text,
  optimal_temp_min_c numeric(4,1),
  optimal_temp_max_c numeric(4,1),
  suitable_regions_en text,
  suitable_regions_ar text,
  days_to_emergence integer,
  days_to_flowering integer,
  days_to_maturity integer
);

create index if not exists crops_category_idx on public.crops(category_id);

-- 3. Propagation methods (طرق الإكثار)
create table if not exists public.propagation_methods (
  id serial primary key,
  method_en text not null,
  method_ar text not null
);

-- 4. Crop‑to‑propagation link table
create table if not exists public.crop_propagation (
  crop_id integer not null references public.crops(id) on delete cascade,
  method_id integer not null references public.propagation_methods(id),
  primary key (crop_id, method_id)
);

-- 5. Growth stages per crop with recommended indices
create table if not exists public.growth_stages (
  id serial primary key,
  crop_id integer not null references public.crops(id) on delete cascade,
  stage_name_en text not null,
  stage_name_ar text not null,
  ndvi_min numeric(3,2),
  ndvi_optimal numeric(3,2),
  ndvi_max numeric(3,2),
  chlorophyll_min numeric(4,1),
  chlorophyll_max numeric(4,1),
  soil_moisture_min numeric(4,1),
  soil_moisture_optimal numeric(4,1),
  soil_moisture_max numeric(4,1),
  temp_min_c numeric(4,1),
  temp_optimal_c numeric(4,1),
  temp_max_c numeric(4,1),
  ph_min numeric(3,1),
  ph_max numeric(3,1),
  ec_max numeric(4,2)
);

create index if not exists growth_stages_crop_idx on public.growth_stages(crop_id);

-- 6. Diseases and pests reference (الأمراض والآفات)
create table if not exists public.disease_pests (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  type_en text not null,
  type_ar text not null,
  conditions_en text,
  conditions_ar text,
  severity_en text,
  severity_ar text
);

-- 7. Crop‑to‑disease/pest associations
create table if not exists public.crop_diseases (
  crop_id integer not null references public.crops(id) on delete cascade,
  disease_id integer not null references public.disease_pests(id) on delete cascade,
  primary key (crop_id, disease_id)
);

create index if not exists crop_diseases_crop_idx on public.crop_diseases(crop_id);
create index if not exists crop_diseases_disease_idx on public.crop_diseases(disease_id);

-- 8. Fertilizers reference (الأسمدة)
create table if not exists public.fertilizers (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  type_en text,
  type_ar text,
  usage_en text,
  usage_ar text,
  composition text
);

-- 9. Pesticides reference (المبيدات)
create table if not exists public.pesticides (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  target_en text not null,
  target_ar text not null,
  usage_en text,
  usage_ar text,
  active_ingredients text
);

-- ------------------------------------------------------------------
-- Row‑level security: read‑only for all authenticated users
-- (writes are managed via admin tooling / service role)
-- ------------------------------------------------------------------

alter table public.crop_categories enable row level security;
alter table public.crops enable row level security;
alter table public.propagation_methods enable row level security;
alter table public.crop_propagation enable row level security;
alter table public.growth_stages enable row level security;
alter table public.disease_pests enable row level security;
alter table public.crop_diseases enable row level security;
alter table public.fertilizers enable row level security;
alter table public.pesticides enable row level security;

drop policy if exists "crop_categories_read" on public.crop_categories;
create policy "crop_categories_read"
  on public.crop_categories
  for select
  using (true);

drop policy if exists "crops_read" on public.crops;
create policy "crops_read"
  on public.crops
  for select
  using (true);

drop policy if exists "propagation_methods_read" on public.propagation_methods;
create policy "propagation_methods_read"
  on public.propagation_methods
  for select
  using (true);

drop policy if exists "crop_propagation_read" on public.crop_propagation;
create policy "crop_propagation_read"
  on public.crop_propagation
  for select
  using (true);

drop policy if exists "growth_stages_read" on public.growth_stages;
create policy "growth_stages_read"
  on public.growth_stages
  for select
  using (true);

drop policy if exists "disease_pests_read" on public.disease_pests;
create policy "disease_pests_read"
  on public.disease_pests
  for select
  using (true);

drop policy if exists "crop_diseases_read" on public.crop_diseases;
create policy "crop_diseases_read"
  on public.crop_diseases
  for select
  using (true);

drop policy if exists "fertilizers_read" on public.fertilizers;
create policy "fertilizers_read"
  on public.fertilizers
  for select
  using (true);

drop policy if exists "pesticides_read" on public.pesticides;
create policy "pesticides_read"
  on public.pesticides
  for select
  using (true);

commit;

