/**
 * In-Memory Audio Cache for Server-Side TTS (Prompt 6)
 */

interface CacheEntry {
  buffer: ArrayBuffer;
  mimeType: string;
  timestamp: number;
}

const MAX_CACHE_ENTRIES = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const audioCache = new Map<string, CacheEntry>();

export function getAudioCacheKey(word: string, accent: string, provider: string): string {
  return `${provider}:${accent.toUpperCase()}:${word.trim().toLowerCase()}`;
}

export function getCachedAudio(key: string): { buffer: ArrayBuffer; mimeType: string } | null {
  const entry = audioCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    audioCache.delete(key);
    return null;
  }

  return { buffer: entry.buffer, mimeType: entry.mimeType };
}

export function setCachedAudio(key: string, buffer: ArrayBuffer, mimeType: string): void {
  // Prune oldest if exceeds capacity
  if (audioCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }

  audioCache.set(key, {
    buffer,
    mimeType,
    timestamp: Date.now(),
  });
}

export function clearAudioCache(): void {
  audioCache.clear();
}
