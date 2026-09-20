import test from "node:test";
import assert from "node:assert/strict";

// Default configuration mirroring src/config/srs-config.ts
const CONFIG = {
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

// Pure scheduling function
function calculateNextSRSState(currentState, rating, now = new Date(), config = CONFIG) {
  let repetitions = currentState.repetitions ?? 0;
  let interval = currentState.interval ?? currentState.interval_days ?? 0;
  let easeFactor = currentState.easeFactor ?? currentState.ease_factor ?? config.initialEaseFactor;
  let lapses = currentState.lapses ?? 0;

  if (rating === "again") {
    repetitions = 0;
    interval = config.againIntervalDays;
    lapses += 1;
    easeFactor = Math.max(config.minEaseFactor, easeFactor - config.againEasePenalty);
  } else if (rating === "hard") {
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
    if (repetitions === 0) {
      interval = config.goodFirstIntervalDays;
    } else if (repetitions === 1) {
      interval = config.goodSecondIntervalDays;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
    repetitions += 1;
  } else if (rating === "easy") {
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

  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  let status = "review";
  if (rating === "again") {
    status = "learning";
  } else if (
    interval >= config.masteredIntervalThresholdDays &&
    repetitions >= config.masteredRepetitionsThreshold
  ) {
    status = "mastered";
  } else if (repetitions <= 1) {
    status = "learning";
  }

  const roundedEase = Number(easeFactor.toFixed(2));

  return {
    repetitions,
    interval,
    interval_days: interval,
    easeFactor: roundedEase,
    ease_factor: roundedEase,
    lapses,
    lastReviewDate: now.toISOString(),
    last_reviewed_at: now.toISOString(),
    nextReviewDate: nextReview.toISOString(),
    next_review_at: nextReview.toISOString(),
    lastRating: rating,
    last_rating: rating,
    status,
  };
}

function isCardDue(state, referenceDate = new Date()) {
  const next = state.nextReviewDate || state.next_review_at;
  if (!next) return true;
  return new Date(next).getTime() <= referenceDate.getTime();
}

function calculateSRSMetrics(vocabList, progressMap, referenceDate = new Date()) {
  const endOfToday = new Date(referenceDate);
  endOfToday.setHours(23, 59, 59, 999);
  const endMs = endOfToday.getTime();

  let dueToday = 0;
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let masteredCount = 0;

  for (const word of vocabList) {
    const p = progressMap[word.id];
    if (!p || !p.isLearned || p.status === "new") {
      newCount += 1;
      continue;
    }

    if (p.status === "mastered") masteredCount += 1;
    else if (p.status === "learning") learningCount += 1;
    else reviewCount += 1;

    const nextTime = p.nextReviewDate || p.next_review_at;
    if (nextTime && new Date(nextTime).getTime() <= endMs) {
      dueToday += 1;
    }
  }

  return {
    dueToday,
    newCount,
    learningCount,
    reviewCount,
    masteredCount,
    totalWords: vocabList.length,
  };
}

// ==========================================
// Tests
// ==========================================

test("SRS SM-2: resets repetitions and increments lapses on 'again'", () => {
  const initial = {
    repetitions: 3,
    interval: 10,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
    status: "review",
  };

  const next = calculateNextSRSState(initial, "again");
  assert.equal(next.repetitions, 0);
  assert.equal(next.interval, 1);
  assert.equal(next.interval_days, 1);
  assert.equal(next.lapses, 1);
  assert.equal(next.easeFactor, 2.3);
  assert.equal(next.status, "learning");
  assert.equal(next.lastRating, "again");
});

test("SRS SM-2: scales intervals correctly on 'hard'", () => {
  const state = {
    repetitions: 2,
    interval: 5,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
  };

  const next = calculateNextSRSState(state, "hard");
  assert.equal(next.repetitions, 3);
  assert.equal(next.interval, 6); // 5 * 1.2 = 6
  assert.equal(next.easeFactor, 2.35); // 2.5 - 0.15 = 2.35
  assert.equal(next.lastRating, "hard");
});

test("SRS SM-2: scales intervals correctly on 'good' consecutive reviews", () => {
  let state = {
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
  };

  state = calculateNextSRSState(state, "good");
  assert.equal(state.repetitions, 1);
  assert.equal(state.interval, 1);
  assert.equal(state.status, "learning");

  state = calculateNextSRSState(state, "good");
  assert.equal(state.repetitions, 2);
  assert.equal(state.interval, 4);
  assert.equal(state.status, "review");

  state = calculateNextSRSState(state, "good");
  assert.equal(state.repetitions, 3);
  assert.equal(state.interval, 10); // 4 * 2.5 = 10
  assert.equal(state.status, "review");
});

test("SRS SM-2: bonus interval and ease increase on 'easy'", () => {
  const state = {
    repetitions: 2,
    interval: 4,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
  };

  const next = calculateNextSRSState(state, "easy");
  assert.equal(next.repetitions, 3);
  assert.equal(next.interval, 13); // round(4 * 2.5 * 1.3) = 13
  assert.equal(next.easeFactor, 2.65); // 2.5 + 0.15
  assert.equal(next.lastRating, "easy");
});

test("SRS SM-2: ease factor never drops below minEaseFactor (1.3)", () => {
  let state = {
    repetitions: 0,
    interval: 1,
    easeFactor: 1.4,
    lapses: 2,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
  };

  // Drop 1: 1.4 - 0.2 = 1.3
  state = calculateNextSRSState(state, "again");
  assert.equal(state.easeFactor, 1.3);

  // Drop 2: would be 1.1 -> clamped to 1.3
  state = calculateNextSRSState(state, "again");
  assert.equal(state.easeFactor, 1.3);
  assert.equal(state.lapses, 4);
});

test("SRS SM-2: transitions to 'mastered' when interval >= 21 and repetitions >= 4", () => {
  const almostMastered = {
    repetitions: 3,
    interval: 16,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
    status: "review",
  };

  const next = calculateNextSRSState(almostMastered, "good");
  assert.equal(next.repetitions, 4);
  assert.ok(next.interval >= 21); // 16 * 2.5 = 40
  assert.equal(next.status, "mastered");
});

test("SRS SM-2: pure function guarantees immutability of input object", () => {
  const original = Object.freeze({
    repetitions: 2,
    interval: 4,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: "2026-09-01T00:00:00.000Z",
    nextReviewDate: "2026-09-05T00:00:00.000Z",
    status: "review",
  });

  const next = calculateNextSRSState(original, "good");
  assert.notEqual(original, next);
  assert.equal(original.repetitions, 2);
  assert.equal(next.repetitions, 3);
});

test("SRS SM-2: isCardDue correctly flags overdue, due today, and future cards", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");

  const overdueCard = {
    nextReviewDate: "2026-09-19T00:00:00.000Z",
  };
  assert.equal(isCardDue(overdueCard, now), true);

  const dueNowCard = {
    nextReviewDate: "2026-09-20T11:59:00.000Z",
  };
  assert.equal(isCardDue(dueNowCard, now), true);

  const futureCard = {
    nextReviewDate: "2026-09-22T00:00:00.000Z",
  };
  assert.equal(isCardDue(futureCard, now), false);
});

test("SRS SM-2: calculateSRSMetrics calculates Due Today, New, and Mastered counts", () => {
  const vocab = [
    { id: "word-1" },
    { id: "word-2" },
    { id: "word-3" },
    { id: "word-4" },
  ];

  const now = new Date();
  const todayEarlier = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  const todayLater = new Date(now.getTime() + 1 * 3600 * 1000).toISOString();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();

  const progress = {
    "word-1": {
      wordId: "word-1",
      isLearned: true,
      status: "mastered",
      nextReviewDate: todayEarlier, // due earlier today
    },
    "word-2": {
      wordId: "word-2",
      isLearned: true,
      status: "review",
      nextReviewDate: todayLater, // due later today
    },
    "word-3": {
      wordId: "word-3",
      isLearned: true,
      status: "learning",
      nextReviewDate: nextWeek, // future
    },
    // word-4 has no progress record -> New
  };

  const metrics = calculateSRSMetrics(vocab, progress, now);
  assert.equal(metrics.totalWords, 4);
  assert.equal(metrics.dueToday, 2);
  assert.equal(metrics.newCount, 1);
  assert.equal(metrics.masteredCount, 1);
  assert.equal(metrics.learningCount, 1);
  assert.equal(metrics.reviewCount, 1);
});
