import type {
  ReviewLog,
  SRSRating,
  SRSState,
  UserWordProgress,
  WordSRSStatus,
  SRSMetrics,
} from "@/types/srs";
import { DEFAULT_SRS_CONFIG, type SRSAlgorithmConfig } from "@/config/srs-config";

export { DEFAULT_SRS_CONFIG };
export type { SRSAlgorithmConfig };

/**
 * Initial empty SRS state for newly added words
 */
export const INITIAL_SRS_STATE: SRSState = {
  repetitions: 0,
  interval: 0,
  interval_days: 0,
  easeFactor: DEFAULT_SRS_CONFIG.initialEaseFactor,
  ease_factor: DEFAULT_SRS_CONFIG.initialEaseFactor,
  lapses: 0,
  lastReviewDate: null,
  last_reviewed_at: null,
  nextReviewDate: new Date().toISOString(),
  next_review_at: new Date().toISOString(),
  lastRating: null,
  last_rating: null,
  status: "new",
};

/**
 * Creates an initial progress record for a new word.
 * Pure function: returns a fresh UserWordProgress object.
 */
export function createInitialSRSProgress(
  wordId: string,
  now: Date = new Date(),
  config: SRSAlgorithmConfig = DEFAULT_SRS_CONFIG
): UserWordProgress {
  const nowIso = now.toISOString();
  return {
    wordId,
    word_id: wordId,
    isLearned: false,
    is_learned: false,
    status: "new",
    repetitions: 0,
    interval: 0,
    interval_days: 0,
    easeFactor: config.initialEaseFactor,
    ease_factor: config.initialEaseFactor,
    lapses: 0,
    lastReviewDate: null,
    last_reviewed_at: null,
    nextReviewDate: nowIso,
    next_review_at: nowIso,
    lastRating: null,
    last_rating: null,
    history: [],
  };
}

/**
 * Calculates next SRS state using the Enhanced SM-2 algorithm.
 * PURE FUNCTION: Does not mutate currentState, returns a new state object.
 */
export function calculateNextSRSState(
  currentState: SRSState,
  rating: SRSRating,
  now: Date = new Date(),
  config: SRSAlgorithmConfig = DEFAULT_SRS_CONFIG
): SRSState {
  let repetitions = currentState.repetitions ?? 0;
  let interval = currentState.interval ?? currentState.interval_days ?? 0;
  let easeFactor = currentState.easeFactor ?? currentState.ease_factor ?? config.initialEaseFactor;
  let lapses = currentState.lapses ?? 0;

  if (rating === "again") {
    // Again: Short-term reset, increase lapse, penalty on ease factor
    repetitions = 0;
    interval = config.againIntervalDays;
    lapses += 1;
    easeFactor = Math.max(config.minEaseFactor, easeFactor - config.againEasePenalty);
  } else if (rating === "hard") {
    // Hard: Moderate interval progression, slight ease penalty
    if (repetitions === 0) {
      interval = config.hardFirstIntervalDays;
    } else if (repetitions === 1) {
      interval = config.hardSecondIntervalDays;
    } else {
      interval = Math.max(1, Math.round(interval * config.hardIntervalMultiplier));
    }
    repetitions += 1;
    easeFactor = Math.max(config.minEaseFactor, easeFactor - config.hardEasePenalty);
  } else if (rating === "good") {
    // Good: Standard SM-2 interval scaling, ease factor remains steady
    if (repetitions === 0) {
      interval = config.goodFirstIntervalDays;
    } else if (repetitions === 1) {
      interval = config.goodSecondIntervalDays;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
    repetitions += 1;
  } else if (rating === "easy") {
    // Easy: Accelerated interval with bonus multiplier, ease factor bonus
    if (repetitions === 0) {
      interval = config.easyFirstIntervalDays;
    } else if (repetitions === 1) {
      interval = config.easySecondIntervalDays;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor * config.easyBonusMultiplier));
    }
    repetitions += 1;
    easeFactor = Math.min(config.maxEaseFactor, easeFactor + config.easyEaseBonus);
  }

  // Calculate next review timestamp
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  const nextReviewIso = nextReview.toISOString();
  const nowIso = now.toISOString();

  // Determine lifecycle status
  let status: WordSRSStatus = "review";
  if (rating === "again") {
    status = "learning";
  } else if (
    interval >= config.masteredIntervalThresholdDays &&
    repetitions >= config.masteredRepetitionsThreshold
  ) {
    status = "mastered";
  } else if (repetitions <= 1) {
    status = "learning";
  } else {
    status = "review";
  }

  const roundedEase = Number(easeFactor.toFixed(2));

  return {
    repetitions,
    interval,
    interval_days: interval,
    easeFactor: roundedEase,
    ease_factor: roundedEase,
    lapses,
    lastReviewDate: nowIso,
    last_reviewed_at: nowIso,
    nextReviewDate: nextReviewIso,
    next_review_at: nextReviewIso,
    lastRating: rating,
    last_rating: rating,
    status,
  };
}

/**
 * Checks if a card is due for review at the given reference time.
 * Pure function.
 */
export function isCardDue(state: SRSState, referenceDate: Date = new Date()): boolean {
  const nextDateStr = state.nextReviewDate || state.next_review_at;
  if (!nextDateStr) return true;
  return new Date(nextDateStr).getTime() <= referenceDate.getTime();
}

/**
 * Calculates SM-2 progression directly for UserWordProgress.
 * Pure function: returns a new updated UserWordProgress with appended ReviewLog.
 */
