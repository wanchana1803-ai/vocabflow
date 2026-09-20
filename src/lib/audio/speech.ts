export type AccentType = "UK" | "US";

let activeAudioElement: HTMLAudioElement | null = null;

/**
 * Stops any currently playing audio or speech synthesis.
 */
export function stopAllAudio(): void {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Plays audio using the fallback chain:
 * 1. Audio URL (if provided and playable)
 * 2. Browser Web Speech API with selected accent
 */
export async function playPronunciation({
  text,
  accent = "US",
  audioUrl,
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  accent?: AccentType;
  audioUrl?: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}): Promise<void> {
  stopAllAudio();

  // 1. Try URL playback if provided
  if (audioUrl && audioUrl.trim().length > 0) {
    try {
      const audio = new Audio(audioUrl);
      activeAudioElement = audio;

      audio.onplay = () => onStart?.();
      audio.onended = () => {
        activeAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        activeAudioElement = null;
        // Fallback to Web Speech API
        playWithWebSpeech(text, accent, onStart, onEnd, onError);
      };

      await audio.play();
      return;
    } catch {
      // Failed to play URL, fall through to Web Speech API
    }
  }

  // 2. Web Speech API fallback
  playWithWebSpeech(text, accent, onStart, onEnd, onError);
}

function playWithWebSpeech(
  text: string,
  accent: AccentType,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: Error) => void
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.(new Error("Audio playback is not supported on this browser."));
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent === "UK" ? "en-GB" : "en-US";
    utterance.rate = 0.9; // slightly slower for language learning clarity

    // Match available voice if possible
    const voices = window.speechSynthesis.getVoices();
    const targetLang = accent === "UK" ? "en-GB" : "en-US";
    const matchedVoice = voices.find((v) => v.lang.replace("_", "-") === targetLang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (event) => {
      onError?.(new Error(event.error || "Speech synthesis failed"));
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error("Speech synthesis failed"));
  }
}
