import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord, VocabularyFilterOptions } from "@/types/vocabulary";
import { Database } from "@/types/database.types";

type VocabRow = Database["public"]["Tables"]["vocabularies"]["Row"];

function mapRowToWord(row: VocabRow): VocabularyWord {
  return {
    id: row.id,
    word: row.word,
    normalizedWord: row.normalized_word,
    partOfSpeech: row.part_of_speech as VocabularyWord["partOfSpeech"],
    cefrLevel: row.cefr_level as VocabularyWord["cefrLevel"],
    definition: row.definition_en,
    definitionEn: row.definition_en,
    translation: row.definition_th,
    definitionTh: row.definition_th,
    example: row.example_sentence,
    exampleSentence: row.example_sentence,
    exampleTranslation: row.example_translation_th,
    exampleTranslationTh: row.example_translation_th,
    phoneticUk: row.phonetic_uk,
    phoneticUs: row.phonetic_us,
    audioUkUrl: row.audio_uk_url,
    audioUsUrl: row.audio_us_url,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    topic: row.topic,
    tags: row.tags,
    source: row.source_name,
    sourceName: row.source_name,
    license: row.source_license,
    sourceLicense: row.source_license,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch list of vocabularies with filtering support (Supabase with Local Fallback)
 */
export async function getVocabularies(
  options: VocabularyFilterOptions = {}
): Promise<{ data: VocabularyWord[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // Offline / Local guest fallback
    let items = [...INITIAL_VOCABULARY];
    if (options.search) {
      const q = options.search.toLowerCase();
      items = items.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q) ||
          w.translation?.toLowerCase().includes(q)
      );
    }
    if (options.cefrLevel && options.cefrLevel !== "ALL") {
      items = items.filter((w) => w.cefrLevel === options.cefrLevel);
    }
    if (options.partOfSpeech && options.partOfSpeech !== "ALL") {
      items = items.filter((w) => w.partOfSpeech === options.partOfSpeech);
    }
    return { data: items, error: null };
  }

  try {
    const supabase = createClient();
    let query = supabase.from("vocabularies").select("*");

    if (options.search) {
      query = query.ilike("word", `%${options.search}%`);
    }
    if (options.cefrLevel && options.cefrLevel !== "ALL") {
      query = query.eq("cefr_level", options.cefrLevel as "A1" | "A2" | "B1" | "B2");
    }
    if (options.partOfSpeech && options.partOfSpeech !== "ALL") {
      query = query.eq("part_of_speech", options.partOfSpeech);
    }
    if (options.topic) {
      query = query.eq("topic", options.topic);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      data: (data || []).map(mapRowToWord),
      error: null,
    };
  } catch (err) {
    return {
      data: INITIAL_VOCABULARY,
      error: err instanceof Error ? err.message : "Failed to load vocabularies",
    };
  }
}

/**
 * Fetch a single vocabulary by UUID
 */
export async function getVocabularyById(
  id: string
): Promise<{ data: VocabularyWord | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const found = INITIAL_VOCABULARY.find((v) => v.id === id) || null;
    return { data: found, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vocabularies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data: data ? mapRowToWord(data) : null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch vocabulary",
    };
  }
}

/**
 * Update vocabulary image, alt text, and attribution
 */
export async function updateVocabularyImage(
  id: string,
  imageDetails: {
    imageUrl: string;
    imageAlt?: string;
    sourceName?: string;
    sourceLicense?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // In local / guest mode, changes are tracked in LocalStorage
    return { success: true, error: null };
  }

  try {
    const supabase = createClient();
    type VocabUpdate = Database["public"]["Tables"]["vocabularies"]["Update"];
    const updatePayload: VocabUpdate = {
      image_url: imageDetails.imageUrl,
      updated_at: new Date().toISOString(),
    };

    if (imageDetails.imageAlt !== undefined) {
      updatePayload.image_alt = imageDetails.imageAlt;
    }
    if (imageDetails.sourceName !== undefined) {
      updatePayload.source_name = imageDetails.sourceName;
    }
    if (imageDetails.sourceLicense !== undefined) {
      updatePayload.source_license = imageDetails.sourceLicense;
    }

    const { error } = await supabase
      .from("vocabularies")
      .update(updatePayload)
      .eq("id", id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update vocabulary image in database",
    };
  }
}

/**
 * Delete a vocabulary word by ID
 */
export async function deleteVocabulary(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // In local / guest mode, changes are tracked in LocalStorage
    return { success: true, error: null };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("vocabularies")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete vocabulary from database",
    };
  }
}
