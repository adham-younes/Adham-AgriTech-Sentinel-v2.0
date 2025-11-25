-- 016_create_tasks.sql
-- Tasks management schema and policies

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(100) not null,
  description text,
  due_date date,
  status varchar(20) not null default 'pending' check (status in ('pending','in_progress','completed')),
  recommendations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists tasks_field_idx on public.tasks(field_id);
create index if not exists tasks_user_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);

drop trigger if exists handle_tasks_updated_at on public.tasks;
create trigger handle_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

alter table public.tasks enable row level security;

drop policy if exists "Users can select their tasks" on public.tasks;
create policy "Users can select their tasks"
  on public.tasks
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = tasks.field_id
      and farms.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert their tasks" on public.tasks;
create policy "Users can insert their tasks"
  on public.tasks
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = field_id
      and farms.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update their tasks" on public.tasks;
create policy "Users can update their tasks"
  on public.tasks
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = tasks.field_id
      and farms.owner_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = field_id
      and farms.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their tasks" on public.tasks;
create policy "Users can delete their tasks"
  on public.tasks
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = tasks.field_id
      and farms.owner_id = auth.uid()
    )
  );
