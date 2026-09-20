import { ReviewLog, SRSConfig, SRSRating, SRSState, UserWordProgress } from "@/types/srs";

export const DEFAULT_SRS_CONFIG: SRSConfig = {
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
  hardIntervalMultiplier: 1.2,
  easyBonusMultiplier: 1.3,
  againInterval: 1, // 1 day
};

export const INITIAL_SRS_STATE: SRSState = {
  repetitions: 0,
  interval: 0,
  easeFactor: DEFAULT_SRS_CONFIG.initialEaseFactor,
  lapses: 0,
  lastReviewDate: null,
  nextReviewDate: new Date().toISOString(),
};

/**
 * Calculates the next SRS state based on SM-2 algorithm principles.
 * Pure function: takes current state and rating, returns new state.
 */
export function calculateNextSRSState(
  currentState: SRSState,
  rating: SRSRating,
  now: Date = new Date(),
  config: SRSConfig = DEFAULT_SRS_CONFIG
): SRSState {
  let { repetitions, interval, easeFactor, lapses } = currentState;

  if (rating === "again") {
    repetitions = 0;
    interval = config.againInterval;
    lapses += 1;
    // Ease factor decreases on failure
    easeFactor = Math.max(config.minEaseFactor, easeFactor - 0.2);
  } else {
    // Rating is hard, good, or easy
    if (repetitions === 0) {
      interval = rating === "hard" ? 1 : rating === "good" ? 1 : 2;
    } else if (repetitions === 1) {
      interval = rating === "hard" ? 2 : rating === "good" ? 4 : 6;
    } else {
      if (rating === "hard") {
        interval = Math.max(1, Math.round(interval * config.hardIntervalMultiplier));
        easeFactor = Math.max(config.minEaseFactor, easeFactor - 0.15);
      } else if (rating === "good") {
        interval = Math.max(1, Math.round(interval * easeFactor));
      } else if (rating === "easy") {
        interval = Math.max(1, Math.round(interval * easeFactor * config.easyBonusMultiplier));
        easeFactor += 0.15;
      }
    }
    repetitions += 1;
  }

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    repetitions,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    lapses,
    lastReviewDate: now.toISOString(),
    nextReviewDate: nextReview.toISOString(),
  };
}

/**
 * Checks if a card is due for review.
 */
export function isCardDue(state: SRSState, currentDate: Date = new Date()): boolean {
  if (!state.nextReviewDate) return true;
  return new Date(state.nextReviewDate).getTime() <= currentDate.getTime();
}

/**
 * Calculates SM-2 progression directly for UserWordProgress.
 */
export function calculateSM2(
  current: UserWordProgress,
  rating: SRSRating
): UserWordProgress {
  const currentState: SRSState = {
    repetitions: current.repetitions ?? 0,
    interval: current.interval ?? 0,
    easeFactor: current.easeFactor ?? DEFAULT_SRS_CONFIG.initialEaseFactor,
    lapses: current.lapses ?? 0,
    lastReviewDate: current.lastReviewDate ?? null,
    nextReviewDate: current.nextReviewDate ?? new Date().toISOString(),
  };

  const nextState = calculateNextSRSState(currentState, rating);

  const reviewLog: ReviewLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    wordId: current.wordId,
    rating,
    reviewedAt: new Date().toISOString(),
    intervalBefore: currentState.interval,
    intervalAfter: nextState.interval,
    easeFactorBefore: currentState.easeFactor,
    easeFactorAfter: nextState.easeFactor,
  };

  return {
    ...current,
    ...nextState,
    isLearned: true,
    status:
      nextState.interval >= 21
        ? "mastered"
        : nextState.repetitions > 0
        ? "reviewing"
        : "learning",
    history: [...(current.history || []), reviewLog],
  };
}

