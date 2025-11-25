begin;

set search_path = public;

-- Ensure PostGIS is available for geometry validation.
create extension if not exists postgis with schema public;

-- Helper function to validate GeoJSON polygons before persisting.
create or replace function public.is_polygon_geojson_valid(geojson jsonb)
returns boolean
stable
language plpgsql
as $$
declare
  geom geometry;
begin
  if geojson is null then
    return false;
  end if;

  geom := ST_SetSRID(ST_GeomFromGeoJSON(geojson::text), 4326);
  if geom is null then
    return false;
  end if;

  return ST_IsValid(geom);
exception
  when others then
    -- If parsing fails, treat the geometry as invalid rather than leaking database errors.
    return false;
end;
$$;

comment on function public.is_polygon_geojson_valid(jsonb)
  is 'Validates a GeoJSON polygon using ST_IsValid (SRID 4326). Returns false for invalid geometries.';

commit;

