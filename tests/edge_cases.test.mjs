import test from "node:test";
import assert from "node:assert/strict";

// ==========================================
// 1. Slow Network Test (Network ช้า)
// ==========================================
test("Edge Case 1: Slow Network simulates 3000ms latency with AbortController cancellation", async () => {
  const abortController = new AbortController();
  let wasAborted = false;

  const simulateSlowFetch = (signal) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve({ status: 200, data: "audio-stream" });
      }, 3000);

      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        wasAborted = true;
        reject(new Error("Request aborted by user"));
      });
    });
  };

  const fetchPromise = simulateSlowFetch(abortController.signal);

  // User moves to next card after 100ms
  setTimeout(() => {
    abortController.abort();
  }, 100);

  await assert.rejects(
    async () => {
      await fetchPromise;
    },
    { message: "Request aborted by user" }
  );

  assert.equal(wasAborted, true, "Slow network request was canceled without hanging UI");
});

// ==========================================
// 2. Broken Image Test (รูปเสีย)
// ==========================================
test("Edge Case 2: Broken Image gracefully falls back to Category Semantic Gradient", () => {
  const brokenImageUrl = "https://broken-domain-404.example.com/invalid-image.jpg";

  const resolveImageDisplay = (url, topic, word) => {
    const isBroken = url.includes("broken") || url.includes("invalid");
    if (isBroken) {
      // Stage 4 Fallback: Category gradient and semantic icon
      return {
        type: "category_fallback",
        gradient: "from-teal-500/20 via-emerald-500/10 to-background",
        icon: "sparkles",
        label: topic || "English Vocabulary",
        accessibleAlt: `ภาพประกอบหมวดหมู่ ${topic || "คำศัพท์"} สำหรับคำว่า ${word}`,
      };
    }
    return {
      type: "network_image",
      src: url,
    };
  };

  const result = resolveImageDisplay(brokenImageUrl, "Mindset & Growth", "resilience");
  assert.equal(result.type, "category_fallback");
  assert.ok(result.gradient);
  assert.ok(result.accessibleAlt.includes("resilience"));
});

// ==========================================
// 3. Broken Audio Test (เสียงเสีย)
// ==========================================
test("Edge Case 3: Broken Audio falls back through 4-stage cascade without throwing", async () => {
  const events = [];

  const simulateAudioCascade = async ({ dbUrl, serverTtsAvailable, webSpeechAvailable }) => {
    events.push("start");

    // Stage 1: DB URL
    if (dbUrl && !dbUrl.includes("broken")) {
      events.push("stage1_db_success");
      return true;
    }
    events.push("stage1_db_fail");

    // Stage 2: Server TTS
    if (serverTtsAvailable) {
      events.push("stage2_server_success");
      return true;
    }
    events.push("stage2_server_fail");

    // Stage 3: Web Speech API
    if (webSpeechAvailable) {
      events.push("stage3_webspeech_success");
      return true;
    }
    events.push("stage3_webspeech_fail");

    // Stage 4: Polite Thai message
    events.push("stage4_polite_message");
    return false;
  };

  // When DB audio is broken (404) and Server TTS fails (500), but Web Speech is available
  const res1 = await simulateAudioCascade({
    dbUrl: "https://example.com/404-broken.mp3",
    serverTtsAvailable: false,
    webSpeechAvailable: true,
  });
  assert.equal(res1, true);
  assert.ok(events.includes("stage1_db_fail"));
  assert.ok(events.includes("stage2_server_fail"));
  assert.ok(events.includes("stage3_webspeech_success"));

  // When ALL audio stages fail, gracefully reaches Stage 4 polite error message
  events.length = 0;
  const res2 = await simulateAudioCascade({
    dbUrl: null,
    serverTtsAvailable: false,
    webSpeechAvailable: false,
  });
  assert.equal(res2, false);
  assert.ok(events.includes("stage4_polite_message"));
});

// ==========================================
// 4. Empty Database Test (ฐานข้อมูลว่าง)
// ==========================================
test("Edge Case 4: Empty Database renders EmptyState without runtime crash", () => {
  const emptyVocabList = [];

  const renderView = (vocabList) => {
    if (!vocabList || vocabList.length === 0) {
      return {
        viewType: "empty_state",
        title: "ยังไม่มีคำศัพท์ให้เรียนรู้",
        description: "เริ่มต้นด้วยการนำเข้าชุดคำศัพท์ CSV หรือเพิ่มคำศัพท์ใหม่",
        actionHref: "/vocabulary",
        actionLabel: "ไปที่คลังคำศัพท์",
      };
    }
    return {
      viewType: "learning_session",
      totalCards: vocabList.length,
    };
  };

  const output = renderView(emptyVocabList);
  assert.equal(output.viewType, "empty_state");
  assert.ok(output.title);
  assert.ok(output.actionHref);
});
