-- ============================================================
-- Adham AgriTech - Primary Supabase Schema
-- Run this script once against your Supabase project's database
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'farmer')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

create or replace function public.ensure_current_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_uid uuid;
begin
  begin
    jwt_uid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  exception
    when others then
      jwt_uid := null;
  end;

  if new.user_id is null then
    new.user_id := coalesce(jwt_uid, auth.uid());
  end if;

  if new.user_id is null then
    raise exception 'user_id is required for this operation';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'farmer' check (role in ('farmer', 'engineer', 'manager')),
  avatar_url text,
  language text not null default 'ar' check (language in ('ar', 'en')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------
-- Farms
-- ------------------------------------------------------------------
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  location text,
  total_area numeric,
  latitude double precision,
  longitude double precision,
  soil_type text,
  irrigation_type text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.farms
  add column if not exists user_id uuid;

alter table public.farms
  drop constraint if exists farms_user_id_fkey;

do $$
declare
  owner_column_exists boolean := false;
  user_column_exists boolean := false;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'farms'
      and column_name = 'owner_id'
  )
  into owner_column_exists;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'farms'
      and column_name = 'user_id'
  )
  into user_column_exists;

  if user_column_exists and owner_column_exists then
    execute 'update public.farms set user_id = owner_id where user_id is null and owner_id is not null';
  end if;

  if user_column_exists then
    begin
      execute 'alter table public.farms alter column user_id set not null';
    exception
      when not_null_violation then
        raise notice 'Skipped enforcing NOT NULL on public.farms.user_id because some rows still contain null values. Please backfill them manually.';
    end;

    begin
      execute 'alter table public.farms add constraint farms_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$$ language plpgsql;

alter table public.farms
  add column if not exists owner_id uuid generated always as (user_id) stored;

create or replace function public.sync_farm_owner_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is not null and (new.owner_id is null or new.owner_id is distinct from new.user_id) then
    new.owner_id = new.user_id;
  end if;
  return new;
end;
$$;

do $$
declare
  owner_column_exists boolean := false;
  owner_is_generated boolean := false;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'farms'
      and column_name = 'owner_id'
  )
  into owner_column_exists;

  if owner_column_exists then
    select coalesce(attgenerated = 's', false)
    into owner_is_generated
    from pg_attribute a
    join pg_class c on a.attrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public'
      and c.relname = 'farms'
      and a.attname = 'owner_id';

    if not owner_is_generated then
      begin
        execute 'update public.farms set owner_id = user_id where owner_id is distinct from user_id or owner_id is null';
      exception
        when undefined_column then
          null;
      end;

      execute 'drop trigger if exists sync_farm_owner_id on public.farms';
      execute
        'create trigger sync_farm_owner_id
           before insert or update on public.farms
           for each row execute function public.sync_farm_owner_id()';
    else
      execute 'drop trigger if exists sync_farm_owner_id on public.farms';
    end if;
  end if;
end;
$$ language plpgsql;

create index if not exists farms_user_id_idx on public.farms(user_id);

alter table public.farms enable row level security;

drop policy if exists "farms_owner_crud" on public.farms;
create policy "farms_owner_crud"
  on public.farms
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "farms_manager_view" on public.farms;
create policy "farms_manager_view"
  on public.farms
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'engineer')
    )
  );

drop trigger if exists handle_farms_updated_at on public.farms;
create trigger handle_farms_updated_at
  before update on public.farms
  for each row execute function public.handle_updated_at();

drop trigger if exists ensure_farm_owner_from_auth on public.farms;
create trigger ensure_farm_owner_from_auth
  before insert on public.farms
  for each row execute function public.ensure_current_user_id();

-- ------------------------------------------------------------------
-- Fields
-- ------------------------------------------------------------------
create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  area numeric,
  crop_type text,
  soil_type text,
  planting_date date,
  boundary_coordinates jsonb,
  centroid jsonb,
  latitude double precision,
  longitude double precision,
  ndvi_score numeric,
  moisture_index numeric,
  yield_potential numeric,
  last_snapshot_at timestamptz,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists fields_farm_id_idx on public.fields(farm_id);
