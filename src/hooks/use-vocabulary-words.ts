"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VocabularyWord } from "@/types/vocabulary";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { useLocalStorage } from "@/hooks/use-local-storage";

const VOCAB_STORAGE_KEY = "vocabflow_words";
const SYNC_EVENT_NAME = "vocabflow_vocab_sync";

export interface UseVocabularyWordsResult {
  vocab: VocabularyWord[];
  setVocab: (value: VocabularyWord[] | ((prev: VocabularyWord[]) => VocabularyWord[])) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
  isLiveSource: boolean;
}

/**
 * Unified hook for accessing vocabulary words across the application.
 * - Reads instantly from localStorage cache (Zero-flash).
 * - Syncs with the centralized /api/vocabulary in the background.
 * - Dispatches cross-component synchronization events.
 */
export function useVocabularyWords(): UseVocabularyWordsResult {
  const [vocab, setLocalVocab, isClient] = useLocalStorage<VocabularyWord[]>(
    VOCAB_STORAGE_KEY,
    INITIAL_VOCABULARY
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveSource, setIsLiveSource] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);

  const fetchCentralVocabulary = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/vocabulary", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch vocabulary");

      const json = await res.json();
      const serverWords: VocabularyWord[] = json.data || [];
      const source: string = json.source || "";

      if (source === "supabase" && serverWords.length > 0) {
        setIsLiveSource(true);
        // Supabase is the central single-source-of-truth
        setLocalVocab(serverWords);
      } else if (serverWords.length > 0) {
        // Fallback or empty DB mode:
        // If local storage is empty or only has the 6 initial words, use server's list
        setLocalVocab((current) => {
          if (!current || current.length <= INITIAL_VOCABULARY.length) {
            return serverWords;
          }
          // If user has more words locally, keep them
          return current;
        });
      }
    } catch (err) {
      console.warn("Could not sync with central vocabulary database:", err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [setLocalVocab]);

  // Initial fetch on mount
  useEffect(() => {
    if (!isClient) return;
    fetchCentralVocabulary();
  }, [isClient, fetchCentralVocabulary]);

  // Listen for sync events triggered by other components (e.g., admin create/delete/import)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSync = () => {
      fetchCentralVocabulary();
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    return () => window.removeEventListener(SYNC_EVENT_NAME, handleSync);
  }, [fetchCentralVocabulary]);

  // Wrapped setVocab that also broadcasts update event
  const setVocabAndBroadcast = useCallback(
    (value: VocabularyWord[] | ((prev: VocabularyWord[]) => VocabularyWord[])) => {
      setLocalVocab(value);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SYNC_EVENT_NAME));
      }
    },
    [setLocalVocab]
  );

  return {
    vocab,
    setVocab: setVocabAndBroadcast,
    isLoading,
    refresh: fetchCentralVocabulary,
    isLiveSource,
  };
}

/**
 * Broadcasts a sync event to notify all active useVocabularyWords hooks to re-fetch
 */
export function broadcastVocabularyUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SYNC_EVENT_NAME));
  }
}
