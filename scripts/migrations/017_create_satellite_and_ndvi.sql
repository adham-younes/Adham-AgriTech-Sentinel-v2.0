-- 017_create_satellite_and_ndvi.sql
-- Satellite imagery & NDVI storage with RLS

create extension if not exists "pgcrypto";

create table if not exists public.satellite_images (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider varchar(30) not null default 'Sentinel',
  captured_at timestamptz not null default timezone('utc'::text, now()),
  image_url text,
  file_path text,
  band_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists satellite_images_field_idx on public.satellite_images(field_id);
create index if not exists satellite_images_user_idx on public.satellite_images(user_id);
create index if not exists satellite_images_captured_idx on public.satellite_images(captured_at desc);

drop trigger if exists handle_satellite_images_updated_at on public.satellite_images;
create trigger handle_satellite_images_updated_at
  before update on public.satellite_images
  for each row
  execute function public.handle_updated_at();

alter table public.satellite_images enable row level security;

drop policy if exists "Users select their satellite images" on public.satellite_images;
create policy "Users select their satellite images"
  on public.satellite_images
  for select
  using (user_id = auth.uid());

drop policy if exists "Users insert their satellite images" on public.satellite_images;
create policy "Users insert their satellite images"
  on public.satellite_images
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update their satellite images" on public.satellite_images;
create policy "Users update their satellite images"
  on public.satellite_images
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete their satellite images" on public.satellite_images;
create policy "Users delete their satellite images"
  on public.satellite_images
  for delete
  using (user_id = auth.uid());

create table if not exists public.ndvi_indices (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  image_id uuid references public.satellite_images(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider varchar(30) not null default 'Sentinel',
  ndvi_value numeric,
  evi_value numeric,
  ndwi_value numeric,
  computed_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ndvi_indices_field_idx on public.ndvi_indices(field_id);
create index if not exists ndvi_indices_user_idx on public.ndvi_indices(user_id);
create index if not exists ndvi_indices_computed_idx on public.ndvi_indices(computed_at desc);

drop trigger if exists handle_ndvi_indices_updated_at on public.ndvi_indices;
create trigger handle_ndvi_indices_updated_at
  before update on public.ndvi_indices
  for each row
  execute function public.handle_updated_at();

alter table public.ndvi_indices enable row level security;

drop policy if exists "Users select their ndvi indices" on public.ndvi_indices;
create policy "Users select their ndvi indices"
  on public.ndvi_indices
  for select
  using (user_id = auth.uid());

drop policy if exists "Users insert their ndvi indices" on public.ndvi_indices;
create policy "Users insert their ndvi indices"
  on public.ndvi_indices
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update their ndvi indices" on public.ndvi_indices;
create policy "Users update their ndvi indices"
  on public.ndvi_indices
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete their ndvi indices" on public.ndvi_indices;
create policy "Users delete their ndvi indices"
  on public.ndvi_indices
  for delete
  using (user_id = auth.uid());
