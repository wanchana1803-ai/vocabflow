# 📦 Supabase Database Setup Guide (VocabFlow)

This directory contains the database migration scripts and seed data for the VocabFlow application.

---

## 🗄️ Database Schema Summary

The database uses PostgreSQL with Supabase Row Level Security (RLS):

1. **`vocabularies`**: Central dictionary table containing CEFR levels (A1-B2), definitions in EN & TH, example sentences, phonetics, audio URLs, and visual anchors.
2. **`profiles`**: User account profile information linked to `auth.users(id)`.
3. **`user_settings`**: User preferences (preferred accent US/UK, daily study goal, theme, audio settings).
4. **`user_vocabulary_progress`**: SM-2 Spaced Repetition System (SRS) state per user per word (`interval`, `repetitions`, `ease_factor`, `lapses`, `next_review_at`).
5. **`review_history`**: Immutable log of each user flashcard rating (`again`, `hard`, `good`, `easy`) with intervals before/after.
6. **`learning_sessions`**: Metrics on study sessions (time spent, card count).

---

## 🚀 How to Apply Migrations to Supabase

### Method 1: Using Supabase Web Dashboard (Easiest)

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Open the **SQL Editor** tab from the left sidebar.
4. Click **New Query**, then copy & paste the contents of:
   - [`migrations/0002_vocab_database_schema.sql`](./migrations/0002_vocab_database_schema.sql)
5. Click **Run** to create all tables, indexes, triggers, and RLS policies.
6. Open another query, copy & paste the contents of [`seed.sql`](./seed.sql), and click **Run** to insert the 5 initial demo words.

---

### Method 2: Using Supabase CLI (Local Development)

```bash
# 1. Initialize and link your project (if not linked)
npx supabase link --project-ref your-project-id

# 2. Push migrations to the remote database
npx supabase db push

# 3. Seed data
npx supabase db reset # (or execute seed.sql)
```

---

## 🔑 Environment Variables

Add your project credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
