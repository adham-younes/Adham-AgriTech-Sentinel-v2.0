-- Create marketplace items table (optional feature)
create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  title_ar text,
  description text not null,
  description_ar text,
  category text not null check (category in ('seeds', 'fertilizers', 'equipment', 'produce', 'services')),
  price decimal(10, 2) not null,
  currency text default 'EGP',
  quantity integer,
  unit text, -- kg, ton, piece, etc.
  images jsonb, -- Array of image URLs
  location text,
  status text default 'active' check (status in ('active', 'sold', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.marketplace_items enable row level security;

-- RLS Policies
create policy "Anyone can view active marketplace items"
  on public.marketplace_items for select
  using (status = 'active' or seller_id = auth.uid());

create policy "Users can create their own marketplace items"
  on public.marketplace_items for insert
  with check (auth.uid() = seller_id);

create policy "Users can update their own marketplace items"
  on public.marketplace_items for update
  using (auth.uid() = seller_id);

create policy "Users can delete their own marketplace items"
  on public.marketplace_items for delete
  using (auth.uid() = seller_id);
