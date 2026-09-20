export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "phrase"
  | "idiom"
  | "determiner";

/**
 * Standard Vocabulary Entity matching the Database Schema
 */
export interface VocabularyRecord {
  id: string;
  word: string;
  normalized_word: string;
  part_of_speech: string;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  definition_en: string;
  definition_th?: string | null;
  example_sentence: string;
  example_translation_th?: string | null;
  phonetic_uk?: string | null;
  phonetic_us?: string | null;
  audio_uk_url?: string | null;
  audio_us_url?: string | null;
  image_url: string;
  image_alt: string;
  topic?: string | null;
  tags: string[];
  source_name?: string | null;
  source_license?: string | null;
  is_locked?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Frontend UI representation (with camelCase aliases for component compatibility)
 */
export interface VocabularyWord {
  id: string;
  word: string;
  normalizedWord?: string;
  partOfSpeech: PartOfSpeech;
  cefrLevel: CEFRLevel;
  definition: string;
  definitionEn?: string;
  translation?: string | null;
  definitionTh?: string | null;
  example: string;
  exampleSentence?: string;
  exampleTranslation?: string | null;
  exampleTranslationTh?: string | null;
  phoneticUk?: string | null;
  phoneticUs?: string | null;
  audioUkUrl?: string | null;
  audioUsUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  topic?: string | null;
  tags?: string[];
  source?: string | null;
  sourceName?: string | null;
  license?: string | null;
  sourceLicense?: string | null;
  isLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // DB snake_case aliases
  part_of_speech?: string;
  cefr_level?: string;
  definition_en?: string;
  definition_th?: string | null;
  example_sentence?: string;
  example_translation_th?: string | null;
  phonetic_uk?: string | null;
  phonetic_us?: string | null;
  audio_uk_url?: string | null;
  audio_us_url?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  source_name?: string | null;
  source_license?: string | null;
  is_locked?: boolean;
}

export interface VocabularyFilterOptions {
  search?: string;
  cefrLevel?: CEFRLevel | "ALL";
  partOfSpeech?: PartOfSpeech | "ALL";
  topic?: string;
  limit?: number;
  offset?: number;
}
