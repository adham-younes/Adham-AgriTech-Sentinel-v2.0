-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  title_ar text,
  message text not null,
  message_ar text,
  type text not null check (type in ('alert', 'warning', 'info', 'success')),
  category text check (category in ('weather', 'irrigation', 'soil', 'crop', 'system', 'general')),
  is_read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- RLS Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
