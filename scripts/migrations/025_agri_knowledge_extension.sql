begin;

set search_path = public;

-- ------------------------------------------------------------------
-- Extend crop knowledge base with richer plant issue metadata,
-- treatments, soil types, and innovations.
-- This builds on 024_crop_knowledge_schema.sql without breaking it.
-- ------------------------------------------------------------------

-- 1) Extend disease_pests with extra descriptive fields
--    to align with the "plant issues" design (cause, symptoms, treatment).

alter table if exists public.disease_pests
  add column if not exists cause_agent text,
  add column if not exists symptoms_en text,
  add column if not exists symptoms_ar text,
  add column if not exists recommended_treatment_en text,
  add column if not exists recommended_treatment_ar text;

-- 2) Treatments: generic interventions (chemical, cultural, biological, etc.)

create table if not exists public.treatments (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  type_en text,
  type_ar text,
  description_en text,
  description_ar text,
  notes_en text,
  notes_ar text
);

-- 3) issue_treatments: link disease_pests <-> treatments (many-to-many).

create table if not exists public.issue_treatments (
  issue_id integer not null references public.disease_pests(id) on delete cascade,
  treatment_id integer not null references public.treatments(id) on delete cascade,
  primary key (issue_id, treatment_id)
);

create index if not exists issue_treatments_issue_idx on public.issue_treatments(issue_id);
create index if not exists issue_treatments_treatment_idx on public.issue_treatments(treatment_id);

-- 4) soil_types: reference table for soil classification and behaviour.

create table if not exists public.soil_types (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  texture_en text,
  texture_ar text,
  drainage_en text,
  drainage_ar text,
  water_holding_capacity_en text,
  water_holding_capacity_ar text,
  ph_range text,
  salinity_ec numeric(5,2),
  notes_en text,
  notes_ar text
);

-- 5) innovations: agricultural innovations / practices.

create table if not exists public.innovations (
  id serial primary key,
  name_en text not null,
  name_ar text not null,
  category_en text,
  category_ar text,
  description_en text,
  description_ar text,
  benefits_en text,
  benefits_ar text,
  adoption_en text,
  adoption_ar text,
  reference_links text
);

-- ------------------------------------------------------------------
-- Row‑level security: read‑only for all authenticated users
-- (writes are expected via service role / admin tooling).
-- ------------------------------------------------------------------

alter table public.treatments enable row level security;
alter table public.issue_treatments enable row level security;
alter table public.soil_types enable row level security;
alter table public.innovations enable row level security;

drop policy if exists "treatments_read" on public.treatments;
create policy "treatments_read"
  on public.treatments
  for select
  using (true);

drop policy if exists "issue_treatments_read" on public.issue_treatments;
create policy "issue_treatments_read"
  on public.issue_treatments
  for select
  using (true);

drop policy if exists "soil_types_read" on public.soil_types;
create policy "soil_types_read"
  on public.soil_types
  for select
  using (true);

drop policy if exists "innovations_read" on public.innovations;
create policy "innovations_read"
  on public.innovations
  for select
  using (true);

commit;
