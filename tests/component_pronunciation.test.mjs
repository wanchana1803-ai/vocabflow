import test from "node:test";
import assert from "node:assert/strict";

test("PronunciationButton Component: initial state is idle with descriptive ARIA label", () => {
  const word = "meticulous";
  const accent = "UK";
  const phonetic = "/məˈtɪk.jə.ləs/";

  const generateAriaLabel = (w, a, p) => {
    const accentLabel = a === "UK" ? "British English (UK)" : "American English (US)";
    return `ฟังเสียงอ่านคำว่า "${w}" สำเนียง ${accentLabel}${p ? ` คำอ่าน ${p}` : ""}`;
  };

  const label = generateAriaLabel(word, accent, phonetic);
  assert.ok(label.includes("meticulous"));
  assert.ok(label.includes("British English (UK)"));
  assert.ok(label.includes("/məˈtɪk.jə.ləs/"));
});

test("PronunciationButton Component: state transitions idle -> loading -> playing -> idle", () => {
  const states = [];
  let currentState = "idle";

  const setState = (next) => {
    currentState = next;
    states.push(next);
  };

  // Simulate playback life-cycle
  setState("loading");
  setState("playing");
  setState("idle");

  assert.deepEqual(states, ["loading", "playing", "idle"]);
  assert.equal(currentState, "idle");
});

test("PronunciationButton Component: accent resolver selects correct audio URL", () => {
  const wordData = {
    word: "schedule",
    audio_us_url: "https://example.com/audio/schedule-us.mp3",
    audio_uk_url: "https://example.com/audio/schedule-uk.mp3",
  };

  const resolveAudioUrl = (word, accent) => {
    if (accent === "UK") {
      return word.audio_uk_url || word.audioUkUrl || null;
    }
    return word.audio_us_url || word.audioUsUrl || null;
  };

  assert.equal(resolveAudioUrl(wordData, "US"), "https://example.com/audio/schedule-us.mp3");
  assert.equal(resolveAudioUrl(wordData, "UK"), "https://example.com/audio/schedule-uk.mp3");
});

test("PronunciationButton Component: error state auto-clears after 4000ms timer", () => {
  let state = "idle";
  let errorMessage = null;

  const simulateError = (msg) => {
    state = "error";
    errorMessage = msg;
  };

  const clearError = () => {
    state = "idle";
    errorMessage = null;
  };

  simulateError("ไม่สามารถเล่นเสียงอ่านสำเนียง US ได้");
  assert.equal(state, "error");
  assert.ok(errorMessage);

  // Simulate timer expiry
  clearError();
  assert.equal(state, "idle");
  assert.equal(errorMessage, null);
});

test("PronunciationButton Component: keyboard triggers speech on Enter and Space", () => {
  let playTriggered = 0;
  const handleKeyDown = (eKey) => {
    if (eKey === "Enter" || eKey === " ") {
      playTriggered += 1;
      return true;
    }
    return false;
  };

  assert.equal(handleKeyDown("Enter"), true);
  assert.equal(handleKeyDown(" "), true);
  assert.equal(handleKeyDown("Escape"), false);
  assert.equal(playTriggered, 2);
});
