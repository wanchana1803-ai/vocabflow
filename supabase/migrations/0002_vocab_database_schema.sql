-- ==============================================================================
-- Migration: 0002_vocab_database_schema.sql
-- Description: Complete Database Schema for VocabFlow Flashcard Application
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Helper function for automatically updating updated_at timestamp
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------------------
-- 2. Vocabularies Table
-- ------------------------------------------------------------------------------
create table if not exists public.vocabularies (
  id uuid primary key default uuid_generate_v4(),
  word text not null,
  normalized_word text not null,
  part_of_speech text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2')),
  definition_en text not null,
  definition_th text,
  example_sentence text not null,
  example_translation_th text,
  phonetic_uk text,
  phonetic_us text,
  audio_uk_url text,
  audio_us_url text,
  image_url text not null,
  image_alt text not null,
  topic text,
  tags text[] not null default '{}',
  source_name text,
  source_license text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Indexes for fast lookup and filtering
create index if not exists idx_vocabularies_word on public.vocabularies (word);
create index if not exists idx_vocabularies_normalized_word on public.vocabularies (normalized_word);
create index if not exists idx_vocabularies_cefr_level on public.vocabularies (cefr_level);
create index if not exists idx_vocabularies_topic on public.vocabularies (topic);

-- Trigger for updated_at
create trigger set_vocabularies_updated_at
  before update on public.vocabularies
  for each row execute function public.handle_updated_at();

-- RLS: Public vocabulary read access for all users
alter table public.vocabularies enable row level security;

create policy "Vocabularies are viewable by all users"
  on public.vocabularies for select
  using (true);

create policy "Admins or service role can manage vocabularies"
  on public.vocabularies for all
  using (auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- 3. Profiles Table
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. User Settings Table
-- ------------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_accent text not null default 'US' check (preferred_accent in ('US', 'UK')),
  daily_goal integer not null default 10 check (daily_goal > 0),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  sound_effects_enabled boolean not null default true,
  auto_play_audio boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.handle_updated_at();

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. User Vocabulary Progress Table (SRS State)
-- ------------------------------------------------------------------------------
create table if not exists public.user_vocabulary_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabularies(id) on delete cascade,
  status text not null default 'learning' check (status in ('learning', 'reviewing', 'mastered')),
  is_learned boolean not null default false,
  repetitions integer not null default 0,
  interval integer not null default 0, -- in days
  ease_factor double precision not null default 2.5,
  lapses integer not null default 0,
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone not null default timezone('utc'::text, now()),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint uq_user_vocabulary unique (user_id, vocabulary_id)
);

create index if not exists idx_user_vocab_progress_due on public.user_vocabulary_progress (user_id, next_review_at);
create index if not exists idx_user_vocab_progress_status on public.user_vocabulary_progress (user_id, status);

create trigger set_user_vocabulary_progress_updated_at
  before update on public.user_vocabulary_progress
  for each row execute function public.handle_updated_at();

alter table public.user_vocabulary_progress enable row level security;

create policy "Users can view own vocabulary progress"
  on public.user_vocabulary_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own vocabulary progress"
  on public.user_vocabulary_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vocabulary progress"
  on public.user_vocabulary_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own vocabulary progress"
  on public.user_vocabulary_progress for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Review History Table (Individual SRS Review Logs)
-- ------------------------------------------------------------------------------
create table if not exists public.review_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabularies(id) on delete cascade,
  rating text not null check (rating in ('again', 'hard', 'good', 'easy')),
  interval_before integer not null default 0,
  interval_after integer not null default 0,
  ease_factor_before double precision not null default 2.5,
  ease_factor_after double precision not null default 2.5,
  reviewed_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_review_history_user_date on public.review_history (user_id, reviewed_at desc);

alter table public.review_history enable row level security;

create policy "Users can view own review history"
  on public.review_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own review history"
  on public.review_history for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. Learning Sessions Table
-- ------------------------------------------------------------------------------
create table if not exists public.learning_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_type text not null check (session_type in ('learn', 'review')),
  words_studied_count integer not null default 0,
  duration_seconds integer default 0,
  started_at timestamp with time zone not null default timezone('utc'::text, now()),
  ended_at timestamp with time zone
);

create index if not exists idx_learning_sessions_user_date on public.learning_sessions (user_id, started_at desc);

alter table public.learning_sessions enable row level security;

create policy "Users can view own learning sessions"
  on public.learning_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own learning sessions"
  on public.learning_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own learning sessions"
  on public.learning_sessions for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. Auto-provision profile and settings on user signup
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute upon user creation in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
