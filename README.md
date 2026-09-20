# VocabFlow 🌿

**VocabFlow** is a modern, mobile-first English vocabulary flashcard web application designed for daily study. It combines an SM-2 spaced repetition system (SRS), natural audio pronunciation with UK/US accents, visual memory anchors, and offline PWA capability.

---

## ✨ Features

- **Mobile First & Responsive**: Optimized for thumb-friendly mobile learning with smooth 3D flip flashcards and an intuitive bottom navigation bar.
- **Calm, Eye-Friendly Aesthetics**: Designed with soothing emerald/sage tones and full support for Light and Dark modes (`next-themes`).
- **Spaced Repetition System (SRS)**: Built on the SM-2 algorithm with 4 recall rating buttons: `Again`, `Hard`, `Good`, and `Easy`, plus review undo support.
- **UK & US Pronunciation**: Dual accent audio controls with intelligent fallback: Stored Audio URL → Web Speech API synthesis → accessible notification.
- **Visual Memory Anchors**: Images with zero-layout-shift skeleton loaders and topic-based fallback illustrations.
- **6 Core Views**:
  - `Home (/)`: Daily goal progress, streaks, quick review CTA, and featured words.
  - `Learn (/learn)`: Step-by-step introduction of new vocabulary with 3D flip interaction.
  - `Review (/review)`: Active recall SRS deck with rating buttons and session completion metrics.
  - `Vocabulary (/vocabulary)`: Searchable, filterable word library with CEFR filters and CSV/JSON importer.
  - `Progress (/progress)`: Analytics dashboard with mastery percentages, CEFR distribution, and recent review logs.
  - `Settings (/settings)`: Appearance toggle, accent preferences, daily goal targets, and cloud sync status.
- **Data Import Pipeline**: Import personal or licensed datasets via CSV or JSON with instant Zod schema validation.
- **PWA Ready**: Web App Manifest (`manifest.json`), touch icons, and standalone display support.
- **Keyboard Navigation**:
  - `Space` / `Enter`: Flip card front/back
  - `1`, `2`, `3`, `4`: Rate recall (`Again`, `Hard`, `Good`, `Easy`)
  - `←` / `→`: Previous / Next card

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15+ (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 & [shadcn/ui](https://ui.shadcn.com/) patterns
- **State & Sync**: LocalStorage (Guest Mode) + [Supabase](https://supabase.com/) (Auth & RLS database)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Package Manager**: `npm`

---

## 📁 Architecture & Folder Structure

```text
c:/Users/wanch/Desktop/AI/Flash Card/
├── .env.example                         # Environment variables template
├── README.md                            # Documentation
├── package.json                         # Dependencies & scripts
├── public/
│   ├── manifest.json                    # PWA Web App Manifest
│   ├── icons/                           # PWA app icons (192x192, 512x512)
│   └── samples/                         # Sample valid CSV and JSON vocab import templates
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql      # Database DDL with Row Level Security (RLS)
├── src/
│   ├── app/                             # Next.js App Router
│   │   ├── layout.tsx                   # Root layout with ThemeProvider & Navigation
│   │   ├── page.tsx                     # Home Dashboard
│   │   ├── learn/                       # Learn Mode
│   │   ├── review/                      # SRS Review Mode
│   │   ├── vocabulary/                  # Vocabulary Library & Import
│   │   ├── progress/                    # Learning Analytics
│   │   ├── settings/                    # User & App Settings
│   │   ├── error.tsx                    # Error boundary
│   │   └── not-found.tsx                # 404 page
│   ├── components/
│   │   ├── ui/                          # Reusable UI primitives (Button, Card, Badge, Progress, Input)
│   │   ├── navigation/                  # AppHeader and MobileNav
│   │   ├── flashcards/                  # 3D interactive FlashcardCard
│   │   ├── audio/                       # PronunciationButton (UK/US)
│   │   ├── images/                      # VocabImage with category fallback
│   │   └── feedback/                    # LoadingSkeleton, EmptyState, ErrorState
│   ├── features/
│   │   └── import/                      # CSV and JSON parsers and validators
│   ├── lib/
│   │   ├── supabase/                    # Supabase browser & server clients
│   │   ├── validation/                  # Zod schemas for vocabulary & import
│   │   ├── srs/                         # Pure SM-2 spaced repetition calculation engine
│   │   ├── audio/                       # Speech synthesis & audio controller
│   │   └── images/                      # Fallback styles and resolver
│   ├── types/                           # TypeScript interfaces
│   └── hooks/                           # useLocalStorage, useKeyboardShortcuts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.18+ or v20+
- `npm`

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration (Optional)
Copy the environment template:
```bash
cp .env.example .env.local
```
*Note: VocabFlow works completely offline out-of-the-box in local guest mode without requiring Supabase keys.*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quality Verification

Run the automated validation suite:

```bash
# Type check TypeScript in strict mode
npm run typecheck

# Lint check code style and best practices
npm run lint

# Build production bundle
npm run build
```

---

## 📜 Copyright and Dataset Policy

VocabFlow respects intellectual property:
- **No Scraping**: We strictly do not scrape, bundle, or redistribute proprietary vocabulary lists (such as Oxford 3000™).
- **Open / User Datasets**: VocabFlow comes preloaded with an open sample dataset (CC-BY-4.0) and empowers users to import their own licensed study lists via CSV or JSON.
