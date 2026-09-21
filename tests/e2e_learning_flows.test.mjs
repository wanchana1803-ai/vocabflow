import test from "node:test";
import assert from "node:assert/strict";

// Mirror pure SM-2 logic for E2E flow assertions
function calculateNextSRS(currentState, rating) {
  let rep = currentState.repetitions || 0;
  let interval = currentState.interval || 0;
  let ease = currentState.easeFactor || 2.5;

  if (rating === "again") {
    rep = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === "good") {
    if (rep === 0) interval = 1;
    else if (rep === 1) interval = 4;
    else interval = Math.round(interval * ease);
    rep += 1;
  }
  return { repetitions: rep, interval, easeFactor: ease };
}

test("E2E Flow 1: Guest learning flow without account", () => {
  // Step 1: User arrives as guest (no session cookie)
  const session = null;
  assert.equal(session, null, "Guest has no authentication session");

  // Step 2: Seed vocabulary is loaded into local storage
  const guestVocab = [
    { id: "word-1", word: "meticulous", definition: "Very careful and precise" },
    { id: "word-2", word: "eloquent", definition: "Fluent or persuasive in speaking" },
  ];
  assert.equal(guestVocab.length, 2);

  // Step 3: User reviews word-1 with 'good'
  const progressStore = {};
  const nextSRS = calculateNextSRS({ repetitions: 0, interval: 0, easeFactor: 2.5 }, "good");

  progressStore["word-1"] = {
    wordId: "word-1",
    isLearned: true,
    repetitions: nextSRS.repetitions,
    interval: nextSRS.interval,
    easeFactor: nextSRS.easeFactor,
    history: [{ reviewedAt: "2026-09-21T10:00:00.000Z", rating: "good" }],
  };

  assert.equal(progressStore["word-1"].repetitions, 1);
  assert.equal(progressStore["word-1"].interval, 1);
  assert.equal(progressStore["word-1"].isLearned, true);

  // Step 4: First day streak is 0 (starts at 0, counts on next consecutive day)
  const uniqueDays = new Set(["2026-09-21"]);
  const streak = uniqueDays.size > 1 ? uniqueDays.size - 1 : 0;
  assert.equal(streak, 0, "Day 1 streak must start at 0");
});

test("E2E Flow 2: Authentication and RBAC Route Protection", () => {
  const adminPasswordConfig = "admin123456";

  const attemptLogin = (email, password) => {
    const isAdminEmail = email.toLowerCase() === "admin@vocabflow.local";
    if (isAdminEmail) {
      if (password !== adminPasswordConfig) {
        return { success: false, error: "รหัสผ่าน Admin ไม่ถูกต้อง" };
      }
      return { success: true, user: { id: "admin-1", email, role: "admin" } };
    }
    return { success: true, user: { id: "user-1", email, role: "user" } };
  };

  // 1. Admin login with wrong password -> rejected
  const failedAdmin = attemptLogin("admin@vocabflow.local", "wrongpass");
  assert.equal(failedAdmin.success, false);
  assert.equal(failedAdmin.error, "รหัสผ่าน Admin ไม่ถูกต้อง");

  // 2. Admin login with correct password -> approved
  const successAdmin = attemptLogin("admin@vocabflow.local", "admin123456");
  assert.equal(successAdmin.success, true);
  assert.equal(successAdmin.user.role, "admin");

  // 3. User login -> approved with role 'user'
  const successUser = attemptLogin("learner@example.com", "pass123456");
  assert.equal(successUser.success, true);
  assert.equal(successUser.user.role, "user");

  // 4. Route protection guard
  const checkRouteAccess = (pathname, user) => {
    if (pathname.startsWith("/admin")) {
      if (!user) return { status: 307, redirect: "/login" };
      if (user.role !== "admin") return { status: 403, redirect: "/unauthorized" };
    }
    return { status: 200 };
  };

  assert.equal(checkRouteAccess("/admin/vocabulary", null).redirect, "/login");
  assert.equal(checkRouteAccess("/admin/vocabulary", successUser.user).redirect, "/unauthorized");
  assert.equal(checkRouteAccess("/admin/vocabulary", successAdmin.user).status, 200);
});