create index if not exists fields_user_id_idx on public.fields(user_id);

alter table public.fields enable row level security;

drop policy if exists "fields_owner_crud" on public.fields;
create policy "fields_owner_crud"
  on public.fields
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "fields_farm_owner_view" on public.fields;
create policy "fields_farm_owner_view"
  on public.fields
  for select
  using (
    exists (
      select 1
      from public.farms
      where farms.id = fields.farm_id
      and farms.user_id = auth.uid()
    )
  );

drop trigger if exists handle_fields_updated_at on public.fields;
create trigger handle_fields_updated_at
  before update on public.fields
  for each row execute function public.handle_updated_at();

drop trigger if exists ensure_field_owner_from_auth on public.fields;
create trigger ensure_field_owner_from_auth
  before insert on public.fields
  for each row execute function public.ensure_current_user_id();

-- ------------------------------------------------------------------
-- Field satellite snapshots
-- ------------------------------------------------------------------
create table if not exists public.field_satellite_snapshots (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  scene_id text,
  provider text,
  captured_at timestamptz not null default timezone('utc'::text, now()),
  index_name text default 'ndvi',
  ndvi numeric,
  chlorophyll numeric,
  url text,
  statistics jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists field_snapshots_field_idx on public.field_satellite_snapshots(field_id, captured_at desc);

alter table public.field_satellite_snapshots enable row level security;

drop policy if exists "field_snapshots_view" on public.field_satellite_snapshots;
create policy "field_snapshots_view"
  on public.field_satellite_snapshots
  for select
  using (
    exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = field_satellite_snapshots.field_id
      and farms.user_id = auth.uid()
    )
  );

drop policy if exists "field_snapshots_service_role" on public.field_satellite_snapshots;
create policy "field_snapshots_service_role"
  on public.field_satellite_snapshots
  for all
  using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role')
  with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

-- ------------------------------------------------------------------
-- Soil analysis
-- ------------------------------------------------------------------
create table if not exists public.soil_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  analysis_date date not null,
  ph_level numeric,
  nitrogen_ppm numeric,
  phosphorus_ppm numeric,
  potassium_ppm numeric,
  organic_matter_percent numeric,
  moisture_percent numeric,
  ec_ds_m numeric,
  ai_recommendations text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.soil_analysis enable row level security;

