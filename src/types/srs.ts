export type SRSRating = "again" | "hard" | "good" | "easy";

export type WordSRSStatus = "new" | "learning" | "review" | "mastered";

export interface SRSState {
  repetitions: number;
  interval: number; // in days
  interval_days?: number;
  easeFactor: number; // e.g. default 2.5
  ease_factor?: number;
  lapses: number;
  lastReviewDate: string | null;
  last_reviewed_at?: string | null;
  nextReviewDate: string;
  next_review_at?: string;
  lastRating?: SRSRating | null;
  last_rating?: SRSRating | null;
  status?: WordSRSStatus;
}

export interface UserWordProgress extends SRSState {
  wordId: string;
  word_id?: string;
  isLearned: boolean;
  is_learned?: boolean;
  status?: WordSRSStatus;
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

export interface SRSMetrics {
  dueToday: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  masteredCount: number;
  totalWords: number;
}

export interface ReviewSessionState {
  id: string;
  startedAt: string;
  lastUpdatedAt: string;
  queueWordIds: string[];
  currentIndex: number;
  completedWordIds: string[];
  undoStack: {
    wordId: string;
    previousProgress: UserWordProgress;
    queueIndex: number;
  }[];
}
