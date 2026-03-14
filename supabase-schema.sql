-- Supabase Schema for Health-App

-- Enable Row Level Security
alter table if exists public.profiles enable row level security;
alter table if exists public.daily_logs enable row level security;
alter table if exists public.saved_meals enable row level security;

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  theme text,
  avatar text,
  height numeric,
  weight numeric,
  age numeric,
  gender text,
  activity_level text,
  goals jsonb default '[]'::jsonb,
  dietary_preferences jsonb default '[]'::jsonb,
  medical_conditions jsonb default '[]'::jsonb,
  daily_targets jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Logs table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date text not null, -- YYYY-MM-DD
  meals jsonb default '[]'::jsonb,
  water_intake numeric default 0,
  aggregations jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

-- Saved Meals table
create table public.saved_meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  ingredients jsonb default '[]'::jsonb,
  nutritional_info jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies

-- Profiles: users can read and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Daily Logs: users can CRUD their own logs
create policy "Users can view own daily logs" on public.daily_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own daily logs" on public.daily_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own daily logs" on public.daily_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete own daily logs" on public.daily_logs
  for delete using (auth.uid() = user_id);

-- Saved Meals: users can CRUD their own saved meals
create policy "Users can view own saved meals" on public.saved_meals
  for select using (auth.uid() = user_id);

create policy "Users can insert own saved meals" on public.saved_meals
  for insert with check (auth.uid() = user_id);

create policy "Users can update own saved meals" on public.saved_meals
  for update using (auth.uid() = user_id);

create policy "Users can delete own saved meals" on public.saved_meals
  for delete using (auth.uid() = user_id);