drop policy if exists "soil_analysis_owner_crud" on public.soil_analysis;
create policy "soil_analysis_owner_crud"
  on public.soil_analysis
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "soil_analysis_field_owner_view" on public.soil_analysis;
create policy "soil_analysis_field_owner_view"
  on public.soil_analysis
  for select
  using (
    exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where soil_analysis.field_id = fields.id
      and farms.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------
-- Crop monitoring
-- ------------------------------------------------------------------
create table if not exists public.crop_monitoring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete cascade,
  monitoring_date date not null default current_date,
  health_status text check (health_status in ('excellent', 'good', 'fair', 'poor', 'critical')),
  ndvi_value numeric,
  evi_value numeric,
  ndwi_value numeric,
  temperature_celsius numeric,
  satellite_image_url text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.crop_monitoring enable row level security;

drop policy if exists "crop_monitoring_owner_crud" on public.crop_monitoring;
create policy "crop_monitoring_owner_crud"
  on public.crop_monitoring
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "crop_monitoring_field_owner_view" on public.crop_monitoring;
create policy "crop_monitoring_field_owner_view"
  on public.crop_monitoring
  for select
  using (
    exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where crop_monitoring.field_id = fields.id
      and farms.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------
-- Notifications
-- ------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('alert', 'warning', 'info', 'success')),
  category text check (category in ('weather', 'irrigation', 'soil', 'crop', 'system', 'general')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_owner_crud" on public.notifications;
create policy "notifications_owner_crud"
  on public.notifications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- AI chat history
-- ------------------------------------------------------------------
create table if not exists public.ai_chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  field_id uuid references public.fields(id) on delete set null,
  message text not null,
  response text not null,
  context jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ai_chat_user_idx on public.ai_chat_history(user_id, created_at desc);

alter table public.ai_chat_history enable row level security;

drop policy if exists "ai_chat_owner_crud" on public.ai_chat_history;
create policy "ai_chat_owner_crud"
  on public.ai_chat_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Reports
-- ------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  report_type text not null,
  start_date date,
  end_date date,
  data jsonb,
  status text not null default 'completed' check (status in ('draft', 'completed', 'failed')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.reports enable row level security;

drop policy if exists "reports_owner_crud" on public.reports;
create policy "reports_owner_crud"
  on public.reports
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists handle_reports_updated_at on public.reports;
create trigger handle_reports_updated_at
  before update on public.reports
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------
-- Marketplace
-- ------------------------------------------------------------------
create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('seeds', 'fertilizers', 'pesticides', 'equipment', 'tools', 'other')),
  price numeric not null,
  currency text not null default 'EGP',
  quantity integer not null default 0,
  unit text not null,
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'sold_out')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  quantity integer not null,
  total_price numeric not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  delivery_address text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.marketplace_products enable row level security;
alter table public.marketplace_orders enable row level security;

drop policy if exists "marketplace_products_view" on public.marketplace_products;
create policy "marketplace_products_view"
  on public.marketplace_products
  for select
  using (status = 'active' or auth.uid() = seller_id);

drop policy if exists "marketplace_products_manage" on public.marketplace_products;
create policy "marketplace_products_manage"
  on public.marketplace_products
  for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "marketplace_orders_view" on public.marketplace_orders;
create policy "marketplace_orders_view"
  on public.marketplace_orders
  for select
  using (
    auth.uid() = buyer_id
    or exists (
      select 1 from public.marketplace_products
      where marketplace_products.id = marketplace_orders.product_id
      and marketplace_products.seller_id = auth.uid()
    )
  );

drop policy if exists "marketplace_orders_manage" on public.marketplace_orders;
create policy "marketplace_orders_manage"
  on public.marketplace_orders
  for all
  using (auth.uid() = buyer_id)
  with check (auth.uid() = buyer_id);

drop trigger if exists handle_marketplace_products_updated_at on public.marketplace_products;
create trigger handle_marketplace_products_updated_at
  before update on public.marketplace_products
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_marketplace_orders_updated_at on public.marketplace_orders;
create trigger handle_marketplace_orders_updated_at
  before update on public.marketplace_orders
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------
-- Forum
-- ------------------------------------------------------------------
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text check (category in ('question', 'discussion', 'tip', 'problem', 'general')),
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  likes_count integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.forum_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, post_id),
  unique(user_id, comment_id),
  check ((post_id is not null and comment_id is null) or (post_id is null and comment_id is not null))
);

alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_likes enable row level security;

drop policy if exists "forum_posts_view" on public.forum_posts;
create policy "forum_posts_view"
  on public.forum_posts
  for select using (true);

drop policy if exists "forum_posts_manage" on public.forum_posts;
create policy "forum_posts_manage"
  on public.forum_posts
  for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "forum_comments_view" on public.forum_comments;
create policy "forum_comments_view"
  on public.forum_comments
  for select using (true);

drop policy if exists "forum_comments_manage" on public.forum_comments;
create policy "forum_comments_manage"
  on public.forum_comments
  for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "forum_likes_view" on public.forum_likes;
create policy "forum_likes_view"
  on public.forum_likes
  for select using (true);

drop policy if exists "forum_likes_manage" on public.forum_likes;
create policy "forum_likes_manage"
  on public.forum_likes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.update_post_comments_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.forum_posts set comments_count = comments_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;

