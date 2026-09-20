import { vocabularyWordSchema } from "@/lib/validation/vocabulary-schema";
import { VocabularyWord } from "@/types/vocabulary";

export interface ImportResult {
  successCount: number;
  errorCount: number;
  words: VocabularyWord[];
  errors: Array<{ index: number; word?: string; error: string }>;
}

/**
 * Parses and validates raw JSON text into VocabularyWord objects.
 */
export function parseVocabularyJson(jsonText: string): ImportResult {
  const result: ImportResult = {
    successCount: 0,
    errorCount: 0,
    words: [],
    errors: [],
  };

  let rawList: unknown;
  try {
    rawList = JSON.parse(jsonText);
  } catch (err) {
    result.errors.push({
      index: 0,
      error: `Invalid JSON syntax: ${err instanceof Error ? err.message : "Parse error"}`,
    });
    result.errorCount = 1;
    return result;
  }

  if (!Array.isArray(rawList)) {
    result.errors.push({
      index: 0,
      error: "Import data must be a JSON array of vocabulary objects.",
    });
    result.errorCount = 1;
    return result;
  }

  rawList.forEach((item, idx) => {
    const parseResult = vocabularyWordSchema.safeParse(item);
    if (parseResult.success) {
      const data = parseResult.data;
      const partOfSpeech = (data.partOfSpeech || data.part_of_speech || "noun") as VocabularyWord["partOfSpeech"];
      const cefrLevel = (data.cefrLevel || data.cefr_level || "B1") as VocabularyWord["cefrLevel"];
      const definition = data.definition || data.definitionEn || data.definition_en || "No definition provided";
      const example = data.example || data.exampleSentence || data.example_sentence || "No example sentence provided";

      result.words.push({
        id: data.id || `imported-${Date.now()}-${idx}`,
        word: data.word,
        normalizedWord: data.normalizedWord || data.normalized_word || data.word.toLowerCase().trim(),
        partOfSpeech,
        cefrLevel,
        definition,
        translation: data.translation ?? data.definitionTh ?? data.definition_th ?? undefined,
        example,
        exampleTranslation: data.exampleTranslation ?? data.exampleTranslationTh ?? data.example_translation_th ?? undefined,
        phoneticUk: data.phoneticUk ?? undefined,
        phoneticUs: data.phoneticUs ?? undefined,
        audioUkUrl: data.audioUkUrl ?? undefined,
        audioUsUrl: data.audioUsUrl ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
        imageAlt: data.imageAlt ?? undefined,
        topic: data.topic ?? undefined,
        tags: data.tags ?? [],
        source: data.source ?? "User Import",
        license: data.license ?? "User Provided",
        createdAt: new Date().toISOString(),
      });
      result.successCount += 1;
    } else {
      result.errorCount += 1;
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      result.errors.push({
        index: idx,
        word: typeof item === "object" && item && "word" in item ? String((item as Record<string, unknown>).word) : undefined,
        error: issues,
      });
    }
  });

  return result;
}

/**
 * Parses simple CSV format:
 * word,partOfSpeech,cefrLevel,definition,translation,example,exampleTranslation,phoneticUk,phoneticUs,topic,tags,source,license
 */
export function parseVocabularyCsv(csvText: string): ImportResult {
  const result: ImportResult = {
    successCount: 0,
    errorCount: 0,
    words: [],
    errors: [],
  };

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    result.errors.push({ index: 0, error: "CSV file is empty or missing data rows." });
    result.errorCount = 1;
    return result;
  }

  // Parse header
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const values = parseCsvLine(rawLine);
    const obj: Record<string, string | string[]> = {};

    header.forEach((colName, colIdx) => {
      const val = values[colIdx]?.trim() ?? "";
      if (colName === "tags") {
        obj[colName] = val ? val.split(";").map((t) => t.trim()) : [];
      } else {
        obj[colName] = val;
      }
    });

    const parsed = vocabularyWordSchema.safeParse(obj);
    if (parsed.success) {
      const data = parsed.data;
      const partOfSpeech = (data.partOfSpeech || data.part_of_speech || "noun") as VocabularyWord["partOfSpeech"];
      const cefrLevel = (data.cefrLevel || data.cefr_level || "B1") as VocabularyWord["cefrLevel"];
      const definition = data.definition || data.definitionEn || data.definition_en || "No definition provided";
      const example = data.example || data.exampleSentence || data.example_sentence || "No example sentence provided";

      result.words.push({
        id: `imported-csv-${Date.now()}-${i}`,
        word: data.word,
        normalizedWord: data.normalizedWord || data.normalized_word || data.word.toLowerCase().trim(),
        partOfSpeech,
        cefrLevel,
        definition,
        translation: data.translation ?? data.definitionTh ?? data.definition_th ?? undefined,
        example,
        exampleTranslation: data.exampleTranslation ?? data.exampleTranslationTh ?? data.example_translation_th ?? undefined,
        phoneticUk: data.phoneticUk ?? undefined,
        phoneticUs: data.phoneticUs ?? undefined,
        audioUkUrl: data.audioUkUrl ?? undefined,
        audioUsUrl: data.audioUsUrl ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
        imageAlt: data.imageAlt ?? undefined,
        topic: data.topic ?? undefined,
        tags: data.tags ?? [],
        source: data.source ?? "User CSV Import",
        license: data.license ?? "User Provided",
        createdAt: new Date().toISOString(),
      });
      result.successCount += 1;
    } else {
      result.errorCount += 1;
      result.errors.push({
        index: i,
        word: String(obj["word"] || `Line ${i + 1}`),
        error: parsed.error.issues.map((err) => `${err.path.join(".")}: ${err.message}`).join("; "),
      });
    }
  }

  return result;
}

/**
 * Handles basic quoted CSV line parsing
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
