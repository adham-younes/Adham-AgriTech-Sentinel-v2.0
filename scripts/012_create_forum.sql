-- Create forum posts table (optional feature)
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  title_ar text,
  content text not null,
  content_ar text,
  category text not null check (category in ('general', 'crops', 'soil', 'irrigation', 'pests', 'equipment', 'market')),
  tags text[],
  views integer default 0,
  likes integer default 0,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create forum comments table
create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  content_ar text,
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;

-- RLS Policies for posts
create policy "Anyone can view forum posts"
  on public.forum_posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.forum_posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on public.forum_posts for update
  using (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.forum_posts for delete
  using (auth.uid() = author_id);

-- RLS Policies for comments
create policy "Anyone can view forum comments"
  on public.forum_comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.forum_comments for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own comments"
  on public.forum_comments for update
  using (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on public.forum_comments for delete
  using (auth.uid() = author_id);

-- Create indexes
create index forum_posts_category_idx on public.forum_posts (category, created_at desc);
create index forum_comments_post_id_idx on public.forum_comments (post_id, created_at);
