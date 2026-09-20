/**
 * Audio & TTS Provider Types for VocabFlow (Prompt 6)
 */

export type AudioAccent = "US" | "UK";

export type AudioPlaybackState = "idle" | "loading" | "playing" | "error";

export interface AudioSynthesisResult {
  audioBuffer?: ArrayBuffer;
  audioUrl?: string;
  mimeType: string;
  cached?: boolean;
  providerName: string;
}

export interface AudioTTSProvider {
  name: string;
  isAvailable(): boolean;
  synthesize(word: string, accent: AudioAccent): Promise<AudioSynthesisResult | null>;
}

export interface AudioPlayOptions {
  text: string;
  accent?: AudioAccent;
  audioUrl?: string | null;
  onLoading?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (errorMessage: string) => void;
}
