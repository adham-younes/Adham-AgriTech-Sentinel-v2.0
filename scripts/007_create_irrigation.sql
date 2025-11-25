-- Create irrigation events table
create table if not exists public.irrigation_events (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields(id) on delete cascade,
  scheduled_date timestamp with time zone not null,
  duration_minutes integer not null,
  water_amount decimal(8, 2), -- liters
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  actual_start_time timestamp with time zone,
  actual_end_time timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.irrigation_events enable row level security;

-- RLS Policies
create policy "Users can view irrigation events for their fields"
  on public.irrigation_events for select
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = irrigation_events.field_id
      and farms.owner_id = auth.uid()
    )
  );

create policy "Users can manage irrigation events for their fields"
  on public.irrigation_events for all
  using (
    exists (
      select 1 from public.fields
      join public.farms on farms.id = fields.farm_id
      where fields.id = irrigation_events.field_id
      and farms.owner_id = auth.uid()
    )
  );
