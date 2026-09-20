import test from "node:test";
import assert from "node:assert/strict";

function getDuplicateKey(word, partOfSpeech) {
  return `${word.toLowerCase().trim()}::${partOfSpeech.toLowerCase().trim()}`;
}

function processDuplicate(strategy, existing, incoming) {
  // If existing record is locked, preserve it untouched!
  if (existing.isLocked || existing.is_locked) {
    return { record: existing, lockedSkipped: true };
  }
  if (strategy === "skip") {
    return { record: existing, lockedSkipped: false };
  }
  if (strategy === "update") {
    return { record: { ...existing, ...incoming, id: existing.id }, lockedSkipped: false };
  }
  if (strategy === "merge") {
    const existingTags = existing.tags || [];
    const incomingTags = incoming.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));

    return {
      record: {
        ...existing,
        definition_en: incoming.definition_en || existing.definition_en,
        definition_th: incoming.definition_th || existing.definition_th,
        example_sentence: incoming.example_sentence || existing.example_sentence,
        image_url: incoming.image_url || existing.image_url,
        image_alt: incoming.image_alt || existing.image_alt,
        tags: mergedTags,
      },
      lockedSkipped: false,
    };
  }
  return { record: existing, lockedSkipped: false };
}

test("Duplicates: matches duplicate keys by normalized_word and part_of_speech", () => {
  const k1 = getDuplicateKey("RESILIENT ", "Adjective");
  const k2 = getDuplicateKey("resilient", "adjective");
  assert.equal(k1, k2);
});

test("Duplicates: strategy 'skip' preserves existing record intact", () => {
  const existing = { word: "persist", part_of_speech: "verb", definition_en: "Old definition", image_url: "https://example.com/old.jpg" };
  const incoming = { word: "persist", part_of_speech: "verb", definition_en: "New definition", image_url: "https://example.com/new.jpg" };

  const result = processDuplicate("skip", existing, incoming);
  assert.equal(result.record.definition_en, "Old definition");
  assert.equal(result.record.image_url, "https://example.com/old.jpg");
  assert.equal(result.lockedSkipped, false);
});

test("Duplicates: strategy 'update' overwrites existing data and replaces image", () => {
  const existing = { id: "word-1", word: "persist", part_of_speech: "verb", definition_en: "Old definition", image_url: "https://example.com/old.jpg" };
  const incoming = { word: "persist", part_of_speech: "verb", definition_en: "Brand new definition", image_url: "https://example.com/new-ai-image.jpg" };

  const result = processDuplicate("update", existing, incoming);
  assert.equal(result.record.definition_en, "Brand new definition");
  assert.equal(result.record.image_url, "https://example.com/new-ai-image.jpg");
  assert.equal(result.record.id, "word-1"); // preserves ID
  assert.equal(result.lockedSkipped, false);
});

test("Duplicates: strategy 'merge' combines tags, fills missing translations, and updates image", () => {
  const existing = {
    word: "journey",
    part_of_speech: "noun",
    definition_en: "An act of traveling",
    definition_th: null, // missing
    image_url: "https://example.com/old.jpg",
    tags: ["beginner", "travel"],
  };
  const incoming = {
    word: "journey",
    part_of_speech: "noun",
    definition_th: "การเดินทาง", // incoming has translation
    image_url: "https://example.com/new-ai-image.jpg",
    tags: ["travel", "vacation"], // overlaps 'travel'
  };

  const result = processDuplicate("merge", existing, incoming);
  assert.equal(result.record.definition_th, "การเดินทาง");
  assert.equal(result.record.image_url, "https://example.com/new-ai-image.jpg");
  assert.deepEqual(result.record.tags.sort(), ["beginner", "travel", "vacation"].sort());
  assert.equal(result.lockedSkipped, false);
});

test("Duplicates: locked word is NEVER overwritten when strategy is 'update'", () => {
  const existingLocked = {
    id: "word-locked-1",
    word: "serendipity",
    part_of_speech: "noun",
    definition_en: "The occurrence of events by chance in a happy way",
    definition_th: "ความบังเอิญที่น่ายินดี",
    image_url: "https://images.unsplash.com/photo-perfect-handpicked.jpg",
    isLocked: true,
  };
  const incomingNew = {
    word: "serendipity",
    part_of_speech: "noun",
    definition_en: "Different definition from AI",
    definition_th: "คำแปลอื่น",
    image_url: "https://images.unsplash.com/photo-new-ai.jpg",
  };

  const result = processDuplicate("update", existingLocked, incomingNew);
  assert.equal(result.lockedSkipped, true);
  assert.equal(result.record.definition_en, "The occurrence of events by chance in a happy way");
  assert.equal(result.record.definition_th, "ความบังเอิญที่น่ายินดี");
  assert.equal(result.record.image_url, "https://images.unsplash.com/photo-perfect-handpicked.jpg");
  assert.equal(result.record.isLocked, true);
});

test("Duplicates: locked word is NEVER modified when strategy is 'merge'", () => {
  const existingLocked = {
    id: "word-locked-2",
    word: "resilience",
    part_of_speech: "noun",
    definition_en: "The capacity to recover quickly from difficulties",
    image_url: "https://images.unsplash.com/photo-sprout-rock.jpg",
    is_locked: true,
    tags: ["strength"],
  };
  const incomingNew = {
    word: "resilience",
    part_of_speech: "noun",
    definition_th: "ความยืดหยุ่นทางจิตใจ",
    image_url: "https://images.unsplash.com/photo-wrong.jpg",
    tags: ["extra-tag"],
  };

  const result = processDuplicate("merge", existingLocked, incomingNew);
  assert.equal(result.lockedSkipped, true);
  assert.equal(result.record.image_url, "https://images.unsplash.com/photo-sprout-rock.jpg");
  assert.deepEqual(result.record.tags, ["strength"]);
});
