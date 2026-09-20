-- Supabase Schema Migration: 0001_initial_schema.sql
-- VocabFlow Vocabulary Flashcard Database Schema with RLS

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  preferred_accent text not null default 'US' check (preferred_accent in ('UK', 'US')),
  daily_goal_count integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Vocabulary Items Table (Public or User Contributed)
create table if not exists public.vocabulary_items (
  id uuid primary key default uuid_generate_v4(),
  word text not null,
  normalized_word text not null,
  part_of_speech text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  definition text not null,
  translation text,
  example text not null,
  example_translation text,
  phonetic_uk text,
  phonetic_us text,
  audio_uk_url text,
  audio_us_url text,
  image_url text,
  image_alt text,
  topic text,
  tags text[] default '{}',
  source text,
  license text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for vocabulary items
alter table public.vocabulary_items enable row level security;

create policy "Vocabulary items are viewable by everyone"
  on public.vocabulary_items for select
  using (true);

create policy "Authenticated users can insert vocabulary"
  on public.vocabulary_items for insert
  with check (auth.uid() = created_by or created_by is null);

-- Index for searching
create index if not exists idx_vocab_normalized on public.vocabulary_items (normalized_word);
create index if not exists idx_vocab_cefr on public.vocabulary_items (cefr_level);
create index if not exists idx_vocab_topic on public.vocabulary_items (topic);

-- 3. User Vocabulary Progress (SRS State per user per word)
create table if not exists public.user_vocabulary_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocabulary_items(id) on delete cascade,
  is_learned boolean not null default false,
  repetitions integer not null default 0,
  interval integer not null default 0, -- in days
  ease_factor double precision not null default 2.5,
  lapses integer not null default 0,
  last_review_date timestamp with time zone,
  next_review_date timestamp with time zone not null default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_word unique (user_id, word_id)
);

-- Enable RLS for user progress
alter table public.user_vocabulary_progress enable row level security;

create policy "Users can view own progress"
  on public.user_vocabulary_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_vocabulary_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_vocabulary_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.user_vocabulary_progress for delete
  using (auth.uid() = user_id);

-- Index for review queue queries
create index if not exists idx_progress_due on public.user_vocabulary_progress (user_id, next_review_date);
