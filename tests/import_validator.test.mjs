import test from "node:test";
import assert from "node:assert/strict";

const allowedCEFR = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const allowedPOS = new Set([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "phrase",
  "idiom",
]);

function validateRow(row) {
  const errors = [];
  const word = String(row.word || "").trim();
  if (!word) errors.push("Word cannot be empty");

  const pos = String(row.part_of_speech || "").toLowerCase().trim();
  if (!allowedPOS.has(pos)) errors.push(`Invalid part of speech: ${pos}`);

  const cefr = String(row.cefr_level || "").toUpperCase().trim();
  if (!allowedCEFR.has(cefr)) errors.push(`Invalid CEFR level: ${cefr}`);

  const def = String(row.definition_en || "").trim();
  if (def.length < 2) errors.push("English definition too short");

  const ex = String(row.example_sentence || "").trim();
  if (ex.length < 2) errors.push("Example sentence too short");

  return {
    isValid: errors.length === 0,
    errors,
    normalized_word: word.toLowerCase(),
  };
}

test("Validator: approves completely valid row", () => {
  const row = {
    word: "eloquent",
    part_of_speech: "adjective",
    cefr_level: "B2",
    definition_en: "Fluent and persuasive in speech",
    example_sentence: "Her speech was very eloquent.",
  };

  const res = validateRow(row);
  assert.equal(res.isValid, true);
  assert.equal(res.normalized_word, "eloquent");
  assert.equal(res.errors.length, 0);
});

test("Validator: flags invalid CEFR level and missing definition", () => {
  const row = {
    word: "testword",
    part_of_speech: "noun",
    cefr_level: "XYZ", // Invalid
    definition_en: "",  // Missing
    example_sentence: "A valid example sentence.",
  };

  const res = validateRow(row);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some((e) => e.includes("CEFR")));
  assert.ok(res.errors.some((e) => e.includes("definition")));
});

test("Validator: normalizes abbreviated and compound parts of speech", () => {
  function normalizePOS(val) {
    const cleaned = String(val || "").toLowerCase().trim();
    if (allowedPOS.has(cleaned)) return cleaned;
    const parts = cleaned.split(/[,/;&]|\band\b/).map((p) => p.trim().replace(/\.+$/, "")).filter(Boolean);
    const map = {
      n: "noun", v: "verb", adj: "adjective", adv: "adverb",
      prep: "preposition", conj: "conjunction", pron: "pronoun",
      interj: "interjection", det: "determiner", "indefinite article": "determiner"
    };
    for (const p of parts) {
      if (map[p]) return map[p];
    }
    return map[cleaned.replace(/\.+$/, "")] || "noun";
  }

  assert.equal(normalizePOS("v."), "verb");
  assert.equal(normalizePOS("n."), "noun");
  assert.equal(normalizePOS("adj."), "adjective");
  assert.equal(normalizePOS("adv."), "adverb");
  assert.equal(normalizePOS("prep., adv."), "preposition");
  assert.equal(normalizePOS("indefinite article"), "determiner");
});

