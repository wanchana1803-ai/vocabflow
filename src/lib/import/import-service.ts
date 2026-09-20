import { VocabularyRecord, VocabularyWord } from "@/types/vocabulary";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import { getAutomaticImageForWord } from "@/lib/images/auto-matcher";

export type DuplicateStrategy = "skip" | "update" | "merge";

export interface ImportBatchOptions {
  duplicateStrategy: DuplicateStrategy;
  batchSize?: number;
  onProgress?: (progressPercentage: number, current: number, total: number) => void;
}

export interface ImportExecutionResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  updatedCount: number;
  lockedSkippedCount: number;
  errors: string[];
  finalVocabularyList: VocabularyWord[];
}

/**
 * Generates a unique key for duplicate detection: normalized_word + "::" + part_of_speech
 */
export function getDuplicateKey(word: string, partOfSpeech: string): string {
  return `${word.toLowerCase().trim()}::${partOfSpeech.toLowerCase().trim()}`;
}

/**
 * Merges an incoming record into an existing word record
 */
export function mergeVocabularyRecords(
  existing: VocabularyWord,
  incoming: VocabularyRecord
): VocabularyWord {
  // Combine tags without duplicates
  const existingTags = existing.tags || [];
  const incomingTags = incoming.tags || [];
  const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));

  // If incoming record has an explicit image URL, prioritize it over existing image
  let resolvedImageUrl =
    incoming.image_url && incoming.image_url.trim() !== ""
      ? incoming.image_url.trim()
      : existing.imageUrl;
  let resolvedImageAlt =
    incoming.image_alt && incoming.image_alt.trim() !== ""
      ? incoming.image_alt.trim()
      : existing.imageAlt;
  let resolvedSourceName =
    incoming.source_name && incoming.source_name.trim() !== ""
      ? incoming.source_name.trim()
      : existing.sourceName;
  let resolvedLicense =
    incoming.source_license && incoming.source_license.trim() !== ""
      ? incoming.source_license.trim()
      : existing.license;

  if (!resolvedImageUrl || resolvedImageUrl.trim() === "") {
    const autoImage = getAutomaticImageForWord(
      existing.word,
      existing.partOfSpeech,
      existing.topic,
      existing.definition || existing.definitionEn
    );
    resolvedImageUrl = autoImage.imageUrl;
    resolvedImageAlt = autoImage.imageAlt;
    if (!resolvedSourceName) resolvedSourceName = autoImage.sourceName;
    if (!resolvedLicense) resolvedLicense = autoImage.sourceLicense;
  }

  return {
    ...existing,
    definition: incoming.definition_en || existing.definition,
    definitionEn: incoming.definition_en || existing.definitionEn,
    translation: incoming.definition_th || existing.translation,
    definitionTh: incoming.definition_th || existing.definitionTh,
    example: incoming.example_sentence || existing.example,
    exampleSentence: incoming.example_sentence || existing.exampleSentence,
    exampleTranslation: incoming.example_translation_th || existing.exampleTranslation,
    exampleTranslationTh: incoming.example_translation_th || existing.exampleTranslationTh,
    phoneticUk: incoming.phonetic_uk || existing.phoneticUk,
    phoneticUs: incoming.phonetic_us || existing.phoneticUs,
    audioUkUrl: incoming.audio_uk_url || existing.audioUkUrl,
    audioUsUrl: incoming.audio_us_url || existing.audioUsUrl,
    imageUrl: resolvedImageUrl,
    imageAlt: resolvedImageAlt,
    topic: existing.topic || incoming.topic,
    tags: mergedTags,
    source: existing.source || resolvedSourceName,
    sourceName: resolvedSourceName,
    license: resolvedLicense,
    sourceLicense: resolvedLicense,
    isLocked: existing.isLocked ?? Boolean(incoming.is_locked),
    is_locked: existing.is_locked ?? Boolean(incoming.is_locked),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Converts DB VocabularyRecord to Frontend VocabularyWord
 */
export function recordToWord(rec: VocabularyRecord): VocabularyWord {
  let resolvedImageUrl = rec.image_url;
  let resolvedImageAlt = rec.image_alt;
  let resolvedSourceName = rec.source_name;
  let resolvedLicense = rec.source_license;

  if (!resolvedImageUrl || resolvedImageUrl.trim() === "") {
    const autoImage = getAutomaticImageForWord(
      rec.word,
      rec.part_of_speech,
      rec.topic,
      rec.definition_en
    );
    resolvedImageUrl = autoImage.imageUrl;
    resolvedImageAlt = autoImage.imageAlt;
    if (!resolvedSourceName) resolvedSourceName = autoImage.sourceName;
    if (!resolvedLicense) resolvedLicense = autoImage.sourceLicense;
  }

  return {
    id: rec.id,
    word: rec.word,
    normalizedWord: rec.normalized_word,
    partOfSpeech: rec.part_of_speech as VocabularyWord["partOfSpeech"],
    cefrLevel: rec.cefr_level as VocabularyWord["cefrLevel"],
    definition: rec.definition_en,
    definitionEn: rec.definition_en,
    translation: rec.definition_th,
    definitionTh: rec.definition_th,
    example: rec.example_sentence,
    exampleSentence: rec.example_sentence,
    exampleTranslation: rec.example_translation_th,
    exampleTranslationTh: rec.example_translation_th,
    phoneticUk: rec.phonetic_uk,
    phoneticUs: rec.phonetic_us,
    audioUkUrl: rec.audio_uk_url,
    audioUsUrl: rec.audio_us_url,
    imageUrl: resolvedImageUrl,
    imageAlt: resolvedImageAlt,
    topic: rec.topic,
    tags: rec.tags,
    source: resolvedSourceName,
    sourceName: resolvedSourceName,
    license: resolvedLicense,
    sourceLicense: resolvedLicense,
    isLocked: Boolean(rec.is_locked),
    is_locked: Boolean(rec.is_locked),
    createdAt: rec.created_at,
    updatedAt: rec.updated_at,
  };
}

/**
 * Executes batch vocabulary import with duplicate management and progress tracking.
 */
export async function executeBatchImport(
  incomingRecords: VocabularyRecord[],
  existingWords: VocabularyWord[],
  options: ImportBatchOptions
): Promise<ImportExecutionResult> {
  const { duplicateStrategy, batchSize = 25, onProgress } = options;

  // Auto-enrich incoming records with matching images if missing
  for (const rec of incomingRecords) {
    if (!rec.image_url || rec.image_url.trim() === "") {
      const autoImage = getAutomaticImageForWord(
        rec.word,
        rec.part_of_speech,
        rec.topic,
        rec.definition_en
      );
      rec.image_url = autoImage.imageUrl;
      rec.image_alt = autoImage.imageAlt;
      if (!rec.source_name) rec.source_name = autoImage.sourceName;
      if (!rec.source_license) rec.source_license = autoImage.sourceLicense;
    }
  }

  const result: ImportExecutionResult = {
    totalProcessed: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    updatedCount: 0,
    lockedSkippedCount: 0,
    errors: [],
    finalVocabularyList: [...existingWords],
  };

  const total = incomingRecords.length;
  if (total === 0) return result;

  // Build index of existing words
  const wordMap = new Map<string, number>();
  result.finalVocabularyList.forEach((w, idx) => {
    wordMap.set(getDuplicateKey(w.word, w.partOfSpeech), idx);
  });

  // Process in chunks
  for (let start = 0; start < total; start += batchSize) {
    const chunk = incomingRecords.slice(start, start + batchSize);

    for (const record of chunk) {
      result.totalProcessed += 1;
      const key = getDuplicateKey(record.word, record.part_of_speech);
      const existingIndex = wordMap.get(key);

      if (existingIndex !== undefined) {
        const existingWord = result.finalVocabularyList[existingIndex];
        const isExistingLocked = Boolean(existingWord.isLocked || existingWord.is_locked);

        // 🛡️ If existing word is LOCKED, PROTECT IT!
        if (isExistingLocked) {
          result.lockedSkippedCount += 1;
          result.skippedCount += 1;
          continue;
        }

        // Duplicate detected!
        if (duplicateStrategy === "skip") {
          result.skippedCount += 1;
        } else if (duplicateStrategy === "update") {
          const updatedWord = recordToWord(record);
          updatedWord.id = existingWord.id; // retain ID
          updatedWord.isLocked = existingWord.isLocked ?? Boolean(record.is_locked);
          updatedWord.is_locked = existingWord.is_locked ?? Boolean(record.is_locked);
          result.finalVocabularyList[existingIndex] = updatedWord;
          result.updatedCount += 1;
        } else if (duplicateStrategy === "merge") {
          const merged = mergeVocabularyRecords(existingWord, record);
          result.finalVocabularyList[existingIndex] = merged;
          result.updatedCount += 1;
        }
      } else {
        // New unique word
        const newWord = recordToWord(record);
        const newIndex = result.finalVocabularyList.length;
        result.finalVocabularyList.push(newWord);
        wordMap.set(key, newIndex);
        result.successCount += 1;
      }
    }

    // Trigger progress report callback
    const progress = Math.min(100, Math.round((Math.min(start + batchSize, total) / total) * 100));
    onProgress?.(progress, Math.min(start + batchSize, total), total);

    // Yield momentarily to allow UI animation
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // If Supabase is connected, attempt background synchronization of new/updated words
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const payload = incomingRecords.map((r) => ({
        word: r.word,
        normalized_word: r.normalized_word,
        part_of_speech: r.part_of_speech,
        cefr_level: r.cefr_level,
        definition_en: r.definition_en,
        definition_th: r.definition_th,
        example_sentence: r.example_sentence,
        example_translation_th: r.example_translation_th,
        phonetic_uk: r.phonetic_uk,
        phonetic_us: r.phonetic_us,
        audio_uk_url: r.audio_uk_url,
        audio_us_url: r.audio_us_url,
        image_url: r.image_url,
        image_alt: r.image_alt,
        topic: r.topic,
        tags: r.tags,
        source_name: r.source_name,
        source_license: r.source_license,
      }));

      await supabase.from("vocabularies").upsert(payload, {
        onConflict: "normalized_word,part_of_speech",
        ignoreDuplicates: duplicateStrategy === "skip",
      });
    } catch (err) {
      // Non-fatal: Local state remains updated
      result.errors.push(`Supabase sync warning: ${err instanceof Error ? err.message : "Cloud sync failed"}`);
    }
  }

  return result;
}