export function calculateSM2(
  current: UserWordProgress,
  rating: SRSRating,
  now: Date = new Date(),
  config: SRSAlgorithmConfig = DEFAULT_SRS_CONFIG
): UserWordProgress {
  const currentState: SRSState = {
    repetitions: current.repetitions ?? 0,
    interval: current.interval ?? current.interval_days ?? 0,
    interval_days: current.interval_days ?? current.interval ?? 0,
    easeFactor: current.easeFactor ?? current.ease_factor ?? config.initialEaseFactor,
    ease_factor: current.ease_factor ?? current.easeFactor ?? config.initialEaseFactor,
    lapses: current.lapses ?? 0,
    lastReviewDate: current.lastReviewDate ?? current.last_reviewed_at ?? null,
    last_reviewed_at: current.last_reviewed_at ?? current.lastReviewDate ?? null,
    nextReviewDate: current.nextReviewDate ?? current.next_review_at ?? now.toISOString(),
    next_review_at: current.next_review_at ?? current.nextReviewDate ?? now.toISOString(),
    lastRating: current.lastRating ?? current.last_rating ?? null,
    last_rating: current.last_rating ?? current.lastRating ?? null,
    status: current.status || "new",
  };

  const nextState = calculateNextSRSState(currentState, rating, now, config);

  const reviewLog: ReviewLog = {
    id: `log-${now.getTime()}-${Math.random().toString(36).substring(2, 7)}`,
    wordId: current.wordId,
    rating,
    reviewedAt: now.toISOString(),
    intervalBefore: currentState.interval,
    intervalAfter: nextState.interval,
    easeFactorBefore: currentState.easeFactor,
    easeFactorAfter: nextState.easeFactor,
  };

  return {
    ...current,
    ...nextState,
    isLearned: true,
    is_learned: true,
    history: [...(current.history || []), reviewLog],
  };
}

/**
 * Computes SRS metrics: Due Today, New, Learning, Review, Mastered.
 * Pure function.
 */
export function calculateSRSMetrics(
  vocabList: { id: string }[],
  progressMap: Record<string, UserWordProgress>,
  referenceDate: Date = new Date()
): SRSMetrics {
  const totalWords = vocabList.length;
  let dueToday = 0;
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let masteredCount = 0;

  // Set reference to end of today to include all items due today
  const endOfToday = new Date(referenceDate);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayMs = endOfToday.getTime();

  for (const word of vocabList) {
    const p = progressMap[word.id];
    if (!p || !p.isLearned || p.status === "new") {
      newCount += 1;
      continue;
    }

    if (p.status === "mastered") {
      masteredCount += 1;
    } else if (p.status === "learning") {
      learningCount += 1;
    } else {
      reviewCount += 1;
    }

    const nextTimeStr = p.nextReviewDate || p.next_review_at;
    if (nextTimeStr && new Date(nextTimeStr).getTime() <= endOfTodayMs) {
      dueToday += 1;
    }
  }

  return {
    dueToday,
    newCount,
    learningCount,
    reviewCount,
    masteredCount,
    totalWords,
  };
}

/**
 * Resolves current time:
 * If logged in (or server available), syncs with /api/time.
 * In guest mode (or offline), uses device time.
 */
export async function resolveCurrentTime(isLoggedIn: boolean = false): Promise<Date> {
  if (isLoggedIn && typeof window !== "undefined") {
    try {
      const response = await fetch("/api/time", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        if (data && data.serverTime) {
          return new Date(data.serverTime);
        }
      }
    } catch {
      // Graceful fallback to device time on network failure
    }
  }
  return new Date();
}

/**
 * Calculates current learning streak in consecutive days.
 * Rule (Prompt requirement):
 * - Brand new user (0 days studied) = 0 streak.
 * - Day 1 of study (today only) = 0 streak (starts at 0, counts on consecutive days).
 * - Day 2 of continuous study (yesterday + today) = 1 streak (starts counting on the next day).
 * - Day N of continuous study = N - 1 streak.
 * - If user misses a day (gap > 1 day without study) = resets to 0.
 * - If user studied yesterday and hasn't studied yet today, streak is preserved pending today's study.
 */
export function calculateStreak(
  progressMap: Record<string, UserWordProgress> | UserWordProgress[] | ReviewLog[],
  referenceDate: Date = new Date()
): number {
  if (!progressMap) return 0;

  let logs: { reviewedAt?: string }[] = [];
  if (Array.isArray(progressMap)) {
    if (progressMap.length > 0 && "history" in progressMap[0]) {
      logs = (progressMap as UserWordProgress[]).flatMap((p) => p.history || []);
    } else {
      logs = progressMap as { reviewedAt?: string }[];
    }
  } else {
    logs = Object.values(progressMap).flatMap((p) => p.history || []);
  }

  if (logs.length === 0) return 0;

  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const uniqueDatesSet = new Set<string>();
  for (const log of logs) {
    if (log && log.reviewedAt) {
      const d = new Date(log.reviewedAt);
      if (!isNaN(d.getTime())) {
        uniqueDatesSet.add(formatLocalDate(d));
      }
    }
  }

  if (uniqueDatesSet.size === 0) return 0;

  const todayStr = formatLocalDate(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  const studiedToday = uniqueDatesSet.has(todayStr);
  const studiedYesterday = uniqueDatesSet.has(yesterdayStr);

  // If user hasn't studied today and hasn't studied yesterday, streak is broken
  if (!studiedToday && !studiedYesterday) {
    return 0;
  }

  let consecutiveDays = 0;
  const checkDate = new Date(studiedToday ? referenceDate : yesterday);

  while (true) {
    const dateStr = formatLocalDate(checkDate);
    if (uniqueDatesSet.has(dateStr)) {
      consecutiveDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Streak starts at 0 and increments on consecutive days
  return Math.max(0, consecutiveDays - 1);
}

