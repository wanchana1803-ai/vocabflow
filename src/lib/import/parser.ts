export interface ParsedFileResult {
  format: "csv" | "json";
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  error?: string;
}

/**
 * Robust CSV parser implementing RFC 4180 standards:
 * - Supports fields enclosed in double quotes
 * - Handles commas and newlines inside quoted fields
 * - Handles escaped quotes ("") inside quotes
 */
export function parseCSV(csvContent: string): ParsedFileResult {
  if (!csvContent || !csvContent.trim()) {
    return {
      format: "csv",
      headers: [],
      rows: [],
      totalRows: 0,
      error: "The provided CSV file is empty.",
    };
  }

  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const len = csvContent.length;
  for (let i = 0; i < len; i++) {
    const char = csvContent[i];
    const nextChar = i + 1 < len ? csvContent[i + 1] : "";

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentField += '"';
        i++; // skip second quote
      } else {
        // Toggle quote status
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // handle CRLF
      }
      currentRow.push(currentField);
      currentField = "";

      // Only add non-empty row
      if (currentRow.some((val) => val.trim().length > 0)) {
        rawRows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push last field & row if exists
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((val) => val.trim().length > 0)) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length === 0) {
    return {
      format: "csv",
      headers: [],
      rows: [],
      totalRows: 0,
      error: "No data rows detected in CSV file.",
    };
  }

  const rawHeaders = rawRows[0].map((h) => h.trim());
  const headers = rawHeaders.map((h) => normalizeHeaderName(h));

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < rawRows.length; r++) {
    const rowValues = rawRows[r];
    const rowObj: Record<string, string> = {};
    headers.forEach((headerKey, colIndex) => {
      rowObj[headerKey] = (rowValues[colIndex] ?? "").trim();
    });
    rows.push(rowObj);
  }

  return {
    format: "csv",
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Parses JSON arrays of vocabulary objects.
 */
export function parseJSON(jsonContent: string): ParsedFileResult {
  if (!jsonContent || !jsonContent.trim()) {
    return {
      format: "json",
      headers: [],
      rows: [],
      totalRows: 0,
      error: "The provided JSON file is empty.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    return {
      format: "json",
      headers: [],
      rows: [],
      totalRows: 0,
      error: `Invalid JSON syntax: ${err instanceof Error ? err.message : "Parse failed"}`,
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      format: "json",
      headers: [],
      rows: [],
      totalRows: 0,
      error: "JSON data must be an array of vocabulary objects.",
    };
  }

  if (parsed.length === 0) {
    return {
      format: "json",
      headers: [],
      rows: [],
      totalRows: 0,
      error: "The JSON array contains no records.",
    };
  }

  // Extract all unique keys across all items
  const headerSet = new Set<string>();
  parsed.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      Object.keys(item).forEach((k) => headerSet.add(normalizeHeaderName(k)));
    }
  });
  const headers = Array.from(headerSet);

  const rows: Record<string, string>[] = [];
  parsed.forEach((item) => {
    if (typeof item === "object" && item !== null) {
      const rowObj: Record<string, string> = {};
      const itemRecord = item as Record<string, unknown>;
      headers.forEach((h) => {
        const val = itemRecord[h] ?? itemRecord[camelCase(h)];
        if (Array.isArray(val)) {
          rowObj[h] = val.join("; ");
        } else if (val !== undefined && val !== null) {
          rowObj[h] = String(val).trim();
        } else {
          rowObj[h] = "";
        }
      });
      rows.push(rowObj);
    }
  });

  return {
    format: "json",
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Standard Schema Target Columns
 */
export const TARGET_COLUMNS = [
  { key: "word", label: "Word", required: true },
  { key: "part_of_speech", label: "Part of Speech", required: true },
  { key: "cefr_level", label: "CEFR Level (A1-B2/C2)", required: true },
  { key: "definition_en", label: "English Definition", required: true },
  { key: "definition_th", label: "Thai Definition / Translation", required: false },
  { key: "example_sentence", label: "Example Sentence", required: true },
  { key: "example_translation_th", label: "Example Translation (Thai)", required: false },
  { key: "phonetic_uk", label: "Phonetic (UK)", required: false },
  { key: "phonetic_us", label: "Phonetic (US)", required: false },
  { key: "audio_uk_url", label: "Audio URL (UK)", required: false },
  { key: "audio_us_url", label: "Audio URL (US)", required: false },
  { key: "image_url", label: "Image URL", required: false },
  { key: "image_alt", label: "Image Alt Text", required: false },
  { key: "topic", label: "Topic / Category", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "source_name", label: "Source Name", required: false },
  { key: "source_license", label: "Source License", required: false },
  { key: "is_locked", label: "Lock Status (ล็อคไม่ให้ถูกเขียนทับ)", required: false },
] as const;

export type TargetColumnKey = typeof TARGET_COLUMNS[number]["key"];

/**
 * Auto-detect best match mapping between input headers and target columns
 */
export function detectColumnMapping(headers: string[]): Record<TargetColumnKey, string> {
  const mapping: Record<string, string> = {};

  TARGET_COLUMNS.forEach((col) => {
    const target = col.key;
    const match = headers.find((h) => {
      const normalizedH = normalizeHeaderName(h);
      if (normalizedH === target) return true;
      if (normalizedH === camelCase(target)) return true;

      // Common aliases (English + Thai)
      if (target === "word" && (normalizedH === "vocabulary" || normalizedH === "term" || normalizedH === "vocab" || normalizedH === "คำ" || normalizedH === "คำศัพท์")) return true;
      if (target === "part_of_speech" && (normalizedH === "pos" || normalizedH === "partofspeech" || normalizedH === "part_speech" || normalizedH === "ชนิดคำ" || normalizedH === "หน้าที่คำ")) return true;
      if (target === "cefr_level" && (normalizedH === "level" || normalizedH === "cefr" || normalizedH === "ระดับ" || normalizedH === "ระดับcefr")) return true;
      if (target === "definition_en" && (normalizedH === "definition" || normalizedH === "meaning" || normalizedH === "meaning_en" || normalizedH === "eng_def" || normalizedH === "ความหมายอังกฤษ")) return true;
      if (target === "definition_th" && (normalizedH === "translation" || normalizedH === "meaning_th" || normalizedH === "thai" || normalizedH === "คำแปล" || normalizedH === "ความหมายไทย" || normalizedH === "แปล")) return true;
      if (target === "example_sentence" && (normalizedH === "example" || normalizedH === "sentence" || normalizedH === "ประโยค" || normalizedH === "ประโยคตัวอย่าง")) return true;
      if (target === "example_translation_th" && (normalizedH === "example_translation" || normalizedH === "example_th" || normalizedH === "sentence_th" || normalizedH === "แปลประโยค" || normalizedH === "คำแปลประโยค")) return true;
      if (target === "phonetic_uk" && (normalizedH === "uk_ipa" || normalizedH === "phoneticuk" || normalizedH === "ipa_uk")) return true;
      if (target === "phonetic_us" && (normalizedH === "us_ipa" || normalizedH === "phoneticus" || normalizedH === "ipa_us")) return true;
      if (target === "image_url" && (
        normalizedH === "image" ||
        normalizedH === "img" ||
        normalizedH === "imageurl" ||
        normalizedH === "image_link" ||
        normalizedH === "imagelink" ||
        normalizedH === "picture" ||
        normalizedH === "photo" ||
        normalizedH === "pic" ||
        normalizedH === "photo_url" ||
        normalizedH === "picture_url" ||
        normalizedH === "img_url" ||
        normalizedH === "link_image" ||
        normalizedH === "url_image" ||
        normalizedH === "รูป" ||
        normalizedH === "รูปภาพ" ||
        normalizedH === "ลิงก์รูป" ||
        normalizedH === "ภาพ" ||
        normalizedH === "ภาพประกอบ"
      )) return true;
      if (target === "image_alt" && (
        normalizedH === "alt" ||
        normalizedH === "alt_text" ||
        normalizedH === "image_description" ||
        normalizedH === "caption" ||
        normalizedH === "คำอธิบายรูป" ||
        normalizedH === "คำอธิบายภาพ"
      )) return true;
      if (target === "topic" && (normalizedH === "category" || normalizedH === "theme" || normalizedH === "หมวด" || normalizedH === "หมวดหมู่")) return true;
      if (target === "tags" && (normalizedH === "tag" || normalizedH === "แท็ก" || normalizedH === "ป้ายกำกับ")) return true;
      if (target === "source_name" && (normalizedH === "source" || normalizedH === "แหล่งที่มา")) return true;
      if (target === "source_license" && (normalizedH === "license" || normalizedH === "ลิขสิทธิ์")) return true;
      if (target === "is_locked" && (
        normalizedH === "is_locked" ||
        normalizedH === "islocked" ||
        normalizedH === "locked" ||
        normalizedH === "lock" ||
        normalizedH === "ล็อค" ||
        normalizedH === "ล็อคคำศัพท์" ||
        normalizedH === "สถานะล็อค" ||
        normalizedH === "ห้ามแก้"
      )) return true;

      return false;
    });

    mapping[target] = match || "";
  });

  return mapping as Record<TargetColumnKey, string>;
}

function normalizeHeaderName(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\w\u0E00-\u0E7F]/g, "");
}

function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
