/**
 * Spaced Repetition System (SRS) Algorithm Parameters
 * Enhanced SM-2 Configuration
 * 
 * Adjust these parameters to fine-tune study intervals, retention rates,
 * and mastery thresholds for vocabulary flashcards.
 */

export interface SRSAlgorithmConfig {
  /** Initial ease factor for new cards (Standard SM-2 default is 2.5) */
  initialEaseFactor: number;

  /** Minimum ease factor allowed (prevent cards from getting permanently stuck in ease death) */
  minEaseFactor: number;

  /** Maximum ease factor allowed */
  maxEaseFactor: number;

  /** Multiplier applied to interval on "Hard" rating (e.g. 1.2 = 20% increase) */
  hardIntervalMultiplier: number;

  /** Bonus multiplier applied to interval on "Easy" rating (e.g. 1.3 = 30% bonus) */
  easyBonusMultiplier: number;

  /** Interval in days when user rates "Again" (fail/lapse) */
  againIntervalDays: number;

  /** Penalty subtracted from ease factor when user rates "Again" */
  againEasePenalty: number;

  /** Penalty subtracted from ease factor when user rates "Hard" */
  hardEasePenalty: number;

  /** Bonus added to ease factor when user rates "Easy" */
  easyEaseBonus: number;

  /** First interval (in days) on successful review for Hard */
  hardFirstIntervalDays: number;

  /** Second interval (in days) on consecutive review for Hard */
  hardSecondIntervalDays: number;

  /** First interval (in days) on successful review for Good */
  goodFirstIntervalDays: number;

  /** Second interval (in days) on consecutive review for Good */
  goodSecondIntervalDays: number;

  /** First interval (in days) on successful review for Easy */
  easyFirstIntervalDays: number;

  /** Second interval (in days) on consecutive review for Easy */
  easySecondIntervalDays: number;

  /** Interval in days required to transition status to "mastered" */
  masteredIntervalThresholdDays: number;

  /** Minimum repetitions required to transition status to "mastered" */
  masteredRepetitionsThreshold: number;
}

export const DEFAULT_SRS_CONFIG: SRSAlgorithmConfig = {
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
  maxEaseFactor: 3.5,

  hardIntervalMultiplier: 1.2,
  easyBonusMultiplier: 1.3,

  againIntervalDays: 1,
  againEasePenalty: 0.20,

  hardEasePenalty: 0.15,
  easyEaseBonus: 0.15,

  hardFirstIntervalDays: 1,
  hardSecondIntervalDays: 2,

  goodFirstIntervalDays: 1,
  goodSecondIntervalDays: 4,

  easyFirstIntervalDays: 2,
  easySecondIntervalDays: 6,

  masteredIntervalThresholdDays: 21,
  masteredRepetitionsThreshold: 4,
};
