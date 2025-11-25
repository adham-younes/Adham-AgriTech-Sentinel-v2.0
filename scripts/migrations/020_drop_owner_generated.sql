begin;

-- Ensure owner_id is a normal column (drop generated expression if it exists)
do $$
declare
  is_generated boolean := false;
begin
  select coalesce(attgenerated = 's', false)
  into is_generated
  from pg_attribute a
  join pg_class c on a.attrelid = c.oid
  join pg_namespace n on c.relnamespace = n.oid
  where n.nspname = 'public'
    and c.relname = 'farms'
    and a.attname = 'owner_id';

  if is_generated then
    execute 'alter table public.farms alter column owner_id drop expression';
  end if;
end;
$$;

commit;

