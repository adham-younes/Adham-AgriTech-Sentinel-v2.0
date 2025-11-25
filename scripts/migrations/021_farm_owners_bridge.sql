begin;

set search_path = public;

-- ------------------------------------------------------------------
-- farm_owners bridge table
-- ------------------------------------------------------------------
create table if not exists public.farm_owners (
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner',
  added_at timestamptz not null default timezone('utc'::text, now()),
  constraint farm_owners_pkey primary key (farm_id, user_id, role)
);

-- Ensure legacy tables pick up new columns/defaults
alter table public.farm_owners
  add column if not exists added_at timestamptz not null default timezone('utc'::text, now());

alter table public.farm_owners
  alter column role set default 'owner';

create unique index if not exists farm_owners_unique_key on public.farm_owners(farm_id, user_id, role);
create index if not exists farm_owners_user_idx on public.farm_owners(user_id);
create index if not exists farm_owners_role_idx on public.farm_owners(role);
create unique index if not exists farm_owners_unique_owner on public.farm_owners(farm_id) where role = 'owner';

-- Backfill bridge rows for existing farms
insert into public.farm_owners (farm_id, user_id, role, added_at)
select f.id, coalesce(f.owner_id, f.user_id), 'owner', timezone('utc'::text, now())
from public.farms f
where coalesce(f.owner_id, f.user_id) is not null
on conflict (farm_id, user_id, role) do nothing;

-- ------------------------------------------------------------------
-- Trigger to keep bridge in sync with farms
-- ------------------------------------------------------------------
create or replace function public.sync_farm_owners_bridge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
begin
  target_user := coalesce(new.owner_id, new.user_id);

  if target_user is null then
    return new;
  end if;

  delete from public.farm_owners
  where farm_id = new.id
    and role = 'owner'
    and user_id is distinct from target_user;

  insert into public.farm_owners (farm_id, user_id, role, added_at)
  values (new.id, target_user, 'owner', timezone('utc'::text, now()))
  on conflict (farm_id, user_id, role)
  do update set added_at = excluded.added_at;

  return new;
end;
$$;

drop trigger if exists sync_farm_owners_bridge on public.farms;
create trigger sync_farm_owners_bridge
  after insert or update on public.farms
  for each row execute function public.sync_farm_owners_bridge();

-- ------------------------------------------------------------------
-- Row level security
-- ------------------------------------------------------------------
alter table public.farm_owners enable row level security;

drop policy if exists "farm_owners_self_view" on public.farm_owners;
create policy "farm_owners_self_view"
  on public.farm_owners
  for select
  using (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Update farms policies to rely on farm_owners bridge
-- ------------------------------------------------------------------
drop policy if exists "farms_owner_crud" on public.farms;
create policy "farms_owner_crud"
  on public.farms
  for all
  using (
    exists (
      select 1
      from public.farm_owners fo
      where fo.farm_id = public.farms.id
        and fo.user_id = auth.uid()
        and fo.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from public.farm_owners fo
      where fo.farm_id = public.farms.id
        and fo.user_id = auth.uid()
        and fo.role = 'owner'
    )
  );

drop policy if exists "farms_member_view" on public.farms;
create policy "farms_member_view"
  on public.farms
  for select
  using (
    exists (
      select 1
      from public.farm_owners fo
      where fo.farm_id = public.farms.id
        and fo.user_id = auth.uid()
    )
  );

commit;
