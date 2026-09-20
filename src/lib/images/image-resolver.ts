import { PlaceholderCategory } from "@/types/image-provider";
import { VocabularyWord } from "@/types/vocabulary";
import { resolvePlaceholderCategory } from "./query-builder";
import { searchCuratedLibrary } from "./curated-library";
import { getClientCachedImages, setClientCachedImages, createClientCacheKey } from "./cache";
import { getAutomaticImageForWord } from "./auto-matcher";

export interface ResolvedImageResult {
  imageUrl: string;
  thumbnailUrl: string;
  altText: string;
  creator?: string | null;
  creatorUrl?: string | null;
  sourceUrl?: string | null;
  sourceName: string;
  license?: string | null;
  stage: "db" | "provider" | "curated" | "placeholder";
  category: PlaceholderCategory;
}

/**
 * 4-Stage Selection Cascade Engine
 * 1. Saved DB / Record image_url
 * 2. Active Image Provider (Unsplash/Pexels via API)
 * 3. Curated Local Library
 * 4. Category Fallback Placeholder
 */
export async function resolveWordImageCascade(
  word: VocabularyWord,
  options: {
    allowNetwork?: boolean;
    providerOverride?: string;
  } = {}
): Promise<ResolvedImageResult> {
  const category = resolvePlaceholderCategory(
    word.word,
    word.partOfSpeech || word.part_of_speech,
    word.topic,
    word.definition || word.definition_en
  );

  const existingUrl = word.imageUrl || word.image_url;

  // --- STAGE 1: Saved DB Image ---
  if (existingUrl && existingUrl.trim() !== "") {
    return {
      imageUrl: existingUrl.trim(),
      thumbnailUrl: existingUrl.trim(),
      altText: word.imageAlt || word.image_alt || `Image for ${word.word}`,
      creator: word.source || word.sourceName || word.source_name || null,
      sourceName: word.source || word.sourceName || word.source_name || "Database Record",
      license: word.license || word.sourceLicense || word.source_license || null,
      stage: "db",
      category,
    };
  }

  const cacheKey = createClientCacheKey(
    word.word,
    word.partOfSpeech || word.part_of_speech,
    word.topic
  );

  // Check client cache before network
  const cachedResults = getClientCachedImages(cacheKey);
  if (cachedResults && cachedResults.length > 0) {
    const first = cachedResults[0];
    return {
      imageUrl: first.imageUrl,
      thumbnailUrl: first.thumbnailUrl,
      altText: first.altText,
      creator: first.creator,
      creatorUrl: first.creatorUrl,
      sourceUrl: first.sourceUrl,
      sourceName: first.sourceName,
      license: first.license,
      stage: (first.stage as ResolvedImageResult["stage"]) || "provider",
      category,
    };
  }

  // --- STAGE 2: Configured Image Provider (via API route) ---
  if (options.allowNetwork !== false && typeof window !== "undefined") {
    try {
      const url = new URL("/api/images/search", window.location.origin);
      url.searchParams.set("word", word.word);
      if (word.definition || word.definition_en) {
        url.searchParams.set("definition", (word.definition || word.definition_en)!);
      }
      if (word.partOfSpeech || word.part_of_speech) {
        url.searchParams.set("partOfSpeech", (word.partOfSpeech || word.part_of_speech)!);
      }
      if (word.topic) {
        url.searchParams.set("topic", word.topic);
      }
      if (options.providerOverride) {
        url.searchParams.set("provider", options.providerOverride);
      }

      const res = await fetch(url.toString(), { cache: "default" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results) && data.results.length > 0) {
          setClientCachedImages(cacheKey, data.results);
          const topResult = data.results[0];
          return {
            imageUrl: topResult.imageUrl,
            thumbnailUrl: topResult.thumbnailUrl,
            altText: topResult.altText,
            creator: topResult.creator,
            creatorUrl: topResult.creatorUrl,
            sourceUrl: topResult.sourceUrl,
            sourceName: topResult.sourceName,
            license: topResult.license,
            stage: "provider",
            category,
          };
        }
      }
    } catch (err) {
      console.warn("[resolveWordImageCascade] Network search skipped:", err);
    }
  }

  // --- STAGE 3: Curated Local Library ---
  const curatedResults = searchCuratedLibrary(word.word, category, 1);
  if (curatedResults.length > 0) {
    const cur = curatedResults[0];
    return {
      imageUrl: cur.imageUrl,
      thumbnailUrl: cur.thumbnailUrl,
      altText: cur.altText,
      creator: cur.creator,
      creatorUrl: cur.creatorUrl,
      sourceUrl: cur.sourceUrl,
      sourceName: cur.sourceName,
      license: cur.license,
      stage: "curated",
      category,
    };
  }

  // --- STAGE 4: Automated Semantic Fallback Image ---
  const auto = getAutomaticImageForWord(
    word.word,
    word.partOfSpeech || word.part_of_speech,
    word.topic,
    word.definition || word.definition_en
  );

  return {
    imageUrl: auto.imageUrl,
    thumbnailUrl: auto.imageUrl,
    altText: auto.imageAlt,
    creator: auto.creator,
    creatorUrl: auto.creatorUrl,
    sourceName: auto.sourceName,
    license: auto.sourceLicense,
    stage: "placeholder",
    category,
  };
}
