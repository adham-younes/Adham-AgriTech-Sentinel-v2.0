-- Create marketplace products table
create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  name_ar text,
  description text,
  description_ar text,
  category text not null check (category in ('seeds', 'fertilizers', 'pesticides', 'equipment', 'tools', 'other')),
  price numeric not null,
  currency text default 'EGP',
  unit text not null, -- kg, liter, piece, etc.
  stock_quantity integer default 0,
  images jsonb, -- array of image URLs
  status text default 'active' check (status in ('active', 'inactive', 'sold_out')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create marketplace orders table
create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  quantity integer not null,
  total_price numeric not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  delivery_address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.marketplace_products enable row level security;
alter table public.marketplace_orders enable row level security;

-- RLS Policies for products
create policy "Anyone can view active products"
  on public.marketplace_products for select
  using (status = 'active' or seller_id = auth.uid());

create policy "Sellers can manage their own products"
  on public.marketplace_products for all
  using (auth.uid() = seller_id);

-- RLS Policies for orders
create policy "Users can view their own orders"
  on public.marketplace_orders for select
  using (auth.uid() = buyer_id or exists (
    select 1 from public.marketplace_products
    where marketplace_products.id = marketplace_orders.product_id
    and marketplace_products.seller_id = auth.uid()
  ));

create policy "Buyers can create orders"
  on public.marketplace_orders for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers and sellers can update orders"
  on public.marketplace_orders for update
  using (auth.uid() = buyer_id or exists (
    select 1 from public.marketplace_products
    where marketplace_products.id = marketplace_orders.product_id
    and marketplace_products.seller_id = auth.uid()
  ));

create trigger handle_marketplace_products_updated_at
  before update on public.marketplace_products
  for each row
  execute function public.handle_updated_at();

create trigger handle_marketplace_orders_updated_at
  before update on public.marketplace_orders
  for each row
  execute function public.handle_updated_at();
