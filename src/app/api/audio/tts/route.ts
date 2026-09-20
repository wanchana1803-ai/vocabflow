import { NextRequest, NextResponse } from "next/server";
import { synthesizeAudio } from "@/lib/audio/providers";
import { AudioAccent } from "@/types/audio-provider";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get("word");
  const rawAccent = (searchParams.get("accent") || "US").toUpperCase();
  const accent: AudioAccent = rawAccent === "UK" ? "UK" : "US";

  if (!word || word.trim().length === 0) {
    return NextResponse.json(
      { error: "Word parameter is required" },
      { status: 400 }
    );
  }

  // Length limit for security
  if (word.length > 100) {
    return NextResponse.json(
      { error: "Word parameter exceeds maximum length" },
      { status: 400 }
    );
  }

  try {
    const result = await synthesizeAudio(word, accent);

    if (!result || !result.audioBuffer) {
      return NextResponse.json(
        { error: "TTS synthesis unavailable", fallback: "web-speech" },
        { status: 503 }
      );
    }

    return new Response(result.audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType || "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Audio-Provider": result.providerName,
        "X-Audio-Cached": result.cached ? "true" : "false",
      },
    });
  } catch (error) {
    console.error("TTS API Route Error:", error);
    return NextResponse.json(
      { error: "Internal TTS synthesis failure", fallback: "web-speech" },
      { status: 500 }
    );
  }
}

export { GET as HEAD };
