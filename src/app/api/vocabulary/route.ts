import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { Database } from "@/types/database.types";

export const dynamic = "force-dynamic";

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
 * GET /api/vocabulary
 * Public endpoint to fetch the global vocabulary list from Supabase.
 * If Supabase is unconfigured or table is empty, gracefully falls back to INITIAL_VOCABULARY.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      data: INITIAL_VOCABULARY,
      source: "initial_fallback",
    });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const cefr = searchParams.get("cefr");
    const limit = searchParams.get("limit");

    let query = supabase
      .from("vocabularies")
      .select("*")
      .order("created_at", { ascending: false });

    if (cefr && cefr !== "ALL") {
      query = query.eq("cefr_level", cefr as "A1" | "A2" | "B1" | "B2");
    }

    if (search) {
      query = query.or(
        `word.ilike.%${search}%,definition_en.ilike.%${search}%,definition_th.ilike.%${search}%`
      );
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        query = query.limit(parsedLimit);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase vocabulary query failed, using fallback:", error.message);
      return NextResponse.json({
        data: INITIAL_VOCABULARY,
        source: "fallback_error",
        error: error.message,
      });
    }

    // If database table is empty, provide initial words so UI remains functional
    if (!data || data.length === 0) {
      return NextResponse.json({
        data: INITIAL_VOCABULARY,
        source: "initial_empty_db",
      });
    }

    const words = data.map(mapRowToWord);

    return NextResponse.json({
      data: words,
      source: "supabase",
    });
  } catch (err) {
    console.error("Error in GET /api/vocabulary:", err);
    return NextResponse.json({
      data: INITIAL_VOCABULARY,
      source: "fallback_exception",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
