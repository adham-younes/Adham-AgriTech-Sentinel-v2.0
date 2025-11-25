begin;

update public.farms
set owner_id = user_id
where owner_id is distinct from user_id;

update public.farms
set user_id = owner_id
where user_id is null
  and owner_id is not null;

alter table public.farms
  alter column user_id set not null;

alter table public.farms
  alter column owner_id set not null;

create or replace function public.sync_farm_owner_columns()
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
    new.user_id := coalesce(jwt_uid, auth.uid(), new.owner_id);
  end if;

  if new.owner_id is null then
    new.owner_id := new.user_id;
  end if;

  new.owner_id := coalesce(new.owner_id, new.user_id);
  new.user_id := coalesce(new.user_id, new.owner_id);

  if new.user_id is null or new.owner_id is null then
    raise exception 'user_id is required for farms';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_farm_owner_id on public.farms;
drop trigger if exists ensure_farm_owner_from_auth on public.farms;

create trigger sync_farm_owner_columns
  before insert or update on public.farms
  for each row execute function public.sync_farm_owner_columns();

commit;
