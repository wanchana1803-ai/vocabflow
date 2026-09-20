import test from "node:test";
import assert from "node:assert/strict";

// Replicate SM-2 calculation for pure unit testing
function calculateNextSRSState(currentState, rating, now = new Date()) {
  const config = {
    initialEaseFactor: 2.5,
    minEaseFactor: 1.3,
    hardIntervalMultiplier: 1.2,
    easyBonusMultiplier: 1.3,
    againInterval: 1,
  };

  let { repetitions, interval, easeFactor, lapses } = currentState;

  if (rating === "again") {
    repetitions = 0;
    interval = config.againInterval;
    lapses += 1;
    easeFactor = Math.max(config.minEaseFactor, easeFactor - 0.2);
  } else {
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

test("SRS SM-2: resets repetitions and increments lapses on 'again'", () => {
  const initial = {
    repetitions: 3,
    interval: 10,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewDate: null,
    nextReviewDate: new Date().toISOString(),
  };

  const next = calculateNextSRSState(initial, "again");
  assert.equal(next.repetitions, 0);
  assert.equal(next.interval, 1);
  assert.equal(next.lapses, 1);
  assert.equal(next.easeFactor, 2.3);
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

  state = calculateNextSRSState(state, "good");
  assert.equal(state.repetitions, 2);
  assert.equal(state.interval, 4);

  state = calculateNextSRSState(state, "good");
  assert.equal(state.repetitions, 3);
  assert.equal(state.interval, 10); // 4 * 2.5 = 10
});

test("SRS SM-2: bonus interval on 'easy'", () => {
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
  assert.ok(next.interval >= 13); // 4 * 2.5 * 1.3 = 13
  assert.equal(next.easeFactor, 2.65);
});
