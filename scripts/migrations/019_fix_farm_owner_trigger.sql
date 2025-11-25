begin;

set search_path = public;

create or replace function public.sync_farm_owner_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_uid uuid;
  owner_generated boolean := false;
begin
  -- Detect if owner_id is a generated column (generated always as (user_id))
  begin
    select coalesce(attgenerated = 's', false)
    into owner_generated
    from pg_attribute a
    join pg_class c on a.attrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public'
      and c.relname = 'farms'
      and a.attname = 'owner_id';
  exception when others then
    owner_generated := false;
  end;

  -- Try to read user id from JWT settings or auth.uid()
  begin
    jwt_uid := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  exception when others then
    jwt_uid := null;
  end;

  if new.user_id is null then
    new.user_id := coalesce(jwt_uid, auth.uid(), new.owner_id);
  end if;

  -- Only touch owner_id if it's not generated
  if not owner_generated then
    if new.owner_id is null then
      new.owner_id := new.user_id;
    end if;
    new.owner_id := coalesce(new.owner_id, new.user_id);
  end if;

  new.user_id := coalesce(new.user_id, new.owner_id);

  if new.user_id is null then
    raise exception 'user_id is required for farms';
  end if;

  return new;
end;
$$;

-- Recreate trigger safely
drop trigger if exists sync_farm_owner_columns on public.farms;
create trigger sync_farm_owner_columns
  before insert or update on public.farms
  for each row execute function public.sync_farm_owner_columns();

commit;

