import { z } from "zod";
import { TargetColumnKey } from "./parser";
import { cefrLevels, partsOfSpeech } from "@/lib/validation/vocabulary-schema";
import { VocabularyRecord } from "@/types/vocabulary";

export interface RowValidationError {
  rowIndex: number;
  word: string;
  field: string;
  message: string;
}

export interface ValidationBatchResult {
  validRecords: VocabularyRecord[];
  invalidRows: RowValidationError[];
  totalChecked: number;
}

export function normalizePartOfSpeech(val: string): string {
  if (!val) return "noun";
  const cleaned = val.toLowerCase().trim();

  // If already exactly matches one of our valid parts
  if ((partsOfSpeech as readonly string[]).includes(cleaned)) {
    return cleaned;
  }

  // Handle compound parts of speech like "prep., adv.", "n., v.", "n., adj.", "v., n.", "n., v., adj."
  // Split by comma, slash, semicolon, or "and"
  const parts = cleaned
    .split(/[,/;&]|\band\b/)
    .map((p) => p.trim().replace(/\.+$/, ""))
    .filter(Boolean);

  for (const part of parts) {
    const mapped = mapSinglePos(part);
    if (mapped) return mapped;
  }

  return mapSinglePos(cleaned.replace(/\.+$/, "")) || "noun";
}

function mapSinglePos(token: string): string | null {
  const t = token.trim();
  switch (t) {
    case "n":
    case "noun":
    case "nouns":
      return "noun";
    case "v":
    case "verb":
    case "verbs":
    case "vi":
    case "vt":
      return "verb";
    case "adj":
    case "adjective":
    case "adjectives":
      return "adjective";
    case "adv":
    case "adverb":
    case "adverbs":
      return "adverb";
    case "prep":
    case "preposition":
    case "prepositions":
      return "preposition";
    case "conj":
    case "conjunction":
    case "conjunctions":
      return "conjunction";
    case "pron":
    case "pronoun":
    case "pronouns":
      return "pronoun";
    case "interj":
    case "interjection":
    case "interjections":
    case "excl":
    case "exclamation":
      return "interjection";
    case "det":
    case "determiner":
    case "article":
    case "definite article":
    case "indefinite article":
      return "determiner";
    case "phrase":
    case "phr":
    case "phrases":
    case "expression":
      return "phrase";
    case "idiom":
    case "idioms":
      return "idiom";
    default:
      return null;
  }
}

const singleRowZodSchema = z.object({
  word: z.string().min(1, "Word cannot be empty").trim(),
  part_of_speech: z.string().transform((val) => normalizePartOfSpeech(val)).pipe(
    z.enum(partsOfSpeech, {
      message: `Invalid part of speech. Expected one of: ${partsOfSpeech.join(", ")}`,
    })
  ),
  cefr_level: z.string().transform((val) => val.toUpperCase().trim()).pipe(
    z.enum(cefrLevels, {
      message: `Invalid CEFR level. Expected: ${cefrLevels.join(", ")}`,
    })
  ),
  definition_en: z.string().min(2, "English definition must be at least 2 characters").trim(),
  definition_th: z.string().optional().nullable(),
  example_sentence: z.string().min(2, "Example sentence must be at least 2 characters").trim(),
  example_translation_th: z.string().optional().nullable(),
  phonetic_uk: z.string().optional().nullable(),
  phonetic_us: z.string().optional().nullable(),
  audio_uk_url: z.string().url("Invalid UK audio URL").optional().or(z.literal("")).nullable(),
  audio_us_url: z.string().url("Invalid US audio URL").optional().or(z.literal("")).nullable(),
  image_url: z.string().optional().nullable(),
  image_alt: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  source_name: z.string().optional().nullable(),
  source_license: z.string().optional().nullable(),
  is_locked: z
    .union([z.boolean(), z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === true || val === 1 || val === "1") return true;
      if (typeof val === "string") {
        const s = val.toLowerCase().trim();
        return s === "true" || s === "yes" || s === "y" || s === "ล็อค" || s === "lock";
      }
      return false;
    }),
});

/**
 * Validates a batch of raw table rows based on user column mapping.
 */
export function validateBatchRows(
  rawRows: Record<string, string>[],
  columnMapping: Record<TargetColumnKey, string>,
  globalMetadata?: { defaultSource?: string; defaultLicense?: string }
): ValidationBatchResult {
  const validRecords: VocabularyRecord[] = [];
  const invalidRows: RowValidationError[] = [];

  rawRows.forEach((row, index) => {
    // Map raw row fields using column mapping
    const mapped: Record<string, unknown> = {};

    (Object.keys(columnMapping) as TargetColumnKey[]).forEach((targetKey) => {
      const sourceHeader = columnMapping[targetKey];
      if (sourceHeader && row[sourceHeader] !== undefined) {
        mapped[targetKey] = row[sourceHeader];
      }
    });

    const rawWord = String(mapped.word || "").trim();

    // Process tags into array
    if (typeof mapped.tags === "string") {
      const tagStr = mapped.tags.trim();
      mapped.tags = tagStr.length > 0 ? tagStr.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [];
    } else if (!Array.isArray(mapped.tags)) {
      mapped.tags = [];
    }

    // Apply global fallback metadata if missing
    if (!mapped.source_name && globalMetadata?.defaultSource) {
      mapped.source_name = globalMetadata.defaultSource;
    }
    if (!mapped.source_license && globalMetadata?.defaultLicense) {
      mapped.source_license = globalMetadata.defaultLicense;
    }

    // Default fallback image if empty
    if (!mapped.image_url) {
      mapped.image_url = "";
    }
    if (!mapped.image_alt && rawWord) {
      mapped.image_alt = `Illustration for ${rawWord}`;
    }

    const parseResult = singleRowZodSchema.safeParse(mapped);

    if (parseResult.success) {
      const data = parseResult.data;
      const normalized = data.word.toLowerCase().trim();

      validRecords.push({
        id: `import-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        word: data.word,
        normalized_word: normalized,
        part_of_speech: data.part_of_speech,
        cefr_level: data.cefr_level as VocabularyRecord["cefr_level"],
        definition_en: data.definition_en,
        definition_th: data.definition_th || null,
        example_sentence: data.example_sentence,
        example_translation_th: data.example_translation_th || null,
        phonetic_uk: data.phonetic_uk || null,
        phonetic_us: data.phonetic_us || null,
        audio_uk_url: data.audio_uk_url || null,
        audio_us_url: data.audio_us_url || null,
        image_url: data.image_url || "",
        image_alt: data.image_alt || `Illustration for ${data.word}`,
        topic: data.topic || null,
        tags: data.tags,
        source_name: data.source_name || "User Import",
        source_license: data.source_license || "User Provided",
        is_locked: Boolean(data.is_locked),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      parseResult.error.issues.forEach((issue) => {
        invalidRows.push({
          rowIndex: index + 1, // 1-based for human display
          word: rawWord || `Row ${index + 1}`,
          field: issue.path.join(".") || "row",
          message: issue.message,
        });
      });
    }
  });

  return {
    validRecords,
    invalidRows,
    totalChecked: rawRows.length,
  };
}
