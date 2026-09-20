import { AudioTTSProvider, AudioAccent, AudioSynthesisResult } from "@/types/audio-provider";

export class GoogleTTSProvider implements AudioTTSProvider {
  name = "google-tts";

  isAvailable(): boolean {
    return true; // Zero-config provider
  }

  async synthesize(word: string, accent: AudioAccent): Promise<AudioSynthesisResult | null> {
    const cleanWord = word.trim();
    if (!cleanWord) return null;

    const lang = accent === "UK" ? "en-gb" : "en-us";
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanWord)}&tl=${lang}&client=tw-ob`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
        },
      });

      if (!response.ok) {
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength < 100) {
        return null;
      }

      return {
        audioBuffer: arrayBuffer,
        mimeType: "audio/mpeg",
        providerName: this.name,
      };
    } catch {
      return null;
    }
  }
}
