import { ImageSearchResult } from "@/types/image-provider";

const CACHE_KEY = "vocabflow_image_cache";
const MEMORY_CACHE = new Map<string, ImageSearchResult[]>();

export interface ClientImageCacheData {
  [queryKey: string]: {
    results: ImageSearchResult[];
    savedAt: number;
  };
}

/**
 * Normalizes query string for client caching
 */
export function createClientCacheKey(word: string, pos?: string | null, topic?: string | null): string {
  return `${word.toLowerCase().trim()}|${(pos || "").toLowerCase()}|${(topic || "").toLowerCase()}`;
}

/**
 * Gets cached search results from Memory or LocalStorage
 */
export function getClientCachedImages(key: string): ImageSearchResult[] | null {
  // Check memory cache first
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key) || null;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const store: ClientImageCacheData = JSON.parse(raw);
    const entry = store[key];
    if (entry && Array.isArray(entry.results)) {
      MEMORY_CACHE.set(key, entry.results);
      return entry.results;
    }
  } catch {
    // Ignore parse / storage errors
  }

  return null;
}

/**
 * Stores search results into Memory and LocalStorage
 */
export function setClientCachedImages(key: string, results: ImageSearchResult[]): void {
  MEMORY_CACHE.set(key, results);

  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const store: ClientImageCacheData = raw ? JSON.parse(raw) : {};
    store[key] = {
      results,
      savedAt: Date.now(),
    };
    // Keep max 100 entries to avoid overflowing localStorage
    const keys = Object.keys(store);
    if (keys.length > 100) {
      delete store[keys[0]];
    }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Storage quota or permission error
  }
}
