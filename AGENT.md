# AGENT.md

## Project Overview

VocabFlow is a modern English vocabulary flashcard web application. It supports licensed or user-provided vocabulary datasets, images for every card, UK/US pronunciation, spaced repetition, guest mode, accounts, and progress synchronization.

## Primary Goals

1. Make vocabulary practice fast and enjoyable.
2. Ensure every vocabulary card has a relevant image or accessible fallback.
3. Provide UK and US pronunciation with a reliable fallback chain.
4. Support mobile-first learning and keyboard accessibility.
5. Keep vocabulary, image, and audio providers replaceable.
6. Protect user data and third-party API credentials.
7. Do not scrape or redistribute proprietary vocabulary datasets.

## Required Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- Supabase
- Zod
- Lucide Icons
- PWA support
- npm

Do not replace the core stack without explicit approval.

## Working Rules

Before editing:
1. Inspect the existing project structure.
2. Read relevant files before changing them.
3. Describe a short implementation plan.
4. Reuse existing components and utilities where appropriate.

While editing:
1. Make small, focused changes.
2. Keep UI, domain logic, and data access separated.
3. Prefer server components unless client-side interaction is required.
4. Validate external and user-provided data with Zod.
5. Never expose secret keys in client components.
6. Never hardcode production credentials.
7. Do not use `any` unless documented and unavoidable.
8. Do not leave incomplete TODO placeholders.
9. Do not silently remove existing functionality.
10. Do not scrape Oxford or other proprietary vocabulary sources.

After editing:
1. Run lint.
2. Run TypeScript checks.
3. Run relevant tests.
4. Run a production build when practical.
5. Report changed files, test results, and remaining limitations.
6. Keep ARCHITECTURE.md and PROJECT_STATUS.md up-to-date with any structural or architectural modifications.

## Copyright and Data Rules

- Do not scrape vocabulary from Oxford Learner's Dictionaries.
- Do not include a complete proprietary word list unless the user supplies a licensed dataset.
- Accept vocabulary through licensed CSV/JSON imports.
- Store source and license metadata when available.
- Do not use Oxford logos or imply official Oxford affiliation.
- Image providers must respect attribution and license requirements.
- Audio providers must be used according to their terms.

## Architecture

Use feature-oriented modules where practical:

```text
src/
  app/
  components/
    flashcards/
    vocabulary/
    audio/
    images/
    progress/
    ui/
  features/
    auth/
    import/
    learning/
    review/
    settings/
  lib/
    supabase/
    validation/
    srs/
    audio/
    images/
  types/
  hooks/
  config/
tests/
supabase/
  migrations/
```

## Data Requirements

A vocabulary record should support:
- Word
- Normalized word
- Part of speech
- CEFR level
- English definition
- Optional Thai translation
- Example sentence
- Optional example translation
- UK and US phonetics
- UK and US audio URLs
- Image URL and alt text
- Topic and tags
- Source and license metadata

All imported data must be validated before database insertion.

## Flashcard Requirements

Every flashcard must:
- Display an image or a meaningful fallback.
- Include meaningful alternative text.
- Display the word and pronunciation.
- Provide UK and US audio controls.
- Show definition, translation, example, CEFR level, and part of speech.
- Support touch, pointer, and keyboard controls.
- Respect `prefers-reduced-motion`.
- Avoid layout shifts while loading media.

## Image Provider Rules

Use this fallback order:
1. Database image URL
2. Configured image provider
3. Curated local image
4. Category-based fallback illustration

Image searches should use the definition, part of speech, and topic to reduce ambiguity. Third-party API requests containing secrets must be performed server-side.

## Audio Provider Rules

Use this fallback order:
1. Stored audio URL
2. Configured server-side TTS provider
3. Browser Web Speech API
4. Accessible unavailable-state message

Only one pronunciation should play at a time. Audio controls require loading, playing, and error states.

## Spaced Repetition

- Keep scheduling logic in pure, testable functions.
- Ratings are Again, Hard, Good, and Easy.
- Persist review time, next review time, interval, repetitions, ease factor, and lapses.
- Prevent duplicate review submissions.
- Support undo for the latest review.
- Keep algorithm parameters in a configuration module.

## Authentication and Security

- Use Supabase Row Level Security.
- Users can access only their own profile and learning progress.
- Guest data must remain local until the user explicitly signs in.
- Validate authorization on the server.
- Never trust role or admin flags sent by the browser.
- Sanitize and validate uploaded files.
- Limit file size and batch size.
- Never log tokens, passwords, secrets, or sensitive user information.

## Accessibility

- Use semantic HTML.
- Ensure visible keyboard focus.
- Provide accessible labels for icon-only buttons.
- Maintain adequate color contrast.
- Do not rely on color alone.
- Support screen readers.
- Support reduced motion.
- Images require appropriate alt text.
- Interactive cards must also have explicit controls.

## UI Guidelines

- Mobile first.
- Modern, calm, and uncluttered.
- Use consistent spacing, typography, and radius tokens.
- Support light and dark themes.
- Provide loading, empty, success, and error states.
- Avoid unnecessary animations.
- Use optimistic UI only when failure can be safely recovered.
- User-facing text should be ready for localization.

## Testing Requirements

Write tests for:
- Import parsing and validation
- Duplicate vocabulary handling
- Spaced-repetition calculations
- Flashcard interaction
- Audio fallback behavior
- Image fallback behavior
- Guest progress persistence
- Authentication and authorization boundaries

Core learning flows should have end-to-end coverage.

## Definition of Done

A task is complete only when:
- The requested behavior works.
- Types are valid.
- Relevant tests pass.
- Lint passes.
- No secrets are exposed.
- Loading and error states exist.
- Mobile and keyboard interactions work.
- Documentation is updated.
- No known broken images or unhandled media failures remain.

## Agent Response Format

At the end of each task, report:
1. Summary
2. Files changed
3. Tests and commands executed
4. Environment variables added
5. Known limitations
6. Recommended next step