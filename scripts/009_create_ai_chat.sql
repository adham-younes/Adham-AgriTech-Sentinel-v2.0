-- Create AI chat history table
create table if not exists public.ai_chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  message text not null,
  response text not null,
  context jsonb, -- Additional context like field_id, crop_type, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ai_chat_history enable row level security;

-- RLS Policies
create policy "Users can view their own chat history"
  on public.ai_chat_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.ai_chat_history for insert
  with check (auth.uid() = user_id);

-- Create index for faster queries
create index ai_chat_user_id_idx on public.ai_chat_history (user_id, created_at desc);