create or replace function public.update_likes_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.post_id is not null then
      update public.forum_posts set likes_count = likes_count + 1 where id = new.post_id;
    elsif new.comment_id is not null then
      update public.forum_comments set likes_count = likes_count + 1 where id = new.comment_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.post_id is not null then
      update public.forum_posts set likes_count = likes_count - 1 where id = old.post_id;
    elsif old.comment_id is not null then
      update public.forum_comments set likes_count = likes_count - 1 where id = old.comment_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists update_post_comments_count_trigger on public.forum_comments;
create trigger update_post_comments_count_trigger
  after insert or delete on public.forum_comments
  for each row execute function public.update_post_comments_count();

drop trigger if exists update_likes_count_trigger on public.forum_likes;
create trigger update_likes_count_trigger
  after insert or delete on public.forum_likes
  for each row execute function public.update_likes_count();

drop trigger if exists handle_forum_posts_updated_at on public.forum_posts;
create trigger handle_forum_posts_updated_at
  before update on public.forum_posts
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_forum_comments_updated_at on public.forum_comments;
create trigger handle_forum_comments_updated_at
  before update on public.forum_comments
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------
-- Irrigation
-- ------------------------------------------------------------------
create table if not exists public.irrigation_systems (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  system_name text not null,
  system_type text check (system_type in ('drip', 'sprinkler', 'flood', 'manual')),
  status text not null default 'off' check (status in ('on', 'off', 'scheduled', 'maintenance')),
  flow_rate numeric,
  pressure numeric,
  last_maintenance_date date,
  next_maintenance_date date,
  sensor_data jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.irrigation_schedules (
  id uuid primary key default gen_random_uuid(),
  irrigation_system_id uuid not null references public.irrigation_systems(id) on delete cascade,
  start_time time not null,
  duration integer not null,
  days_of_week integer[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.irrigation_systems enable row level security;
alter table public.irrigation_schedules enable row level security;

drop policy if exists "irrigation_systems_manage" on public.irrigation_systems;
create policy "irrigation_systems_manage"
  on public.irrigation_systems
  for all
  using (
    exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where irrigation_systems.field_id = fields.id
      and farms.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where irrigation_systems.field_id = fields.id
      and farms.user_id = auth.uid()
    )
  );

drop policy if exists "irrigation_schedules_manage" on public.irrigation_schedules;
create policy "irrigation_schedules_manage"
  on public.irrigation_schedules
  for all
  using (
    exists (
      select 1
      from public.irrigation_systems
      join public.fields on fields.id = irrigation_systems.field_id
      join public.farms on farms.id = fields.farm_id
      where irrigation_systems.id = irrigation_schedules.irrigation_system_id
      and farms.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.irrigation_systems
      join public.fields on fields.id = irrigation_systems.field_id
      join public.farms on farms.id = fields.farm_id
      where irrigation_systems.id = irrigation_schedules.irrigation_system_id
      and farms.user_id = auth.uid()
    )
  );

drop trigger if exists handle_irrigation_systems_updated_at on public.irrigation_systems;
create trigger handle_irrigation_systems_updated_at
  before update on public.irrigation_systems
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------
-- Usage metrics
-- ------------------------------------------------------------------
create table if not exists public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid,
  feature_id text not null,
  action text not null,
  plan_id text not null,
  units integer not null default 1,
  metadata jsonb,
  occurred_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists usage_metrics_user_idx on public.usage_metrics(user_id, occurred_at desc);

alter table public.usage_metrics enable row level security;

drop policy if exists "usage_metrics_view_own" on public.usage_metrics;
create policy "usage_metrics_view_own"
  on public.usage_metrics
  for select
  using (auth.uid() = user_id);

drop policy if exists "usage_metrics_insert_own" on public.usage_metrics;
create policy "usage_metrics_insert_own"
  on public.usage_metrics
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "usage_metrics_service_role" on public.usage_metrics;
create policy "usage_metrics_service_role"
  on public.usage_metrics
  for all
  using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role')
  with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');

-- ------------------------------------------------------------------
-- Done
-- ------------------------------------------------------------------
