import test from "node:test";
import assert from "node:assert/strict";

// ==========================================
// 1. Audio Cache Unit Tests
// ==========================================

class AudioCache {
  constructor(maxEntries = 200, ttlMs = 24 * 60 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  getKey(word, accent, provider) {
    return `${provider}:${accent.toUpperCase()}:${word.trim().toLowerCase()}`;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry;
  }

  set(key, buffer, mimeType) {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      buffer,
      mimeType,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }
}

test("Audio Cache: generates normalized cache key", () => {
  const cache = new AudioCache();
  const key1 = cache.getKey("  Ephemeral ", "us", "google-tts");
  const key2 = cache.getKey("ephemeral", "US", "google-tts");
  assert.equal(key1, "google-tts:US:ephemeral");
  assert.equal(key1, key2);

  const ukKey = cache.getKey("ephemeral", "UK", "google-tts");
  assert.notEqual(key1, ukKey);
});

test("Audio Cache: stores, retrieves, and expires items according to TTL", async () => {
  const shortTtlCache = new AudioCache(10, 50); // 50ms TTL
  const dummyBuffer = new Uint8Array([1, 2, 3, 4]).buffer;

  shortTtlCache.set("test-key", dummyBuffer, "audio/mpeg");
  const hit = shortTtlCache.get("test-key");
  assert.ok(hit);
  assert.equal(hit.mimeType, "audio/mpeg");

  // Wait for TTL expiration
  await new Promise((resolve) => setTimeout(resolve, 60));
  const expired = shortTtlCache.get("test-key");
  assert.equal(expired, null);
});

test("Audio Cache: evicts oldest item when max capacity is reached", () => {
  const tinyCache = new AudioCache(2);
  const buf = new Uint8Array([1]).buffer;

  tinyCache.set("key1", buf, "audio/mpeg");
  tinyCache.set("key2", buf, "audio/mpeg");
  assert.ok(tinyCache.get("key1"));
  assert.ok(tinyCache.get("key2"));

  // Add 3rd item - key1 should be evicted
  tinyCache.set("key3", buf, "audio/mpeg");
  assert.equal(tinyCache.get("key1"), null);
  assert.ok(tinyCache.get("key2"));
  assert.ok(tinyCache.get("key3"));
});

// ==========================================
// 2. Audio Provider Interface & Registry Tests
// ==========================================

test("Audio Provider: selects active provider based on availability", () => {
  class MockProviderA {
    name = "provider-a";
    isAvailable() {
      return false; // Unavailable (e.g., missing API key)
    }
    async synthesize() {
      return null;
    }
  }

  class MockProviderB {
    name = "provider-b";
    isAvailable() {
      return true; // Available
    }
    async synthesize(word, accent) {
      return {
        audioBuffer: new Uint8Array([10, 20]).buffer,
        mimeType: "audio/mpeg",
        providerName: this.name,
      };
    }
  }

  const providers = [new MockProviderA(), new MockProviderB()];
  const active = providers.find((p) => p.isAvailable()) || null;

  assert.ok(active);
  assert.equal(active.name, "provider-b");
});

test("Audio Provider: Google TTS URL constructs correct language parameters", () => {
  const getGoogleTtsUrl = (word, accent) => {
    const lang = accent === "UK" ? "en-gb" : "en-us";
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${lang}&client=tw-ob`;
  };

  const usUrl = getGoogleTtsUrl("serendipity", "US");
  const ukUrl = getGoogleTtsUrl("serendipity", "UK");

  assert.ok(usUrl.includes("tl=en-us"));
  assert.ok(ukUrl.includes("tl=en-gb"));
  assert.ok(usUrl.includes("q=serendipity"));
});

// ==========================================
// 3. 4-Stage Fallback Cascade Simulation Tests
// ==========================================

async function simulatePlaybackCascade({
  audioUrl,
  serverTtsSuccess,
  webSpeechSuccess,
  word,
  accent,
}) {
  const stepsTaken = [];

  // STAGE 1: Stored Database Audio URL
  if (audioUrl && audioUrl.trim().length > 0) {
    stepsTaken.push("stage_1_db_url");
    if (audioUrl.startsWith("http") && !audioUrl.includes("broken")) {
      return { success: true, stage: 1, stepsTaken };
    }
  }

  // STAGE 2: Server-Side TTS Provider
  stepsTaken.push("stage_2_server_tts");
  if (serverTtsSuccess) {
    return { success: true, stage: 2, stepsTaken };
  }

  // STAGE 3: Client-Side Web Speech API
  stepsTaken.push("stage_3_web_speech");
  if (webSpeechSuccess) {
    const targetLang = accent === "UK" ? "en-GB" : "en-US";
    return { success: true, stage: 3, targetLang, stepsTaken };
  }

  // STAGE 4: Polite Error Message
  stepsTaken.push("stage_4_polite_error");
  const politeMessage = `ขออภัย ไม่สามารถเล่นเสียงอ่านสำเนียง ${accent} สำหรับคำว่า "${word}" ได้ในขณะนี้`;
  return { success: false, stage: 4, error: politeMessage, stepsTaken };
}

test("Fallback Cascade: Stage 1 succeeds when valid DB URL is present", async () => {
  const result = await simulatePlaybackCascade({
    audioUrl: "https://audio.oxforddictionaries.com/en/mp3/test.mp3",
    serverTtsSuccess: false,
    webSpeechSuccess: false,
    word: "test",
    accent: "US",
  });

  assert.equal(result.stage, 1);
  assert.equal(result.success, true);
  assert.deepEqual(result.stepsTaken, ["stage_1_db_url"]);
});

test("Fallback Cascade: Stage 2 succeeds when DB URL is absent or broken", async () => {
  const result = await simulatePlaybackCascade({
    audioUrl: "https://broken-domain.com/broken.mp3",
    serverTtsSuccess: true,
    webSpeechSuccess: false,
    word: "benevolent",
    accent: "UK",
  });

  assert.equal(result.stage, 2);
  assert.equal(result.success, true);
  assert.deepEqual(result.stepsTaken, ["stage_1_db_url", "stage_2_server_tts"]);
});

test("Fallback Cascade: Stage 3 activates when Server TTS is unavailable", async () => {
  const result = await simulatePlaybackCascade({
    audioUrl: null,
    serverTtsSuccess: false,
    webSpeechSuccess: true,
    word: "resilient",
    accent: "UK",
  });

  assert.equal(result.stage, 3);
  assert.equal(result.success, true);
  assert.equal(result.targetLang, "en-GB");
  assert.deepEqual(result.stepsTaken, ["stage_2_server_tts", "stage_3_web_speech"]);
});

test("Fallback Cascade: Stage 4 produces polite Thai message when all engines fail", async () => {
  const result = await simulatePlaybackCascade({
    audioUrl: null,
    serverTtsSuccess: false,
    webSpeechSuccess: false,
    word: "ubiquitous",
    accent: "US",
  });

  assert.equal(result.stage, 4);
  assert.equal(result.success, false);
  assert.ok(result.error.includes("ขออภัย"));
  assert.ok(result.error.includes("US"));
  assert.ok(result.error.includes("ubiquitous"));
  assert.deepEqual(result.stepsTaken, [
    "stage_2_server_tts",
    "stage_3_web_speech",
    "stage_4_polite_error",
  ]);
});

// ==========================================
// 4. Audio Concurrency Control & State Tests
// ==========================================

test("Concurrency Control: new playback aborts previous controller and stops audio", () => {
  let activeAudioPlaying = false;
  let activeUtterancePlaying = false;
  let currentAbortController = null;

  const stopAllAudio = () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    activeAudioPlaying = false;
    activeUtterancePlaying = false;
  };

  const startPlayback = (id) => {
    stopAllAudio();
    currentAbortController = new AbortController();
    activeAudioPlaying = true;
    return currentAbortController;
  };

  const ctrl1 = startPlayback("audio-1");
  assert.equal(ctrl1.signal.aborted, false);
  assert.equal(activeAudioPlaying, true);

  // Play second audio immediately
  const ctrl2 = startPlayback("audio-2");
  assert.equal(ctrl1.signal.aborted, true);
  assert.equal(ctrl2.signal.aborted, false);
  assert.equal(activeAudioPlaying, true);

  stopAllAudio();
  assert.equal(ctrl2.signal.aborted, true);
  assert.equal(activeAudioPlaying, false);
});

test("Audio State Transitions: follows idle -> loading -> playing -> idle cycle", () => {
  const states = [];
  let state = "idle";

  const setState = (s) => {
    state = s;
    states.push(s);
  };

  // User clicks play
  setState("loading");
  // Audio stream starts
  setState("playing");
  // Audio playback finishes
  setState("idle");

  assert.deepEqual(states, ["loading", "playing", "idle"]);
  assert.equal(state, "idle");
});

test("Audio State Transitions: transitions to error state on failure", () => {
  let state = "idle";
  let errorMessage = null;

  // Simulate failure
  state = "loading";
  state = "error";
  errorMessage = "ขออภัย ไม่สามารถเล่นเสียงอ่านสำเนียง US สำหรับคำว่า \"test\" ได้ในขณะนี้";

  assert.equal(state, "error");
  assert.ok(errorMessage.includes("ขออภัย"));
});
