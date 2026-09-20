import { ImageProvider, ImageSearchQuery, ImageSearchResult } from "@/types/image-provider";
import { buildSemanticSearchQuery } from "../query-builder";

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description?: string | null;
  description?: string | null;
  width: number;
  height: number;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export class UnsplashImageProvider implements ImageProvider {
  name = "Unsplash";

  async search(query: ImageSearchQuery): Promise<ImageSearchResult[]> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return [];
    }

    const searchQuery = buildSemanticSearchQuery(query);
    const limit = query.limit || 6;
    const safeSearch = query.safeSearch ?? true;

    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("orientation", "landscape");
    if (safeSearch) {
      url.searchParams.set("content_filter", "high");
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
        // Cache external requests appropriately on Next.js server
        next: { revalidate: 86400 },
      });

      if (!response.ok) {
        console.warn(`[UnsplashProvider] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data: UnsplashSearchResponse = await response.json();
      const utm = "?utm_source=vocabflow&utm_medium=referral";

      return (data.results || []).map((photo) => ({
        imageUrl: photo.urls.regular,
        thumbnailUrl: photo.urls.small || photo.urls.thumb,
        altText: photo.alt_description || photo.description || `Photo representing ${query.word}`,
        creator: photo.user.name,
        creatorUrl: `${photo.user.links.html}${utm}`,
        sourceUrl: `${photo.links.html}${utm}`,
        sourceName: "Unsplash",
        license: "Unsplash License",
        width: photo.width,
        height: photo.height,
        stage: "provider" as const,
      }));
    } catch (err) {
      console.error("[UnsplashProvider] Fetch error:", err);
      return [];
    }
  }
}
