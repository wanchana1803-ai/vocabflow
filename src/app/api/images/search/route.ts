import { NextRequest, NextResponse } from "next/server";
import { ImageSearchQuery, ImageSearchResult, ImageSearchApiResponse } from "@/types/image-provider";
import { getActiveImageProvider } from "@/lib/images/providers";

// Server-side In-memory Cache to minimize external API hits
interface CacheEntry {
  results: ImageSearchResult[];
  provider: string;
  timestamp: number;
}

const SERVER_IMAGE_CACHE = new Map<string, CacheEntry>();

// Cache TTL: Default 24 hours or configured via IMAGE_CACHE_TTL_HOURS
const TTL_HOURS = parseInt(process.env.IMAGE_CACHE_TTL_HOURS || "24", 10);
const CACHE_TTL_MS = TTL_HOURS * 60 * 60 * 1000;

function getCacheKey(query: ImageSearchQuery, providerName?: string | null): string {
  const p = (providerName || process.env.IMAGE_PROVIDER || "curated").toLowerCase();
  const w = query.word.toLowerCase().trim();
  const pos = (query.partOfSpeech || "").toLowerCase().trim();
  const top = (query.topic || "").toLowerCase().trim();
  return `${p}:${w}:${pos}:${top}:${query.limit || 6}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get("word");

    if (!word || !word.trim()) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          provider: "none",
          cached: false,
          error: "Query parameter 'word' is required",
        } satisfies ImageSearchApiResponse,
        { status: 400 }
      );
    }

    const definition = searchParams.get("definition");
    const partOfSpeech = searchParams.get("partOfSpeech");
    const topic = searchParams.get("topic");
    const providerOverride = searchParams.get("provider");
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const safeSearch = searchParams.get("safeSearch") !== "false";

    const query: ImageSearchQuery = {
      word: word.trim(),
      definition,
      partOfSpeech,
      topic,
      limit: Math.min(limit, 20),
      safeSearch,
    };

    const cacheKey = getCacheKey(query, providerOverride);
    const cached = SERVER_IMAGE_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        results: cached.results,
        provider: cached.provider,
        cached: true,
        total: cached.results.length,
      } satisfies ImageSearchApiResponse);
    }

    // Resolve provider securely on server
    const provider = getActiveImageProvider(providerOverride);
    const results = await provider.search(query);

    // Store in server cache
    SERVER_IMAGE_CACHE.set(cacheKey, {
      results,
      provider: provider.name,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      results,
      provider: provider.name,
      cached: false,
      total: results.length,
    } satisfies ImageSearchApiResponse);
  } catch (err) {
    console.error("[API /api/images/search] Error:", err);
    return NextResponse.json(
      {
        success: false,
        results: [],
        provider: "error",
        cached: false,
        error: err instanceof Error ? err.message : "Internal server error",
      } satisfies ImageSearchApiResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const word = body.word;

    if (!word || !word.trim()) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          provider: "none",
          cached: false,
          error: "Field 'word' is required in JSON body",
        } satisfies ImageSearchApiResponse,
        { status: 400 }
      );
    }

    const query: ImageSearchQuery = {
      word: word.trim(),
      definition: body.definition,
      partOfSpeech: body.partOfSpeech,
      topic: body.topic,
      limit: Math.min(body.limit || 6, 20),
      safeSearch: body.safeSearch !== false,
    };

    const cacheKey = getCacheKey(query, body.provider);
    const cached = SERVER_IMAGE_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        results: cached.results,
        provider: cached.provider,
        cached: true,
        total: cached.results.length,
      } satisfies ImageSearchApiResponse);
    }

    const provider = getActiveImageProvider(body.provider);
    const results = await provider.search(query);

    SERVER_IMAGE_CACHE.set(cacheKey, {
      results,
      provider: provider.name,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      results,
      provider: provider.name,
      cached: false,
      total: results.length,
    } satisfies ImageSearchApiResponse);
  } catch (err) {
    console.error("[API /api/images/search POST] Error:", err);
    return NextResponse.json(
      {
        success: false,
        results: [],
        provider: "error",
        cached: false,
        error: err instanceof Error ? err.message : "Internal server error",
      } satisfies ImageSearchApiResponse,
      { status: 500 }
    );
  }
}
