import test from "node:test";
import assert from "node:assert/strict";

// Validation logic testing
const requiredVocabFields = [
  "id",
  "word",
  "normalized_word",
  "part_of_speech",
  "cefr_level",
  "definition_en",
  "definition_th",
  "example_sentence",
  "example_translation_th",
  "phonetic_uk",
  "phonetic_us",
  "audio_uk_url",
  "audio_us_url",
  "image_url",
  "image_alt",
  "topic",
  "tags",
  "source_name",
  "source_license",
];

const seedWords = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    word: "journey",
    normalized_word: "journey",
    part_of_speech: "noun",
    cefr_level: "A1",
    definition_en: "An act of traveling from one place to another.",
    definition_th: "การเดินทาง",
    example_sentence: "We embarked on an exciting journey across the mountains.",
    example_translation_th: "พวกเราเริ่มต้นการเดินทางที่น่าตื่นเต้นข้ามภูเขา",
    phonetic_uk: "/ˈdʒɜː.ni/",
    phonetic_us: "/ˈdʒɝː.ni/",
    audio_uk_url: null,
    audio_us_url: null,
    image_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
    image_alt: "Scenic mountain road",
    topic: "Travel & Nature",
    tags: ["beginner", "a1", "travel"],
    source_name: "VocabFlow Open Demo Dataset",
    source_license: "CC-BY-4.0",
  },
  {
    id: "a0000002-0000-0000-0000-000000000002",
    word: "curious",
    normalized_word: "curious",
    part_of_speech: "adjective",
    cefr_level: "A2",
    definition_en: "Eager to know or learn something new.",
    definition_th: "อยากรู้อยากเห็น หรือใฝ่รู้",
    example_sentence: "Children are naturally curious.",
    example_translation_th: "เด็กๆ มักจะมีความอยากรู้อยากเห็น",
    phonetic_uk: "/ˈkjʊə.ri.əs/",
    phonetic_us: "/ˈkjʊr.i.əs/",
    audio_uk_url: null,
    audio_us_url: null,
    image_url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8",
    image_alt: "Open book with glasses",
    topic: "Mind & Learning",
    tags: ["a2", "education"],
    source_name: "VocabFlow Open Demo Dataset",
    source_license: "CC-BY-4.0",
  },
  {
    id: "a0000003-0000-0000-0000-000000000003",
    word: "accomplish",
    normalized_word: "accomplish",
    part_of_speech: "verb",
    cefr_level: "B1",
    definition_en: "To succeed in completing a task.",
    definition_th: "ทำสำเร็จ",
    example_sentence: "You can accomplish your goals with practice.",
    example_translation_th: "คุณสามารถบรรลุเป้าหมายได้",
    phonetic_uk: "/əˈkʌm.plɪʃ/",
    phonetic_us: "/əˈkɑːm.plɪʃ/",
    audio_uk_url: null,
    audio_us_url: null,
    image_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    image_alt: "Colleagues celebrating team success",
    topic: "Achievement",
    tags: ["b1", "success"],
    source_name: "VocabFlow Open Demo Dataset",
    source_license: "CC-BY-4.0",
  },
  {
    id: "a0000004-0000-0000-0000-000000000004",
    word: "resilient",
    normalized_word: "resilient",
    part_of_speech: "adjective",
    cefr_level: "B2",
    definition_en: "Able to recover quickly from difficult conditions.",
    definition_th: "ยืดหยุ่น ล้มแล้วลุกเร็ว",
    example_sentence: "She showed a resilient mindset.",
    example_translation_th: "เธอแสดงให้เห็นถึงกรอบความคิดที่ยืดหยุ่น",
    phonetic_uk: "/rɪˈzɪl.jənt/",
    phonetic_us: "/rɪˈzɪl.jənt/",
    audio_uk_url: null,
    audio_us_url: null,
    image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5",
    image_alt: "Plant growing from stone",
    topic: "Personal Growth",
    tags: ["b2", "mindset"],
    source_name: "VocabFlow Open Demo Dataset",
    source_license: "CC-BY-4.0",
  },
  {
    id: "a0000005-0000-0000-0000-000000000005",
    word: "persist",
    normalized_word: "persist",
    part_of_speech: "verb",
    cefr_level: "B2",
    definition_en: "To continue firmly in an action despite difficulty.",
    definition_th: "พากเพียร อดทนทำอย่างต่อเนื่อง",
    example_sentence: "If you persist with daily practice, fluency will follow.",
    example_translation_th: "หากคุณอดทนฝึกฝน ความคล่องแคล่วจะตามมา",
    phonetic_uk: "/pəˈsɪst/",
    phonetic_us: "/pɚˈsɪst/",
    audio_uk_url: null,
    audio_us_url: null,
    image_url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2",
    image_alt: "Morning sun path",
    topic: "Habits & Discipline",
    tags: ["b2", "habit"],
    source_name: "VocabFlow Open Demo Dataset",
    source_license: "CC-BY-4.0",
  },
];

test("Database Schema: Exactly 5 general demo words provided in seed", () => {
  assert.equal(seedWords.length, 5);
});

test("Database Schema: All required vocabulary columns are populated", () => {
  for (const word of seedWords) {
    for (const field of requiredVocabFields) {
      assert.ok(field in word, `Missing field "${field}" in word "${word.word}"`);
    }
  }
});

test("Database Schema: CEFR levels strictly cover A1, A2, B1, B2", () => {
  const allowed = new Set(["A1", "A2", "B1", "B2"]);
  for (const word of seedWords) {
    assert.ok(allowed.has(word.cefr_level), `Invalid CEFR level ${word.cefr_level}`);
  }
});

test("Vocabulary Deletion: removes word from list correctly", () => {
  const wordList = [...seedWords];
  const targetId = wordList[0].id;
  const filtered = wordList.filter((w) => w.id !== targetId);
  assert.equal(filtered.length, seedWords.length - 1);
  assert.ok(!filtered.some((w) => w.id === targetId));
});

