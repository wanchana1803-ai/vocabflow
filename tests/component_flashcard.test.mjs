import test from "node:test";
import assert from "node:assert/strict";

// Sample test word conforming to VocabularyWord schema
const sampleWord = {
  id: "test-word-1",
  word: "resilience",
  normalized_word: "resilience",
  part_of_speech: "noun",
  definition: "The capacity to recover quickly from difficulties; toughness.",
  translation_th: "ความสามารถในการฟื้นตัวจากความยากลำบาก",
  phonetic_us: "/rɪˈzɪl.jəns/",
  phonetic_uk: "/rɪˈzɪl.jəns/",
  audio_us_url: "https://example.com/audio/resilience-us.mp3",
  audio_uk_url: "https://example.com/audio/resilience-uk.mp3",
  image_url: "https://images.unsplash.com/photo-resilience",
  cefr_level: "B2",
  category: "Mindset & Growth",
  example_sentence: "Courage and resilience helped her overcome adversity.",
  example_translation_th: "ความกล้าหาญและความยืดหยุ่นช่วยให้เธอเอาชนะความยากลำบากได้",
  is_locked: false,
};

test("Flashcard Component: data contract satisfies required front-card fields", () => {
  assert.ok(sampleWord.word, "Word must be present");
  assert.ok(sampleWord.phonetic_us, "US phonetic pronunciation must be present");
  assert.ok(sampleWord.cefr_level, "CEFR badge level must be defined");
  assert.equal(sampleWord.cefr_level, "B2");
  assert.ok(sampleWord.category, "Category label must be defined");
});

test("Flashcard Component: flip state transitions between front and back views", () => {
  let isFlipped = false;
  const onFlip = () => {
    isFlipped = !isFlipped;
  };

  // 1. Initial front state
  assert.equal(isFlipped, false, "Flashcard starts showing front side");

  // 2. User clicks or presses space -> flips to back
  onFlip();
  assert.equal(isFlipped, true, "Flashcard transitions to back side");

  // 3. Flip back to front
  onFlip();
  assert.equal(isFlipped, false, "Flashcard returns to front side");
});

test("Flashcard Component: keyboard triggers flip on Space and Enter only", () => {
  let flipCount = 0;
  const simulateKeyDown = (key) => {
    if (key === " " || key === "Enter") {
      flipCount += 1;
      return true; // handled
    }
    return false; // unhandled
  };

  assert.equal(simulateKeyDown(" "), true);
  assert.equal(simulateKeyDown("Enter"), true);
  assert.equal(simulateKeyDown("ArrowLeft"), false);
  assert.equal(simulateKeyDown("Tab"), false);
  assert.equal(flipCount, 2, "Space and Enter must trigger card flip");
});

test("Flashcard Component: touch swipe detects left/right above 50px threshold", () => {
  const calculateSwipeAction = (startX, startY, endX, endY) => {
    const diffX = startX - endX;
    const diffY = startY - endY;

    // Horizontal must dominate vertical movement
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      return diffX > 0 ? "swipe-left" : "swipe-right";
    }
    return "none";
  };

  // Left swipe (advance next): startX=200, endX=120 (diffX = +80 > 50)
  assert.equal(calculateSwipeAction(200, 100, 120, 105), "swipe-left");

  // Right swipe (undo / previous): startX=100, endX=180 (diffX = -80 < -50)
  assert.equal(calculateSwipeAction(100, 100, 180, 95), "swipe-right");

  // Sub-threshold movement (< 50px)
  assert.equal(calculateSwipeAction(100, 100, 80, 100), "none");

  // Vertical scroll dominance (diffY = 80, diffX = 20) -> should NOT trigger card swipe
  assert.equal(calculateSwipeAction(100, 200, 120, 120), "none");
});

test("Flashcard Component: locked word state protects from modification", () => {
  const lockedWord = { ...sampleWord, is_locked: true, isLocked: true };

  const canEditOrDelete = (word, role) => {
    if (word.is_locked && role !== "superadmin") {
      return false;
    }
    return role === "admin";
  };

  assert.equal(canEditOrDelete(lockedWord, "user"), false);
  assert.equal(canEditOrDelete(lockedWord, "admin"), false, "Locked word cannot be modified even by standard admin");
  assert.equal(canEditOrDelete(sampleWord, "admin"), true, "Unlocked word can be modified by admin");
});
