-- Water Logs Table
-- Tracks individual water intake entries per user

create table if not exists public.water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount_ml integer not null check (amount_ml > 0),
  created_at timestamptz default now() not null
);

-- Index for fast daily queries by user
create index if not exists idx_water_logs_user_created
  on public.water_logs (user_id, created_at desc);

-- RLS: Enable Row Level Security
alter table public.water_logs enable row level security;

-- Policy: Users can only read their own water logs
create policy "Users can read own water logs"
  on public.water_logs for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own water logs
create policy "Users can insert own water logs"
  on public.water_logs for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own water logs
create policy "Users can delete own water logs"
  on public.water_logs for delete
  using (auth.uid() = user_id);
