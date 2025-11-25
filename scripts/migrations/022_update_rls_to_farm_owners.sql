begin;

set search_path = public;

-- ---------------------------------------------------------------
-- Align RLS with farm_owners bridge to avoid owner_id coupling
-- ---------------------------------------------------------------

-- Fields: keep owner CRUD by user_id, but update view policy to allow members
drop policy if exists "fields_farm_owner_view" on public.fields;
create policy "fields_farm_owner_view"
  on public.fields
  for select
  using (
    exists (
      select 1
      from public.farm_owners fo
      join public.farms f on f.id = public.fields.farm_id
      where fo.farm_id = f.id
        and fo.user_id = auth.uid()
    )
  );

-- Tasks: replace farms.owner_id checks with farm_owners membership
drop policy if exists "Users can select their tasks" on public.tasks;
create policy "Users can select their tasks"
  on public.tasks
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = public.tasks.field_id
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
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = field_id
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
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = public.tasks.field_id
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = field_id
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
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = public.tasks.field_id
    )
  );

commit;

