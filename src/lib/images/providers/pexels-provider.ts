import { ImageProvider, ImageSearchQuery, ImageSearchResult } from "@/types/image-provider";
import { buildSemanticSearchQuery } from "../query-builder";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

export class PexelsImageProvider implements ImageProvider {
  name = "Pexels";

  async search(query: ImageSearchQuery): Promise<ImageSearchResult[]> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return [];
    }

    const searchQuery = buildSemanticSearchQuery(query);
    const limit = query.limit || 6;

    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("orientation", "landscape");

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: apiKey,
        },
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        console.warn(`[PexelsProvider] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data: PexelsSearchResponse = await response.json();

      return (data.photos || []).map((photo) => ({
        imageUrl: photo.src.large || photo.src.medium,
        thumbnailUrl: photo.src.medium || photo.src.small,
        altText: photo.alt || `Photo representing ${query.word}`,
        creator: photo.photographer,
        creatorUrl: photo.photographer_url,
        sourceUrl: photo.url,
        sourceName: "Pexels",
        license: "Pexels License",
        width: photo.width,
        height: photo.height,
        stage: "provider" as const,
      }));
    } catch (err) {
      console.error("[PexelsProvider] Fetch error:", err);
      return [];
    }
  }
}
