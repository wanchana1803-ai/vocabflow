import { upsertWordProgress, logReviewHistory } from "./progress";
import { UserWordProgress, ReviewLog } from "@/types/srs";

export interface SyncSummary {
  syncedProgressCount: number;
  syncedHistoryCount: number;
  errors: string[];
}

/**
 * Synchronizes local guest progress and history into the user's Supabase account.
 * This runs automatically after successful user login.
 */
export async function syncGuestProgressToAccount(
  userId: string,
  guestProgress: Record<string, UserWordProgress>,
  guestHistory: ReviewLog[] = []
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    syncedProgressCount: 0,
    syncedHistoryCount: 0,
    errors: [],
  };

  if (!userId) {
    summary.errors.push("Cannot sync without a valid user ID.");
    return summary;
  }

  // 1. Sync SRS progress states
  const progressEntries = Object.entries(guestProgress);
  for (const [vocabId, progress] of progressEntries) {
    const { success, error } = await upsertWordProgress(userId, vocabId, {
      isLearned: progress.isLearned,
      repetitions: progress.repetitions,
      interval: progress.interval,
      easeFactor: progress.easeFactor,
      lapses: progress.lapses,
      lastReviewDate: progress.lastReviewDate,
      nextReviewDate: progress.nextReviewDate,
    });

    if (success) {
      summary.syncedProgressCount += 1;
    } else if (error) {
      summary.errors.push(`Progress sync failed for ${vocabId}: ${error}`);
    }
  }

  // 2. Sync review logs history
  for (const log of guestHistory) {
    const { success, error } = await logReviewHistory({
      userId,
      vocabularyId: log.wordId,
      rating: log.rating,
      intervalBefore: log.intervalBefore,
      intervalAfter: log.intervalAfter,
      easeFactorBefore: log.easeFactorBefore,
      easeFactorAfter: log.easeFactorAfter,
    });

    if (success) {
      summary.syncedHistoryCount += 1;
    } else if (error) {
      summary.errors.push(`History sync failed for ${log.id}: ${error}`);
    }
  }

  return summary;
}
