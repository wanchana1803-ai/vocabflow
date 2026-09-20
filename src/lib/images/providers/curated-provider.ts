import { ImageProvider, ImageSearchQuery, ImageSearchResult } from "@/types/image-provider";
import { resolvePlaceholderCategory } from "../query-builder";
import { searchCuratedLibrary } from "../curated-library";
import { getAutomaticImageForWord } from "../auto-matcher";

export class CuratedImageProvider implements ImageProvider {
  name = "Curated Library";

  async search(query: ImageSearchQuery): Promise<ImageSearchResult[]> {
    const category = resolvePlaceholderCategory(
      query.word,
      query.partOfSpeech,
      query.topic,
      query.definition
    );

    const limit = query.limit || 6;
    const results = searchCuratedLibrary(query.word, category, limit);

    if (results.length > 0) {
      return results.map((res) => ({
        ...res,
        category,
        stage: "curated" as const,
      }));
    }

    // High-resolution semantic automatic matching fallback
    const auto = getAutomaticImageForWord(
      query.word,
      query.partOfSpeech,
      query.topic,
      query.definition
    );

    return [
      {
        imageUrl: auto.imageUrl,
        thumbnailUrl: auto.imageUrl,
        altText: auto.imageAlt,
        creator: auto.creator,
        creatorUrl: auto.creatorUrl,
        sourceName: auto.sourceName,
        license: auto.sourceLicense,
        stage: "curated" as const,
        category,
      },
    ];
  }
}

