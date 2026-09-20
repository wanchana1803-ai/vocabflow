import { AudioAccent, AudioPlayOptions } from "@/types/audio-provider";

export type AccentType = AudioAccent;

let activeAudioElement: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentAbortController: AbortController | null = null;

/**
 * Stops any currently playing audio or speech synthesis.
 * Ensures strict concurrency control (only one audio playing at a time).
 */
export function stopAllAudio(): void {
  // Cancel pending fetch/network operations
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  // Stop active HTML Audio
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = "";
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

  // Cancel Web Speech API
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    activeUtterance = null;
  }
}

/**
 * Plays audio using the 4-Stage Fallback Chain:
 * Stage 1: Stored Database Audio URL (if valid)
 * Stage 2: Server-Side TTS Provider (/api/audio/tts)
 * Stage 3: Client-Side Web Speech API (speechSynthesis)
 * Stage 4: Accessible Polite Error Message
 */
export async function playPronunciation({
  text,
  accent = "US",
  audioUrl,
  onLoading,
  onStart,
  onEnd,
  onError,
}: AudioPlayOptions): Promise<void> {
  const cleanWord = text.trim();
  if (!cleanWord) return;

  // 1. Strict concurrency control: stop any ongoing audio playback
  stopAllAudio();

  const abortController = new AbortController();
  currentAbortController = abortController;

  onLoading?.();

  // Helper to play an HTMLAudio element
  const playAudioElement = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (abortController.signal.aborted) {
        resolve(false);
        return;
      }

      const audio = new Audio();
      audio.preload = "auto";
      activeAudioElement = audio;

      let started = false;

      audio.onplay = () => {
        if (abortController.signal.aborted) return;
        started = true;
        onStart?.();
      };

      audio.onended = () => {
        activeAudioElement = null;
        if (!abortController.signal.aborted) {
          onEnd?.();
        }
        resolve(true);
      };

      audio.onerror = () => {
        activeAudioElement = null;
        resolve(false);
      };

      audio.src = src;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          activeAudioElement = null;
          resolve(false);
        });
      }
    });
  };

  // ==========================================
  // STAGE 1: Stored Database URL
  // ==========================================
  if (audioUrl && audioUrl.trim().length > 0) {
    const success = await playAudioElement(audioUrl.trim());
    if (success) return;
    if (abortController.signal.aborted) return;
  }

  // ==========================================
  // STAGE 2: Server-Side TTS Provider
  // ==========================================
  try {
    const ttsUrl = `/api/audio/tts?word=${encodeURIComponent(cleanWord)}&accent=${accent}`;
    const headCheck = await fetch(ttsUrl, {
      method: "HEAD",
      signal: abortController.signal,
    });

    if (headCheck.ok) {
      const success = await playAudioElement(ttsUrl);
      if (success) return;
    }
  } catch {
    // Fall through to Stage 3 if server TTS fails or is aborted
  }

  if (abortController.signal.aborted) return;

  // ==========================================
  // STAGE 3: Client-Side Web Speech API
  // ==========================================
  const speechSuccess = await playWithWebSpeech(cleanWord, accent, onStart, onEnd, abortController);
  if (speechSuccess) return;

  if (abortController.signal.aborted) return;

  // ==========================================
  // STAGE 4: Accessible Polite Error Message
  // ==========================================
  const politeMessage = `ขออภัย ไม่สามารถเล่นเสียงอ่านสำเนียง ${accent} สำหรับคำว่า "${cleanWord}" ได้ในขณะนี้`;
  onError?.(politeMessage);
}

/**
 * Stage 3 implementation: Web Speech API with accent matching
 */
function playWithWebSpeech(
  text: string,
  accent: AudioAccent,
  onStart?: () => void,
  onEnd?: () => void,
  abortController?: AbortController
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve(false);
      return;
    }

    if (abortController?.signal.aborted) {
      resolve(false);
      return;
    }

    try {
      // Ensure any lingering speech is canceled
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance;

      const targetLang = accent === "UK" ? "en-GB" : "en-US";
      utterance.lang = targetLang;
      utterance.rate = 0.9; // Clear language-learning speed

      // Pick closest matching voice for requested accent
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matched = voices.find((v) => {
          const l = v.lang.replace("_", "-").toLowerCase();
          return l === targetLang.toLowerCase();
        });
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onstart = () => {
        if (abortController?.signal.aborted) {
          window.speechSynthesis.cancel();
          return;
        }
        onStart?.();
      };

      utterance.onend = () => {
        activeUtterance = null;
        if (!abortController?.signal.aborted) {
          onEnd?.();
        }
        resolve(true);
      };

      utterance.onerror = () => {
        activeUtterance = null;
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}
