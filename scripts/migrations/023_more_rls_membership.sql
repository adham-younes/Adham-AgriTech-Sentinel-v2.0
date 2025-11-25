begin;

set search_path = public;

-- Field satellite snapshots -> use farm_owners membership
drop policy if exists "field_snapshots_view" on public.field_satellite_snapshots;
create policy "field_snapshots_view"
  on public.field_satellite_snapshots
  for select
  using (
    exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = public.field_satellite_snapshots.field_id
    )
  );

-- Soil analysis view by farm membership
drop policy if exists "soil_analysis_field_owner_view" on public.soil_analysis;
create policy "soil_analysis_field_owner_view"
  on public.soil_analysis
  for select
  using (
    exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where public.soil_analysis.field_id = fld.id
    )
  );

-- Crop monitoring view by farm membership
drop policy if exists "crop_monitoring_field_owner_view" on public.crop_monitoring;
create policy "crop_monitoring_field_owner_view"
  on public.crop_monitoring
  for select
  using (
    exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where public.crop_monitoring.field_id = fld.id
    )
  );

-- Irrigation systems policies (view/manage) by farm membership
drop policy if exists "Users can view irrigation systems of their fields" on public.irrigation_systems;
create policy "Users can view irrigation systems of their fields"
  on public.irrigation_systems for select
  using (
    exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = public.irrigation_systems.field_id
    )
  );

drop policy if exists "Users can manage irrigation systems of their fields" on public.irrigation_systems;
create policy "Users can manage irrigation systems of their fields"
  on public.irrigation_systems for all
  using (
    exists (
      select 1
      from public.fields fld
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where fld.id = public.irrigation_systems.field_id
    )
  );

-- Irrigation schedules policies (view/manage) by farm membership
drop policy if exists "Users can view irrigation schedules" on public.irrigation_schedules;
create policy "Users can view irrigation schedules"
  on public.irrigation_schedules for select
  using (
    exists (
      select 1
      from public.irrigation_systems isy
      join public.fields fld on fld.id = isy.field_id
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where isy.id = public.irrigation_schedules.irrigation_system_id
    )
  );

drop policy if exists "Users can manage irrigation schedules" on public.irrigation_schedules;
create policy "Users can manage irrigation schedules"
  on public.irrigation_schedules for all
  using (
    exists (
      select 1
      from public.irrigation_systems isy
      join public.fields fld on fld.id = isy.field_id
      join public.farms fa on fa.id = fld.farm_id
      join public.farm_owners fo on fo.farm_id = fa.id and fo.user_id = auth.uid()
      where isy.id = public.irrigation_schedules.irrigation_system_id
    )
  );

-- Weather data view policy by farm membership
drop policy if exists "Users can view weather data for their farms" on public.weather_data;
create policy "Users can view weather data for their farms"
  on public.weather_data for select
  using (
    exists (
      select 1 from public.farm_owners fo
      join public.farms fa on fa.id = public.weather_data.farm_id
      where fo.farm_id = fa.id and fo.user_id = auth.uid()
    )
  );

commit;

