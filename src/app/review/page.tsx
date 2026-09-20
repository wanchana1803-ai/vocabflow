"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlashcardCard } from "@/components/flashcards/flashcard-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { SRSRating, UserWordProgress } from "@/types/srs";
import { calculateNextSRSState, INITIAL_SRS_STATE } from "@/lib/srs/sm2";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Undo2,
  CalendarCheck,
} from "lucide-react";

interface UndoState {
  wordId: string;
  previousProgress: UserWordProgress;
  queueIndex: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const [vocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [progress, setProgress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});

  const [queueIndex, setQueueIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Review queue: cards that are marked learned or due, or all words for practice
  const dueWords = useMemo(() => {
    return vocab;
  }, [vocab]);

  const currentWord = dueWords[queueIndex];

  // SRS submission handler
  const handleRate = (rating: SRSRating) => {
    if (!currentWord || isCompleted) return;

    const currentSRS = progress[currentWord.id] || {
      ...INITIAL_SRS_STATE,
      wordId: currentWord.id,
      isLearned: true,
      history: [],
    };

    // Save previous state for undo capability
    setUndoState({
      wordId: currentWord.id,
      previousProgress: { ...currentSRS },
      queueIndex,
    });

    const nextState = calculateNextSRSState(currentSRS, rating);
    const updatedProgress: UserWordProgress = {
      ...nextState,
      wordId: currentWord.id,
      isLearned: true,
      history: [
        ...currentSRS.history,
        {
          id: `log-${Date.now()}`,
          wordId: currentWord.id,
          rating,
          reviewedAt: new Date().toISOString(),
          intervalBefore: currentSRS.interval,
          intervalAfter: nextState.interval,
          easeFactorBefore: currentSRS.easeFactor,
          easeFactorAfter: nextState.easeFactor,
        },
      ],
    };

    setProgress((prev) => ({
      ...prev,
      [currentWord.id]: updatedProgress,
    }));

    setIsFlipped(false);

    if (queueIndex < dueWords.length - 1) {
      setQueueIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Safe fallback
      }
    }
  };

  const handleUndo = () => {
    if (!undoState) return;

    setProgress((prev) => ({
      ...prev,
      [undoState.wordId]: undoState.previousProgress,
    }));
    setQueueIndex(undoState.queueIndex);
    setIsFlipped(false);
    setIsCompleted(false);
    setUndoState(null);
  };

  // Keyboard Shortcuts: Space (Flip), 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
  useKeyboardShortcuts({
    onSpace: () => setIsFlipped((prev) => !prev),
    onEnter: () => setIsFlipped((prev) => !prev),
    onOne: () => handleRate("again"),
    onTwo: () => handleRate("hard"),
    onThree: () => handleRate("good"),
    onFour: () => handleRate("easy"),
  });

  if (!vocab || vocab.length === 0) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <EmptyState
          icon={CalendarCheck}
          title="All Caught Up!"
          description="There are no flashcards due for review right now. Great job keeping your memory fresh!"
          actionLabel="Explore Vocabulary"
          onAction={() => router.push("/vocabulary")}
        />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-primary mx-auto shadow-md">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Review Completed!
          </h1>
          <p className="text-muted-foreground text-sm">
            You successfully reviewed {dueWords.length} flashcards today. Spaced intervals have been updated.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link href="/progress">
            <Button size="lg" className="w-full rounded-2xl gap-2 shadow-md">
              <Sparkles className="h-5 w-5" />
              <span>View Retention Progress</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setQueueIndex(0);
              setIsFlipped(false);
              setIsCompleted(false);
            }}
            className="w-full rounded-2xl gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Review Again</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-6 space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Spaced Review</h1>
          <p className="text-xs text-muted-foreground">Rate your recall accuracy</p>
        </div>

        <div className="flex items-center gap-2">
          {undoState && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Undo last rating"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </Button>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-primary">
            {queueIndex + 1}/{dueWords.length}
          </span>
        </div>
      </div>

      <Progress value={queueIndex + 1} max={dueWords.length} className="h-2" />

      {/* 3D Flashcard */}
      <FlashcardCard
        word={currentWord}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((prev) => !prev)}
      />

      {/* SRS Rating Control Buttons: Again, Hard, Good, Easy */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            onClick={() => handleRate("again")}
            className="flex flex-col h-14 rounded-2xl border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-1"
          >
            <span className="text-xs font-bold">Again</span>
            <span className="text-[10px] opacity-75">&lt; 1 day (1)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleRate("hard")}
            className="flex flex-col h-14 rounded-2xl border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-1"
          >
            <span className="text-xs font-bold">Hard</span>
            <span className="text-[10px] opacity-75">2 days (2)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleRate("good")}
            className="flex flex-col h-14 rounded-2xl border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-1"
          >
            <span className="text-xs font-bold">Good</span>
            <span className="text-[10px] opacity-75">4 days (3)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleRate("easy")}
            className="flex flex-col h-14 rounded-2xl border-teal-200 dark:border-teal-900/50 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-600 dark:text-teal-400 p-1"
          >
            <span className="text-xs font-bold">Easy</span>
            <span className="text-[10px] opacity-75">6 days (4)</span>
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Shortcuts: <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">Space</kbd> Flip &bull; Keys <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">1-4</kbd> Rate
        </p>
      </div>
    </div>
  );
}
