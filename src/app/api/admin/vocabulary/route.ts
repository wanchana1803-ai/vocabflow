import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { parseSessionCookieValue } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";
import { vocabularyWordSchema } from "@/lib/validation/vocabulary-schema";
import { logAdminAudit } from "@/lib/auth/audit";

/**
 * Helper: Authenticate and verify that caller is an Admin.
 * Supports Supabase Auth with fallback to verified local admin session cookie.
 */
async function authenticateAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("vocabflow_session");

  if (!isSupabaseConfigured()) {
    if (sessionCookie?.value) {
      const parsed = parseSessionCookieValue(sessionCookie.value);
      if (parsed?.profile?.role === "admin") {
        return { user: parsed.user, supabase: null };
      }
    }
    return { errorResponse: NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 }) };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (!profileError && profile?.role === "admin") {
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

    return { errorResponse: NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 }) };
  } catch {
    return { errorResponse: NextResponse.json({ error: "Unauthorized: Login required" }, { status: 401 }) };
  }
}

/**
 * GET /api/admin/vocabulary
 * Fetch list of vocabularies with admin metadata
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin();
  if (authResult.errorResponse) return authResult.errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const cefr = searchParams.get("cefr") || "ALL";

  const client = authResult.supabase;
  if (!client) {
    return NextResponse.json({ data: [] });
  }

  let query = client.from("vocabularies").select("*").order("created_at", { ascending: false });

  if (cefr !== "ALL") {
    query = query.eq("cefr_level", cefr);
  }

  if (search) {
    query = query.or(`word.ilike.%${search}%,definition_en.ilike.%${search}%,definition_th.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/admin/vocabulary
 * Create a new vocabulary word (Admin only)
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin();
  if (authResult.errorResponse) return authResult.errorResponse;

  try {
    const json = await request.json();

    // Step 6: Validate request body with Zod
    const parsed = vocabularyWordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const w = parsed.data;
    const normalizedWord = (w.normalizedWord || w.normalized_word || w.word).toLowerCase().trim();

    // Prefer service role client for writes to ensure consistency with RLS
    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      adminDb = authResult.supabase;
    }

    const insertData = {
      word: w.word.trim(),
      normalized_word: normalizedWord,
      part_of_speech: w.partOfSpeech || w.part_of_speech || "noun",
      cefr_level: w.cefrLevel || w.cefr_level || "A1",
      definition_en: w.definitionEn || w.definition || "",
      definition_th: w.definitionTh || w.translation || null,
      example_sentence: w.exampleSentence || w.example || "",
      example_translation_th: w.exampleTranslationTh || w.exampleTranslation || null,
      phonetic_uk: w.phoneticUk || w.phonetic_uk || null,
      phonetic_us: w.phoneticUs || w.phonetic_us || null,
      audio_uk_url: w.audioUkUrl || w.audio_uk_url || null,
      audio_us_url: w.audioUsUrl || w.audio_us_url || null,
      image_url: w.imageUrl || w.image_url || "",
      image_alt: w.imageAlt || w.image_alt || `${w.word} illustration`,
      topic: w.topic || null,
      tags: w.tags || [],
      source_name: w.sourceName || w.source || "VocabFlow Admin",
      source_license: w.sourceLicense || w.license || "CC-BY-4.0",
    };

    if (!adminDb) {
      return NextResponse.json({
        data: {
          id: `local_${Date.now()}`,
          ...insertData,
          created_at: new Date().toISOString(),
        },
      });
    }

    // Check duplicate
    const { data: existing } = await adminDb
      .from("vocabularies")
      .select("id, word, part_of_speech")
      .eq("normalized_word", normalizedWord)
      .eq("part_of_speech", w.partOfSpeech || w.part_of_speech || "noun")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `คำศัพท์ "${w.word}" (${w.partOfSpeech || w.part_of_speech}) มีอยู่ในระบบแล้ว` },
        { status: 409 }
      );
    }

    const { data: created, error } = await adminDb
      .from("vocabularies")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record Audit Log
    await logAdminAudit({
      adminUserId: authResult.user.id,
      action: "vocabulary_created",
      entityType: "vocabulary",
      entityId: created.id,
      afterData: created as Record<string, unknown>,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PUT /api/admin/vocabulary
 * Update an existing vocabulary word (Admin only)
 */
export async function PUT(request: NextRequest) {
  const authResult = await authenticateAdmin();
  if (authResult.errorResponse) return authResult.errorResponse;

  try {
    const json = await request.json();
    const id = json.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Word ID is required for update" }, { status: 400 });
    }

    // Validate with Zod
    const parsed = vocabularyWordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const w = parsed.data;
    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      adminDb = authResult.supabase;
    }

    if (!adminDb) {
      return NextResponse.json({
        data: {
          id,
          ...w,
          updated_at: new Date().toISOString(),
        },
      });
    }

    // Fetch before data for audit log
    const { data: before } = await adminDb
      .from("vocabularies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!before) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const updateData = {
      word: w.word.trim(),
      normalized_word: (w.normalizedWord || w.normalized_word || w.word).toLowerCase().trim(),
      part_of_speech: w.partOfSpeech || w.part_of_speech || before.part_of_speech,
      cefr_level: w.cefrLevel || w.cefr_level || before.cefr_level,
      definition_en: w.definitionEn || w.definition || before.definition_en,
      definition_th: w.definitionTh || w.translation || before.definition_th,
      example_sentence: w.exampleSentence || w.example || before.example_sentence,
      example_translation_th: w.exampleTranslationTh || w.exampleTranslation || before.example_translation_th,
      phonetic_uk: w.phoneticUk || w.phonetic_uk || before.phonetic_uk,
      phonetic_us: w.phoneticUs || w.phonetic_us || before.phonetic_us,
      audio_uk_url: w.audioUkUrl || w.audio_uk_url || before.audio_uk_url,
      audio_us_url: w.audioUsUrl || w.audio_us_url || before.audio_us_url,
      image_url: w.imageUrl || w.image_url || before.image_url,
      image_alt: w.imageAlt || w.image_alt || before.image_alt,
      topic: w.topic || before.topic,
      tags: w.tags || before.tags,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await adminDb
      .from("vocabularies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record Audit Log
    await logAdminAudit({
      adminUserId: authResult.user.id,
      action: "vocabulary_updated",
      entityType: "vocabulary",
      entityId: id,
      beforeData: before as Record<string, unknown>,
      afterData: updated as Record<string, unknown>,
    });

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/vocabulary
 * Delete a vocabulary word (Admin only)
 */
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateAdmin();
  if (authResult.errorResponse) return authResult.errorResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Word ID is required" }, { status: 400 });
  }

  let adminDb;
  try {
    adminDb = createAdminClient();
  } catch {
    adminDb = authResult.supabase;
  }

  if (!adminDb) {
    return NextResponse.json({ success: true, message: "ลบคำศัพท์เรียบร้อยแล้ว (Local Mode)" });
  }

  // Fetch before data for audit log
  const { data: before } = await adminDb
    .from("vocabularies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!before) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  const { error } = await adminDb.from("vocabularies").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record Audit Log
  await logAdminAudit({
    adminUserId: authResult.user.id,
    action: "vocabulary_deleted",
    entityType: "vocabulary",
    entityId: id,
    beforeData: before as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, message: `ลบคำว่า "${before.word}" เรียบร้อยแล้ว` });
}
