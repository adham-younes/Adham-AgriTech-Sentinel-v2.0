-- ------------------------------------------------------------------
-- Service health snapshots
-- ------------------------------------------------------------------
create table if not exists public.service_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,
  service_label text,
  status text not null,
  status_code integer,
  latency_ms integer,
  details text,
  overall_status text not null,
  checked_at timestamptz not null default timezone('utc'::text, now()),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists service_health_snapshots_service_idx
  on public.service_health_snapshots(service_id, checked_at desc);

alter table public.service_health_snapshots enable row level security;

drop policy if exists "service_health_snapshots_service_role" on public.service_health_snapshots;
create policy "service_health_snapshots_service_role"
  on public.service_health_snapshots
  for all
  using (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role')
  with check (coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role');
