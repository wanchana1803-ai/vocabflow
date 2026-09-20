import { z } from "zod";

export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const partsOfSpeech = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "phrase",
  "idiom",
  "determiner",
] as const;

export const srsRatings = ["again", "hard", "good", "easy"] as const;
export const progressStatuses = ["learning", "reviewing", "mastered"] as const;

// 1. Vocabulary Record Schema (DB & UI)
export const vocabularyWordSchema = z.object({
  id: z.string().optional(),
  word: z.string().min(1, "Word is required").trim(),
  normalizedWord: z.string().optional(),
  normalized_word: z.string().optional(),
  partOfSpeech: z.enum(partsOfSpeech, { message: "Valid part of speech is required" }).optional(),
  part_of_speech: z.string().optional(),
  cefrLevel: z.enum(cefrLevels, { message: "Valid CEFR level is required" }).optional(),
  cefr_level: z.string().optional(),
  definition: z.string().optional(),
  definitionEn: z.string().optional(),
  definition_en: z.string().optional(),
  translation: z.string().optional().nullable(),
  definitionTh: z.string().optional().nullable(),
  definition_th: z.string().optional().nullable(),
  example: z.string().optional(),
  exampleSentence: z.string().optional(),
  example_sentence: z.string().optional(),
  exampleTranslation: z.string().optional().nullable(),
  exampleTranslationTh: z.string().optional().nullable(),
  example_translation_th: z.string().optional().nullable(),
  phoneticUk: z.string().optional().nullable(),
  phonetic_uk: z.string().optional().nullable(),
  phoneticUs: z.string().optional().nullable(),
  phonetic_us: z.string().optional().nullable(),
  audioUkUrl: z.string().url("Invalid UK audio URL").optional().or(z.literal("")).nullable(),
  audio_uk_url: z.string().url("Invalid UK audio URL").optional().or(z.literal("")).nullable(),
  audioUsUrl: z.string().url("Invalid US audio URL").optional().or(z.literal("")).nullable(),
  audio_us_url: z.string().url("Invalid US audio URL").optional().or(z.literal("")).nullable(),
  imageUrl: z.string().optional().or(z.literal("")).nullable(),
  image_url: z.string().optional().or(z.literal("")).nullable(),
  imageAlt: z.string().optional().nullable(),
  image_alt: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().optional().nullable(),
  sourceName: z.string().optional().nullable(),
  source_name: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  sourceLicense: z.string().optional().nullable(),
  source_license: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  updatedAt: z.string().optional(),
  updated_at: z.string().optional(),
});

// 2. Strict Database Vocabulary Insert/Update Schema
export const databaseVocabularySchema = z.object({
  id: z.string().uuid().optional(),
  word: z.string().min(1, "Word is required").trim(),
  normalized_word: z.string().min(1).trim(),
  part_of_speech: z.string().min(1),
  cefr_level: z.enum(["A1", "A2", "B1", "B2"]),
  definition_en: z.string().min(3, "English definition is required"),
  definition_th: z.string().optional().nullable(),
  example_sentence: z.string().min(3, "Example sentence is required"),
  example_translation_th: z.string().optional().nullable(),
  phonetic_uk: z.string().optional().nullable(),
  phonetic_us: z.string().optional().nullable(),
  audio_uk_url: z.string().url().optional().or(z.literal("")).nullable(),
  audio_us_url: z.string().url().optional().or(z.literal("")).nullable(),
  image_url: z.string().min(1, "Image URL is required"),
  image_alt: z.string().min(1, "Image alternative text is required"),
  topic: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  source_name: z.string().optional().nullable(),
  source_license: z.string().optional().nullable(),
});

// 3. User Settings Schema
export const userSettingsSchema = z.object({
  user_id: z.string().uuid().optional(),
  preferred_accent: z.enum(["US", "UK"]).default("US"),
  daily_goal: z.number().int().min(1).max(100).default(10),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  sound_effects_enabled: z.boolean().default(true),
  auto_play_audio: z.boolean().default(false),
});

// 4. User Vocabulary Progress Schema
export const userVocabularyProgressSchema = z.object({
  user_id: z.string().uuid(),
  vocabulary_id: z.string().uuid(),
  status: z.enum(progressStatuses).default("learning"),
  is_learned: z.boolean().default(false),
  repetitions: z.number().int().min(0).default(0),
  interval: z.number().int().min(0).default(0),
  ease_factor: z.number().min(1.3).default(2.5),
  lapses: z.number().int().min(0).default(0),
  last_reviewed_at: z.string().datetime().optional().nullable(),
  next_review_at: z.string().datetime(),
});

// 5. Review History Log Schema
export const reviewHistorySchema = z.object({
  user_id: z.string().uuid(),
  vocabulary_id: z.string().uuid(),
  rating: z.enum(srsRatings),
  interval_before: z.number().int().min(0),
  interval_after: z.number().int().min(0),
  ease_factor_before: z.number(),
  ease_factor_after: z.number(),
  reviewed_at: z.string().datetime().optional(),
});

// 6. Learning Session Schema
export const learningSessionSchema = z.object({
  user_id: z.string().uuid(),
  session_type: z.enum(["learn", "review"]),
  words_studied_count: z.number().int().min(0),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().optional().nullable(),
});

// 7. Input Import Schema (Flexible for CSV and JSON user imports)
export const importWordSchema = z.object({
  word: z.string().min(1, "Word is required"),
  partOfSpeech: z.string().optional(),
  part_of_speech: z.string().optional(),
  cefrLevel: z.string().optional(),
  cefr_level: z.string().optional(),
  definition: z.string().optional(),
  definition_en: z.string().optional(),
  translation: z.string().optional().nullable(),
  definition_th: z.string().optional().nullable(),
  example: z.string().optional(),
  example_sentence: z.string().optional(),
  exampleTranslation: z.string().optional().nullable(),
  example_translation_th: z.string().optional().nullable(),
  phoneticUk: z.string().optional().nullable(),
  phonetic_uk: z.string().optional().nullable(),
  phoneticUs: z.string().optional().nullable(),
  phonetic_us: z.string().optional().nullable(),
  audioUkUrl: z.string().optional().nullable(),
  audio_uk_url: z.string().optional().nullable(),
  audioUsUrl: z.string().optional().nullable(),
  audio_us_url: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  image_alt: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.string().optional().nullable(),
  source_name: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  source_license: z.string().optional().nullable(),
});

export type ValidatedVocabularyWord = z.infer<typeof vocabularyWordSchema>;
export type DatabaseVocabularyInput = z.infer<typeof databaseVocabularySchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type UserProgressInput = z.infer<typeof userVocabularyProgressSchema>;
export type ReviewHistoryInput = z.infer<typeof reviewHistorySchema>;
export type LearningSessionInput = z.infer<typeof learningSessionSchema>;