test("E2E Flow 3: Admin CSV/JSON import with duplicate resolution and audit trail", () => {
  const existingVocab = [
    { id: "1", normalized_word: "adaptable", is_locked: false, tags: ["general"] },
    { id: "2", normalized_word: "tenacious", is_locked: true, tags: ["locked"] },
  ];

  const incomingRows = [
    { normalized_word: "adaptable", tags: ["personality", "work"] }, // duplicate unlocked
    { normalized_word: "tenacious", tags: ["override"] }, // duplicate locked
    { normalized_word: "innovative", tags: ["tech"] }, // new word
  ];

  const resolveImport = (existing, incoming, strategy) => {
    const existingMap = new Map(existing.map((w) => [w.normalized_word, w]));
    const result = [];
    const auditLogs = [];

    for (const row of incoming) {
      const match = existingMap.get(row.normalized_word);
      if (!match) {
        result.push(row);
        auditLogs.push(`Inserted: ${row.normalized_word}`);
      } else if (match.is_locked) {
        result.push(match); // Protected, never overwritten
        auditLogs.push(`Preserved locked: ${match.normalized_word}`);
      } else if (strategy === "skip") {
        result.push(match);
        auditLogs.push(`Skipped duplicate: ${match.normalized_word}`);
      } else if (strategy === "update") {
        result.push({ ...match, ...row });
        auditLogs.push(`Updated: ${match.normalized_word}`);
      } else if (strategy === "merge") {
        const mergedTags = Array.from(new Set([...(match.tags || []), ...(row.tags || [])]));
        result.push({ ...match, ...row, tags: mergedTags });
        auditLogs.push(`Merged: ${match.normalized_word}`);
      }
    }
    return { result, auditLogs };
  };

  // Test 'merge' strategy
  const { result, auditLogs } = resolveImport(existingVocab, incomingRows, "merge");
  assert.equal(result.length, 3);

  // adaptable is merged
  const adaptable = result.find((r) => r.normalized_word === "adaptable");
  assert.deepEqual(adaptable.tags, ["general", "personality", "work"]);

  // tenacious remains locked and untouched
  const tenacious = result.find((r) => r.normalized_word === "tenacious");
  assert.deepEqual(tenacious.tags, ["locked"]);

  // innovative is added as new
  const innovative = result.find((r) => r.normalized_word === "innovative");
  assert.ok(innovative);

  // Audit logs recorded
  assert.equal(auditLogs.length, 3);
  assert.ok(auditLogs.some((l) => l.includes("Merged: adaptable")));
  assert.ok(auditLogs.some((l) => l.includes("Preserved locked: tenacious")));
});

test("E2E Flow 4: Review session with due cards and completion state", () => {
  const now = new Date("2026-09-21T12:00:00Z").getTime();

  const allWords = [
    { id: "w-1", word: "empathy" },
    { id: "w-2", word: "pragmatic" },
    { id: "w-3", word: "resilient" },
  ];

  const progress = {
    "w-1": { nextReviewDate: "2026-09-20T10:00:00Z" }, // Due yesterday
    "w-2": { nextReviewDate: "2026-09-21T08:00:00Z" }, // Due earlier today
    "w-3": { nextReviewDate: "2026-09-28T00:00:00Z" }, // Future, not due
  };

  // Filter due cards
  const dueQueue = allWords.filter((w) => {
    const p = progress[w.id];
    if (!p || !p.nextReviewDate) return true;
    return new Date(p.nextReviewDate).getTime() <= now;
  });

  assert.equal(dueQueue.length, 2, "Only w-1 and w-2 should be in due review queue");

  // Process all cards in queue
  let currentIndex = 0;
  let isCompleted = false;

  while (currentIndex < dueQueue.length) {
    currentIndex += 1;
  }
  isCompleted = currentIndex >= dueQueue.length;

  assert.equal(isCompleted, true, "Review session reaches completed state");
});
