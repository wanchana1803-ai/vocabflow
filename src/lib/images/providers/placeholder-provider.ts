import { ImageProvider, ImageSearchQuery, ImageSearchResult } from "@/types/image-provider";
import { resolvePlaceholderCategory } from "../query-builder";
import { CORE_CATEGORY_STYLES } from "../fallback";

export class PlaceholderImageProvider implements ImageProvider {
  name = "Category Placeholder";

  async search(query: ImageSearchQuery): Promise<ImageSearchResult[]> {
    const category = resolvePlaceholderCategory(
      query.word,
      query.partOfSpeech,
      query.topic,
      query.definition
    );

    const style = CORE_CATEGORY_STYLES[category];

    const result: ImageSearchResult = {
      imageUrl: "", // Handled dynamically by VocabularyImage SVG illustration container
      thumbnailUrl: "",
      altText: `${style.nameTh} (${style.name}): ${style.symbolDescription} for "${query.word}"`,
      sourceName: "Category Placeholder",
      creator: "VocabFlow System",
      license: "Public Domain / CC0",
      stage: "placeholder",
      category,
    };

    return [result];
  }
}
