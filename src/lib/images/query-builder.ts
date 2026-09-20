import { ImageSearchQuery, PlaceholderCategory } from "@/types/image-provider";

/**
 * Common stopwords to remove from definitions when extracting semantic tokens
 */
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
  "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
  "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
  "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
  "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
  "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
  "why", "with", "would", "you", "your", "yours", "yourself", "yourselves",
  // Dictionary definition filler phrases
  "act", "acting", "action", "cause", "caused", "causes", "causing", "capable", "having", "making",
  "means", "meaning", "particular", "person", "quality", "relating", "someone", "something",
  "state", "type", "used", "way",
]);

/**
 * Visual Metaphors for Abstract Vocabulary
 * Maps abstract concepts to evocative visual search phrases
 */
export const ABSTRACT_SYMBOLIC_METAPHORS: Record<string, string> = {
  serendipity: "unexpected good luck morning light finding treasure path",
  resilience: "green plant sprout growing through concrete stone",
  clarity: "pure transparent crystal water bright morning sunlight",
  freedom: "bird soaring high in vast open blue sky sunrise",
  ambiguity: "mysterious misty forest path silhouette foggy crossroads",
  cooperation: "hands coming together teamwork diverse group puzzle",
  harmony: "balanced zen stones water reflection peaceful balance",
  perseverance: "hiker reaching mountain summit sunrise determination",
  curiosity: "magnifying glass exploring open old map compass",
  courage: "lone figure standing brave facing storm edge of cliff",
  solitude: "peaceful cabin quiet lake mist calm reflection",
  empathy: "comforting hands gentle gesture warm sunset holding hands",
  innovation: "bright glowing lightbulb geometric ideas creativity dark background",
  wisdom: "ancient open book glowing soft library candlelight",
  transience: "cherry blossom petals falling wind hourglass sand",
  optimism: "sunburst rays breaking through storm clouds meadow",
  integrity: "architectural pillar solid stone compass geometry",
  nostalgia: "vintage film photograph warm golden afternoon sunlight",
  authenticity: "natural rough diamond unpolished wood pure texture",
  diligence: "focused study desk warm lamp notebook late evening",
};

/**
 * Extracts the 2-3 most meaningful semantic keyword tokens from a definition string
 */
export function extractDefinitionKeywords(definition?: string | null): string[] {
  if (!definition) return [];
  const cleaned = definition
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  return cleaned.slice(0, 3);
}

/**
 * Builds a search query tailored for high visual relevance
 */
export function buildSemanticSearchQuery(query: ImageSearchQuery): string {
  const wordLower = query.word.trim().toLowerCase();

  // 1. Check if an explicit symbolic metaphor exists for abstract terms
  if (ABSTRACT_SYMBOLIC_METAPHORS[wordLower]) {
    return ABSTRACT_SYMBOLIC_METAPHORS[wordLower];
  }

  const defKeywords = extractDefinitionKeywords(query.definition);
  const pos = (query.partOfSpeech || "").toLowerCase();
  const topic = (query.topic || "").trim().toLowerCase();

  const queryParts: string[] = [];

  // 2. Handle Part of Speech semantic framing
  if (pos.includes("verb")) {
    queryParts.push("action of");
    queryParts.push(wordLower);
    if (defKeywords.length > 0) {
      queryParts.push(defKeywords[0]);
    }
  } else if (pos.includes("adj")) {
    queryParts.push(wordLower);
    if (defKeywords.length > 0) {
      queryParts.push(defKeywords[0]);
    }
  } else if (pos.includes("noun")) {
    queryParts.push(wordLower);
    if (defKeywords.length > 0) {
      const nonDuplicate = defKeywords.filter((k) => k !== wordLower);
      if (nonDuplicate.length > 0) {
        queryParts.push(nonDuplicate[0]);
      }
    }
  } else {
    queryParts.push(wordLower);
    if (defKeywords.length > 0) {
      queryParts.push(defKeywords.slice(0, 2).join(" "));
    }
  }

  // 3. Add topic context if it clarifies the domain (e.g. food, travel, nature)
  if (topic && !["general", "default", "misc"].includes(topic)) {
    queryParts.push(topic);
  }

  return queryParts.join(" ").trim();
}

/**
 * Categorizes a vocabulary term into one of 6 core placeholder categories:
 * 'person', 'place', 'object', 'action', 'emotion', 'abstract'
 */
export function resolvePlaceholderCategory(
  word: string,
  partOfSpeech?: string | null,
  topic?: string | null,
  definition?: string | null
): PlaceholderCategory {
  const w = word.toLowerCase();
  const pos = (partOfSpeech || "").toLowerCase();
  const top = (topic || "").toLowerCase();
  const def = (definition || "").toLowerCase();
  const defTokens = new Set(def.split(/[^a-z0-9]+/));

  // Check 1: Action (Verbs or motion/activity topics)
  if (pos.includes("verb") || top.includes("action") || top.includes("movement") || top.includes("sport")) {
    return "action";
  }

  // Check 2: Emotion / Feeling
  if (
    top.includes("emotion") ||
    top.includes("feeling") ||
    top.includes("psychology") ||
    defTokens.has("feeling") ||
    defTokens.has("feelings") ||
    defTokens.has("emotion") ||
    defTokens.has("emotions") ||
    ["happy", "sad", "angry", "fear", "joy", "love", "grief"].includes(w)
  ) {
    return "emotion";
  }

  // Check 3: Person (people, professions, social roles)
  if (
    top.includes("people") ||
    top.includes("profession") ||
    top.includes("society") ||
    top.includes("personal") ||
    defTokens.has("person") ||
    defTokens.has("someone") ||
    defTokens.has("people") ||
    defTokens.has("human") ||
    w.endsWith("er") ||
    w.endsWith("or") ||
    w.endsWith("ist")
  ) {
    return "person";
  }

  // Check 4: Place (geography, locations, buildings, nature spots)
  if (
    top.includes("place") ||
    top.includes("travel") ||
    top.includes("geography") ||
    top.includes("city") ||
    top.includes("nature") ||
    defTokens.has("place") ||
    defTokens.has("country") ||
    defTokens.has("building") ||
    defTokens.has("area") ||
    defTokens.has("city") ||
    defTokens.has("location")
  ) {
    return "place";
  }

  // Check 5: Object (tangible items, food, tools, technology, physical things)
  if (
    top.includes("object") ||
    top.includes("food") ||
    top.includes("technology") ||
    top.includes("tool") ||
    top.includes("material") ||
    defTokens.has("device") ||
    defTokens.has("instrument") ||
    defTokens.has("object") ||
    defTokens.has("food") ||
    defTokens.has("tool") ||
    defTokens.has("computer")
  ) {
    return "object";
  }

  // Check 6: Abstract (concepts, philosophy, quality, state of mind, logic)
  return "abstract";
}
