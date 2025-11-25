-- Create forum posts table
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  title_ar text,
  content text not null,
  content_ar text,
  category text check (category in ('general', 'crops', 'soil', 'irrigation', 'pests', 'equipment', 'market')),
  images jsonb, -- array of image URLs
  likes_count integer default 0,
  comments_count integer default 0,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create forum comments table
create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  content_ar text,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create forum likes table
create table if not exists public.forum_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id),
  unique(user_id, comment_id),
  check ((post_id is not null and comment_id is null) or (post_id is null and comment_id is not null))
);

-- Enable RLS
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_likes enable row level security;

-- RLS Policies for posts
create policy "Anyone can view posts"
  on public.forum_posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.forum_posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own posts"
  on public.forum_posts for update
  using (auth.uid() = author_id);

create policy "Authors and managers can delete posts"
  on public.forum_posts for delete
  using (auth.uid() = author_id or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'manager'
  ));

-- RLS Policies for comments
create policy "Anyone can view comments"
  on public.forum_comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.forum_comments for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own comments"
  on public.forum_comments for update
  using (auth.uid() = author_id);

create policy "Authors and managers can delete comments"
  on public.forum_comments for delete
  using (auth.uid() = author_id or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'manager'
  ));

-- RLS Policies for likes
create policy "Anyone can view likes"
  on public.forum_likes for select
  using (true);

create policy "Users can manage their own likes"
  on public.forum_likes for all
  using (auth.uid() = user_id);

-- Triggers for updating counts
create or replace function public.update_post_comments_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.forum_posts
    set comments_count = comments_count + 1
    where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.forum_posts
    set comments_count = comments_count - 1
    where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create trigger update_post_comments_count_trigger
  after insert or delete on public.forum_comments
  for each row
  execute function public.update_post_comments_count();

create or replace function public.update_likes_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.post_id is not null then
      update public.forum_posts
      set likes_count = likes_count + 1
      where id = NEW.post_id;
    elsif NEW.comment_id is not null then
      update public.forum_comments
      set likes_count = likes_count + 1
      where id = NEW.comment_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.post_id is not null then
      update public.forum_posts
      set likes_count = likes_count - 1
      where id = OLD.post_id;
    elsif OLD.comment_id is not null then
      update public.forum_comments
      set likes_count = likes_count - 1
      where id = OLD.comment_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger update_likes_count_trigger
  after insert or delete on public.forum_likes
  for each row
  execute function public.update_likes_count();

create trigger handle_forum_posts_updated_at
  before update on public.forum_posts
  for each row
  execute function public.handle_updated_at();

create trigger handle_forum_comments_updated_at
  before update on public.forum_comments
  for each row
  execute function public.handle_updated_at();
