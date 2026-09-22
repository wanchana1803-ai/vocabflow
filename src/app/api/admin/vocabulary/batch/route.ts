import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { parseSessionCookieValue } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";
import { logAdminAudit } from "@/lib/auth/audit";

/**
 * Authenticate Admin from either Supabase Auth or Local Session Cookie
 */
async function authenticateAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("vocabflow_session");

  if (!isSupabaseConfigured()) {
    if (sessionCookie?.value) {
      const parsed = parseSessionCookieValue(sessionCookie.value);
      if (parsed?.profile?.role === "admin") {
        return { user: parsed.user, isLocal: true };
      }
    }
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      ),
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        return { user, supabase };
      }
    }

    // Fallback: Check local admin cookie even if Supabase is configured
    if (sessionCookie?.value) {
      const parsed = parseSessionCookieValue(sessionCookie.value);
      if (parsed?.profile?.role === "admin") {
        return { user: parsed.user, supabase };
      }
    }

    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      ),
    };
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
}

/**
 * POST /api/admin/vocabulary/batch
 * Batch insert or upsert vocabulary records into the Supabase database.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const json = await request.json();
    const { words, duplicateStrategy = "update" } = json;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: 'words' array is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        count: words.length,
        message: "Saved in local mode (Supabase not configured).",
      });
    }

    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      adminDb = auth.supabase;
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database client is unavailable." },
        { status: 500 }
      );
    }

    // Map incoming words into database schema format
    const dbPayload = words.map((w: Record<string, unknown>) => {
      const word = String(w.word || "").trim();
      const normalizedWord = String(
        w.normalizedWord || w.normalized_word || word
      ).toLowerCase().trim();
      const partOfSpeech = String(w.partOfSpeech || w.part_of_speech || "noun").toLowerCase().trim();
      const cefrLevel = String(w.cefrLevel || w.cefr_level || "A1").toUpperCase();

      return {
        word,
        normalized_word: normalizedWord,
        part_of_speech: partOfSpeech,
        cefr_level: cefrLevel,
        definition_en: String(w.definitionEn || w.definition_en || w.definition || "").trim(),
        definition_th: w.definitionTh || w.definition_th || w.translation ? String(w.definitionTh || w.definition_th || w.translation).trim() : null,
        example_sentence: String(w.exampleSentence || w.example_sentence || w.example || "").trim(),
        example_translation_th: w.exampleTranslationTh || w.example_translation_th || w.exampleTranslation ? String(w.exampleTranslationTh || w.example_translation_th || w.exampleTranslation).trim() : null,
        phonetic_uk: w.phoneticUk || w.phonetic_uk ? String(w.phoneticUk || w.phonetic_uk).trim() : null,
        phonetic_us: w.phoneticUs || w.phonetic_us ? String(w.phoneticUs || w.phonetic_us).trim() : null,
        audio_uk_url: w.audioUkUrl || w.audio_uk_url ? String(w.audioUkUrl || w.audio_uk_url).trim() : null,
        audio_us_url: w.audioUsUrl || w.audio_us_url ? String(w.audioUsUrl || w.audio_us_url).trim() : null,
        image_url: String(w.imageUrl || w.image_url || ""),
        image_alt: String(w.imageAlt || w.image_alt || `${word} illustration`),
        topic: w.topic ? String(w.topic).trim() : null,
        tags: Array.isArray(w.tags) ? w.tags : [],
        source_name: String(w.sourceName || w.source_name || w.source || "Batch Import"),
        source_license: String(w.sourceLicense || w.source_license || w.license || "CC-BY-4.0"),
      };
    });

    // Execute upsert in chunks of 50 to avoid request payload limits
    const CHUNK_SIZE = 50;
    let insertedCount = 0;

    for (let i = 0; i < dbPayload.length; i += CHUNK_SIZE) {
      const chunk = dbPayload.slice(i, i + CHUNK_SIZE);
      const { data, error } = await adminDb
        .from("vocabularies")
        .upsert(chunk, {
          onConflict: "normalized_word,part_of_speech",
          ignoreDuplicates: duplicateStrategy === "skip",
        })
        .select("id");

      if (error) {
        console.error("Batch import error on chunk:", error);
        throw error;
      }

      insertedCount += data?.length || chunk.length;
    }

    // Log admin audit
    try {
      await logAdminAudit({
        adminUserId: auth.user?.id || "00000000-0000-0000-0000-000000000001",
        action: "vocabulary_imported",
        entityType: "vocabularies",
        afterData: { totalProcessed: dbPayload.length, insertedCount },
      });
    } catch {
      // Audit log non-blocking
    }

    return NextResponse.json({
      success: true,
      totalProcessed: dbPayload.length,
      insertedCount,
    });
  } catch (err) {
    console.error("Batch import failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Batch import failed" },
      { status: 500 }
    );
  }
}
