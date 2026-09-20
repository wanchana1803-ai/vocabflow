import { ImageSearchResult, PlaceholderCategory } from "@/types/image-provider";

export interface CuratedImageItem extends ImageSearchResult {
  keywords: string[];
  category: PlaceholderCategory;
}

/**
 * Curated High-Quality Royalty-Free Images with Full Attribution
 * Uses vetted CDN images from Unsplash (Unsplash License)
 */
export const CURATED_IMAGE_LIBRARY: CuratedImageItem[] = [
  // --- ABSTRACT CONCEPTS (Symbolic Visual Metaphors) ---
  {
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=70",
    altText: "Pristine clear sea and horizon representing clarity and peace",
    creator: "Sean Oulashin",
    creatorUrl: "https://unsplash.com/@oulashin",
    sourceUrl: "https://unsplash.com/photos/KMn4VEeEPR8",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["clarity", "peace", "horizon", "calm", "pure", "sea", "ocean", "clear", "open"],
    category: "abstract",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=300&q=70",
    altText: "Sunlight filtering through forest canopy symbolizing serendipity and discovery",
    creator: "Luca Bravo",
    creatorUrl: "https://unsplash.com/@lucabravo",
    sourceUrl: "https://unsplash.com/photos/ESkw2ayO2As",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["serendipity", "discovery", "luck", "sunlight", "forest", "nature", "path", "hope"],
    category: "abstract",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=70",
    altText: "Misty forest path symbolizing ambiguity and the unknown journey",
    creator: "Sebastian Unrau",
    creatorUrl: "https://unsplash.com/@sebastian_unrau",
    sourceUrl: "https://unsplash.com/photos/CoD2QtuKcEk",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["ambiguity", "mystery", "mist", "forest", "fog", "journey", "unknown", "uncertainty"],
    category: "abstract",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=70",
    altText: "Sprout growing tenaciously representing resilience and endurance",
    creator: "Egor Kamelev",
    creatorUrl: "https://unsplash.com/@ekamelev",
    sourceUrl: "https://unsplash.com/photos/gG0sT1q4nVo",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["resilience", "growth", "endurance", "sprout", "plant", "strength", "perseverance", "life"],
    category: "abstract",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=300&q=70",
    altText: "Morning sunrise over rolling hills representing freedom and new beginnings",
    creator: "Dawid Zawiła",
    creatorUrl: "https://unsplash.com/@dawidzb",
    sourceUrl: "https://unsplash.com/photos/-G3rw6Y02D0",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["freedom", "horizon", "morning", "sunrise", "open", "sky", "hill", "beginning"],
    category: "abstract",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=300&q=70",
    altText: "Collaborative teamwork hands joined representing cooperation and unity",
    creator: "Priscilla Du Preez",
    creatorUrl: "https://unsplash.com/@priscilladupreez",
    sourceUrl: "https://unsplash.com/photos/nF8xhLMmg0c",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["cooperation", "team", "hands", "unity", "collaboration", "work", "together", "community"],
    category: "action",
    stage: "curated",
  },

  // --- PERSON & IDENTITY ---
  {
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=70",
    altText: "Thoughtful portrait representing individual identity and person",
    creator: "Aiony Haust",
    creatorUrl: "https://unsplash.com/@aiony",
    sourceUrl: "https://unsplash.com/photos/3TLl_97HNJo",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["person", "people", "portrait", "woman", "human", "face", "individual", "identity"],
    category: "person",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=70",
    altText: "Group of colleagues discussing and learning together",
    creator: "Annie Spratt",
    creatorUrl: "https://unsplash.com/@anniespratt",
    sourceUrl: "https://unsplash.com/photos/QckxruozjRg",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["people", "students", "team", "colleagues", "teacher", "learning", "discussion"],
    category: "person",
    stage: "curated",
  },

  // --- PLACE & ENVIRONMENT ---
  {
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=70",
    altText: "Modern skyscraper architecture representing city and urban place",
    creator: "Sean Pollock",
    creatorUrl: "https://unsplash.com/@seanpollock",
    sourceUrl: "https://unsplash.com/photos/PhYq704ffdA",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["place", "city", "building", "architecture", "urban", "sky", "modern", "location"],
    category: "place",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=70",
    altText: "Vast serene mountain wilderness representing travel and nature place",
    creator: "David Marcu",
    creatorUrl: "https://unsplash.com/@davidmarcu",
    sourceUrl: "https://unsplash.com/photos/78A265wPiO4",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["place", "nature", "mountain", "travel", "landscape", "adventure", "outdoors"],
    category: "place",
    stage: "curated",
  },

  // --- OBJECT & ITEMS ---
  {
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=70",
    altText: "Stack of books and study materials representing books and education objects",
    creator: "Kimberly Farmer",
    creatorUrl: "https://unsplash.com/@kimberlyfarmer",
    sourceUrl: "https://unsplash.com/photos/lUaaKCUANVI",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["object", "book", "library", "education", "study", "learning", "knowledge", "item"],
    category: "object",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=70",
    altText: "Modern laptop, desk tools and gadgets representing technology objects",
    creator: "Marvin Meyer",
    creatorUrl: "https://unsplash.com/@marvelous",
    sourceUrl: "https://unsplash.com/photos/SYTO3xs06fU",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["object", "technology", "laptop", "computer", "device", "gadget", "tool", "work"],
    category: "object",
    stage: "curated",
  },

  // --- ACTION & MOTION ---
  {
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=70",
    altText: "Runner bursting from starting line on track representing action and athletic movement",
    creator: "Braden Collum",
    creatorUrl: "https://unsplash.com/@bencollum",
    sourceUrl: "https://unsplash.com/photos/9HI8UJMSdZA",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["action", "run", "running", "speed", "start", "sport", "motion", "energy", "fast"],
    category: "action",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=70",
    altText: "Hand holding fountain pen writing on paper representing writing action",
    creator: "Aaron Burden",
    creatorUrl: "https://unsplash.com/@aaronburden",
    sourceUrl: "https://unsplash.com/photos/y02jEX_B0O0",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["action", "write", "writing", "letter", "pen", "study", "create", "hand"],
    category: "action",
    stage: "curated",
  },

  // --- EMOTION & FEELING ---
  {
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=70",
    altText: "Celebration lights and sparklers representing joy and excitement",
    creator: "Jad Limcaco",
    creatorUrl: "https://unsplash.com/@jadlimcaco",
    sourceUrl: "https://unsplash.com/photos/L7EwHkq1B2s",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["emotion", "joy", "celebration", "happy", "happiness", "excitement", "sparkle", "festive"],
    category: "emotion",
    stage: "curated",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=70",
    altText: "Delicate heart shape in soft light representing love and empathy",
    creator: "Kelly Sikkema",
    creatorUrl: "https://unsplash.com/@kellysikkema",
    sourceUrl: "https://unsplash.com/photos/w629nQ6-tC4",
    sourceName: "Unsplash (Curated)",
    license: "Unsplash License",
    keywords: ["emotion", "love", "heart", "kindness", "empathy", "warmth", "care", "affection"],
    category: "emotion",
    stage: "curated",
  },
];

/**
 * Searches the Curated Image Library by matching keywords, word, POS, or category
 */
export function searchCuratedLibrary(
  word: string,
  category: PlaceholderCategory,
  limit: number = 6
): ImageSearchResult[] {
  const normalizedWord = word.trim().toLowerCase();

  // 1. Score items based on keyword relevance
  const scored = CURATED_IMAGE_LIBRARY.map((item) => {
    let score = 0;
    const hasExactKeyword = item.keywords.includes(normalizedWord);
    const hasPartialKeyword = item.keywords.some((k) =>
      normalizedWord.length > 2 && (k.includes(normalizedWord) || normalizedWord.includes(k))
    );
    const hasAltMatch = item.altText.toLowerCase().includes(normalizedWord);

    if (hasExactKeyword) {
      score += 15;
    } else if (hasPartialKeyword) {
      score += 8;
    }

    if (hasAltMatch) {
      score += 5;
    }

    // Only reward matching category if there is already a keyword or text match
    if (score > 0 && item.category === category) {
      score += 3;
    }

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return items that have genuine relevance (score > 0)
  const results = scored
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.item);

  return results.slice(0, limit);
}

