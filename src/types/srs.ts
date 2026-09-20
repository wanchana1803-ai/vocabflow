export type SRSRating = "again" | "hard" | "good" | "easy";

export interface SRSState {
  repetitions: number;
  interval: number; // in days
  easeFactor: number; // e.g. default 2.5
  lapses: number;
  lastReviewDate: string | null;
  nextReviewDate: string;
}

export interface UserWordProgress extends SRSState {
  wordId: string;
  isLearned: boolean;
  status?: "learning" | "reviewing" | "mastered";
  history: ReviewLog[];
}

export interface ReviewLog {
  id: string;
  wordId: string;
  rating: SRSRating;
  reviewedAt: string;
  intervalBefore: number;
  intervalAfter: number;
  easeFactorBefore: number;
  easeFactorAfter: number;
}

export interface SRSConfig {
  initialEaseFactor: number;
  minEaseFactor: number;
  hardIntervalMultiplier: number;
  easyBonusMultiplier: number;
  againInterval: number; // 0 or 1 day
}
