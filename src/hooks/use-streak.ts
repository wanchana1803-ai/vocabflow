"use client";

import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { UserWordProgress } from "@/types/srs";
import { calculateStreak } from "@/lib/srs/sm2";

/**
 * Custom hook to dynamically compute the user's current study streak.
 * Starts at 0, and increments when studying on consecutive days.
 */
export function useStreak(): { streak: number; progress: Record<string, UserWordProgress> } {
  const [progress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});

  const streak = useMemo(() => {
    return calculateStreak(progress);
  }, [progress]);

  return { streak, progress };
}
