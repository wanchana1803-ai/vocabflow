import { AudioTTSProvider, AudioAccent, AudioSynthesisResult } from "@/types/audio-provider";

export class ElevenLabsTTSProvider implements AudioTTSProvider {
  name = "elevenlabs";

  // Pre-selected voice IDs for UK & US
  private usVoiceId = process.env.ELEVENLABS_VOICE_US || "21m00Tcm4TlvDq8ikWAM"; // Rachel (US)
  private ukVoiceId = process.env.ELEVENLABS_VOICE_UK || "ErXwobaYiN019PkySvjV"; // Antoni/UK English

  isAvailable(): boolean {
    return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0);
  }

  async synthesize(word: string, accent: AudioAccent): Promise<AudioSynthesisResult | null> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return null;

    const voiceId = accent === "UK" ? this.ukVoiceId : this.usVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: word,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
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
