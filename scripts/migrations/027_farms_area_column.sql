begin;

set search_path = public;

-- Guarantee farms.area exists as double precision with non-negative constraint.
alter table public.farms
  add column if not exists area double precision;

-- Backfill null values before enforcing NOT NULL.
update public.farms
set area = 0
where area is null;

alter table public.farms
  alter column area type double precision using area::double precision,
  alter column area set not null,
  alter column area set default 0;

alter table public.farms
  drop constraint if exists farms_area_positive;

alter table public.farms
  add constraint farms_area_positive check (area >= 0);

comment on column public.farms.area is
  'Farm area stored in hectares (convert from feddan/acres on input). Must be zero or positive.';

commit;

