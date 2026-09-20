import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SRSRating, UserWordProgress } from "@/types/srs";

/**
 * Fetch all SRS progress records for a user
 */
export async function getUserProgress(
  userId: string
): Promise<{ data: Record<string, UserWordProgress>; error: string | null }> {
  if (!isSupabaseConfigured() || !userId) {
    return { data: {}, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_vocabulary_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    const progressMap: Record<string, UserWordProgress> = {};
    (data || []).forEach((row) => {
      progressMap[row.vocabulary_id] = {
        wordId: row.vocabulary_id,
        isLearned: row.is_learned,
        status: (row.status as UserWordProgress["status"]) || "learning",
        repetitions: row.repetitions,
        interval: row.interval,
        easeFactor: row.ease_factor,
        lapses: row.lapses,
        lastReviewDate: row.last_reviewed_at,
        nextReviewDate: row.next_review_at,
        history: [],
      };
    });

    return { data: progressMap, error: null };
  } catch (err) {
    return {
      data: {},
      error: err instanceof Error ? err.message : "Failed to load progress",
    };
  }
}

/**
 * Upsert user's SRS progress for a specific vocabulary word
 */
export async function upsertWordProgress(
  userId: string,
  vocabularyId: string,
  progress: Omit<UserWordProgress, "wordId" | "history">
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !userId) {
    return { success: true, error: null };
  }

  try {
    const supabase = createClient();
    const status =
      progress.repetitions >= 5 ? "mastered" : progress.repetitions > 0 ? "reviewing" : "learning";

    const { error } = await supabase.from("user_vocabulary_progress").upsert(
      {
        user_id: userId,
        vocabulary_id: vocabularyId,
        is_learned: progress.isLearned,
        status,
        repetitions: progress.repetitions,
        interval: progress.interval,
        ease_factor: progress.easeFactor,
        lapses: progress.lapses,
        last_reviewed_at: progress.lastReviewDate,
        next_review_at: progress.nextReviewDate,
      },
      { onConflict: "user_id,vocabulary_id" }
    );

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save progress",
    };
  }
}

/**
 * Append a review rating to the review_history table
 */
export async function logReviewHistory(entry: {
  userId: string;
  vocabularyId: string;
  rating: SRSRating;
  intervalBefore: number;
  intervalAfter: number;
  easeFactorBefore: number;
  easeFactorAfter: number;
}): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !entry.userId) {
    return { success: true, error: null };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("review_history").insert({
      user_id: entry.userId,
      vocabulary_id: entry.vocabularyId,
      rating: entry.rating,
      interval_before: entry.intervalBefore,
      interval_after: entry.intervalAfter,
      ease_factor_before: entry.easeFactorBefore,
      ease_factor_after: entry.easeFactorAfter,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to log review",
    };
  }
}

/**
 * Record a study session
 */
export async function recordLearningSession(session: {
  userId: string;
  sessionType: "learn" | "review";
  wordsStudiedCount: number;
  durationSeconds?: number;
  startedAt: string;
  endedAt?: string;
}): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !session.userId) {
    return { success: true, error: null };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("learning_sessions").insert({
      user_id: session.userId,
      session_type: session.sessionType,
      words_studied_count: session.wordsStudiedCount,
      duration_seconds: session.durationSeconds ?? 0,
      started_at: session.startedAt,
      ended_at: session.endedAt ?? new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record session",
    };
  }
}
