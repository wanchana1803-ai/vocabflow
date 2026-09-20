/**
 * Image Provider Abstraction Types for VocabFlow
 */

export type PlaceholderCategory =
  | "person"
  | "place"
  | "object"
  | "action"
  | "emotion"
  | "abstract";

export type ImageCascadeStage = "db" | "provider" | "curated" | "placeholder";

export interface ImageSearchResult {
  imageUrl: string;
  thumbnailUrl: string;
  altText: string;
  creator?: string | null;
  creatorUrl?: string | null;
  sourceUrl?: string | null;
  sourceName: string; // e.g. 'Unsplash' | 'Pexels' | 'Curated' | 'Placeholder'
  license?: string | null;
  width?: number;
  height?: number;
  stage?: ImageCascadeStage;
  category?: PlaceholderCategory;
}

export interface ImageSearchQuery {
  word: string;
  definition?: string | null;
  partOfSpeech?: string | null;
  topic?: string | null;
  limit?: number;
  safeSearch?: boolean;
}

export interface ImageProvider {
  name: string;
  search(query: ImageSearchQuery): Promise<ImageSearchResult[]>;
}

export interface ImageSearchApiResponse {
  success: boolean;
  results: ImageSearchResult[];
  provider: string;
  cached: boolean;
  total?: number;
  error?: string | null;
}
