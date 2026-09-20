import test from "node:test";
import assert from "node:assert/strict";

// Pure CSV RFC 4180 parser testing
function parseCSV(csvContent) {
  if (!csvContent || !csvContent.trim()) {
    return { headers: [], rows: [] };
  }

  const rawRows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  const len = csvContent.length;
  for (let i = 0; i < len; i++) {
    const char = csvContent[i];
    const nextChar = i + 1 < len ? csvContent[i + 1] : "";

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((val) => val.trim().length > 0)) {
        rawRows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((val) => val.trim().length > 0)) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length === 0) return { headers: [], rows: [] };

  const headers = rawRows[0].map((h) => h.trim().toLowerCase().replace(/[^\w]/g, ""));
  const rows = [];
  for (let r = 1; r < rawRows.length; r++) {
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = (rawRows[r][idx] ?? "").trim();
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

test("Parser: parses basic CSV rows correctly", () => {
  const csv = "word,part_of_speech,cefr_level\npersist,verb,B2\nclarity,noun,B2";
  const result = parseCSV(csv);

  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].word, "persist");
  assert.equal(result.rows[0].part_of_speech, "verb");
  assert.equal(result.rows[1].word, "clarity");
});

test("Parser: handles commas inside quotes (RFC 4180)", () => {
  const csv = 'word,definition_en\nresilient,"Able to withstand, adapt, and recover"';
  const result = parseCSV(csv);

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].word, "resilient");
  assert.equal(result.rows[0].definition_en, "Able to withstand, adapt, and recover");
});

test("Parser: handles escaped quotes inside quotes", () => {
  const csv = 'word,example_sentence\ncurious,"She said, ""I am very curious!"""';
  const result = parseCSV(csv);

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].example_sentence, 'She said, "I am very curious!"');
});
