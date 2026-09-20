import { AudioTTSProvider, AudioAccent, AudioSynthesisResult } from "@/types/audio-provider";
import { GoogleTTSProvider } from "./google-tts-provider";
import { ElevenLabsTTSProvider } from "./elevenlabs-provider";
import { getAudioCacheKey, getCachedAudio, setCachedAudio } from "../cache";

const providers: AudioTTSProvider[] = [
  new ElevenLabsTTSProvider(),
  new GoogleTTSProvider(),
];

/**
 * Gets the active TTS provider according to priority and availability
 */
export function getActiveTTSProvider(): AudioTTSProvider | null {
  for (const provider of providers) {
    if (provider.isAvailable()) {
      return provider;
    }
  }
  return null;
}

/**
 * Synthesizes audio using cache and active provider
 */
export async function synthesizeAudio(
  word: string,
  accent: AudioAccent = "US"
): Promise<AudioSynthesisResult | null> {
  const provider = getActiveTTSProvider();
  if (!provider) return null;

  const cacheKey = getAudioCacheKey(word, accent, provider.name);
  const cached = getCachedAudio(cacheKey);

  if (cached) {
    return {
      audioBuffer: cached.buffer,
      mimeType: cached.mimeType,
      cached: true,
      providerName: provider.name,
    };
  }

  const result = await provider.synthesize(word, accent);
  if (result && result.audioBuffer) {
    setCachedAudio(cacheKey, result.audioBuffer, result.mimeType);
  }

  return result;
}
