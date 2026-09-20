import { PlaceholderCategory } from "@/types/image-provider";
import { resolvePlaceholderCategory } from "./query-builder";

export interface CategoryFallbackStyle {
  id: PlaceholderCategory;
  name: string;
  nameTh: string;
  bg: string;
  accent: string;
  iconName: string;
  symbolDescription: string;
}

/**
 * The 6 Core Category Fallback Styles with curated visual palettes and iconography
 */
export const CORE_CATEGORY_STYLES: Record<PlaceholderCategory, CategoryFallbackStyle> = {
  person: {
    id: "person",
    name: "Person & Identity",
    nameTh: "บุคคลและตัวตน",
    bg: "from-blue-600/20 via-indigo-600/15 to-violet-700/25",
    accent: "text-blue-500",
    iconName: "user",
    symbolDescription: "Human figure & community silhouette",
  },
  place: {
    id: "place",
    name: "Place & Environment",
    nameTh: "สถานที่และสิ่งแวดล้อม",
    bg: "from-emerald-600/20 via-teal-600/15 to-cyan-700/25",
    accent: "text-emerald-500",
    iconName: "compass",
    symbolDescription: "Compass & mountain horizon",
  },
  object: {
    id: "object",
    name: "Object & Items",
    nameTh: "สิ่งของและวัตถุ",
    bg: "from-amber-600/20 via-orange-600/15 to-yellow-700/25",
    accent: "text-amber-500",
    iconName: "package",
    symbolDescription: "Geometric tool & structure",
  },
  action: {
    id: "action",
    name: "Action & Motion",
    nameTh: "การกระทำและการเคลื่อนไหว",
    bg: "from-rose-600/20 via-red-600/15 to-orange-700/25",
    accent: "text-rose-500",
    iconName: "zap",
    symbolDescription: "Dynamic energy wave & movement",
  },
  emotion: {
    id: "emotion",
    name: "Emotion & Feeling",
    nameTh: "อารมณ์และความรู้สึก",
    bg: "from-pink-600/20 via-rose-600/15 to-purple-700/25",
    accent: "text-pink-500",
    iconName: "heart",
    symbolDescription: "Heart radiance & empathy warmth",
  },
  abstract: {
    id: "abstract",
    name: "Abstract Concept",
    nameTh: "มโนทัศน์เชิงนามธรรม",
    bg: "from-violet-600/20 via-purple-600/15 to-fuchsia-700/25",
    accent: "text-violet-500",
    iconName: "sparkles",
    symbolDescription: "Prism of light, clarity & thought balance",
  },
};

/**
 * Legacy category fallback map for compatibility with existing components
 */
export const CATEGORY_FALLBACK_STYLES: Record<string, { bg: string; iconName: string }> = {
  learning: { bg: "from-emerald-500/20 to-teal-600/20", iconName: "book-open" },
  education: { bg: "from-emerald-500/20 to-teal-600/20", iconName: "graduation-cap" },
  travel: { bg: "from-sky-500/20 to-indigo-600/20", iconName: "compass" },
  emotions: { bg: "from-amber-500/20 to-rose-600/20", iconName: "heart" },
  mindset: { bg: "from-purple-500/20 to-violet-600/20", iconName: "sparkles" },
  achievement: { bg: "from-yellow-500/20 to-amber-600/20", iconName: "trophy" },
  success: { bg: "from-yellow-500/20 to-amber-600/20", iconName: "trophy" },
  communication: { bg: "from-blue-500/20 to-cyan-600/20", iconName: "message-circle" },
  actions: { bg: "from-orange-500/20 to-amber-600/20", iconName: "zap" },
  business: { bg: "from-slate-500/20 to-zinc-600/20", iconName: "briefcase" },
  general: { bg: "from-teal-500/20 to-emerald-600/20", iconName: "layers" },
  food: { bg: "from-red-500/20 to-orange-600/20", iconName: "apple" },
  nature: { bg: "from-green-500/20 to-emerald-600/20", iconName: "globe" },
  personal: { bg: "from-pink-500/20 to-rose-600/20", iconName: "smile" },
  qualities: { bg: "from-indigo-500/20 to-purple-600/20", iconName: "palette" },
  default: { bg: "from-teal-500/20 to-emerald-600/20", iconName: "layers" },
};

export function getCategoryFallback(topic?: string | null) {
  if (!topic) return CATEGORY_FALLBACK_STYLES.default;
  const normalized = topic.toLowerCase();
  for (const key of Object.keys(CATEGORY_FALLBACK_STYLES)) {
    if (normalized.includes(key)) {
      return CATEGORY_FALLBACK_STYLES[key];
    }
  }
  return CATEGORY_FALLBACK_STYLES.default;
}

/**
 * Primary 6-category fallback resolver
 */
export function getCoreCategoryFallback(
  word: string,
  partOfSpeech?: string | null,
  topic?: string | null,
  definition?: string | null
): CategoryFallbackStyle {
  const category = resolvePlaceholderCategory(word, partOfSpeech, topic, definition);
  return CORE_CATEGORY_STYLES[category] || CORE_CATEGORY_STYLES.abstract;
}
