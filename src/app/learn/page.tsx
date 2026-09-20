"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flashcard } from "@/components/flashcards/flashcard";
import { FlashcardSkeleton } from "@/components/flashcards/flashcard-skeleton";
import { ReviewControls } from "@/components/flashcards/review-controls";
import { SessionProgress } from "@/components/flashcards/session-progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { UserWordProgress, SRSRating } from "@/types/srs";
import { calculateSM2, INITIAL_SRS_STATE } from "@/lib/srs/sm2";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getAutomaticImageForWord, OUTDATED_IMAGE_URLS } from "@/lib/images/auto-matcher";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  BookOpen,
  ArrowRight,
  Award,
} from "lucide-react";

interface UndoItem {
  index: number;
  wordId: string;
  previousProgress?: UserWordProgress;
}

export default function LearnPage() {
  const router = useRouter();
  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [progress, setProgress] = useLocalStorage<Record<string, UserWordProgress>>(
    "vocabflow_progress",
    {}
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [learnedInSession, setLearnedInSession] = useState(0);
  const [undoStack, setUndoStack] = useState<UndoItem[]>([]);
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Auto-heal missing or broken images for existing stored words
  useEffect(() => {
    if (!isMounted || !vocab || vocab.length === 0) return;

    let needsUpdate = false;
    const updatedVocab = vocab.map((w) => {
      const currentUrl = (w.imageUrl || w.image_url || "").trim();
      const isMissing = !currentUrl;
      const isOutdated = OUTDATED_IMAGE_URLS.has(currentUrl);

      if (isMissing || isOutdated) {
        needsUpdate = true;
        const auto = getAutomaticImageForWord(
          w.word,
          w.partOfSpeech || w.part_of_speech,
          w.topic,
          w.definition || w.definition_en
        );
        return {
          ...w,
          imageUrl: auto.imageUrl,
          image_url: auto.imageUrl,
          imageAlt: auto.imageAlt,
          image_alt: auto.imageAlt,
          source: auto.sourceName,
          sourceName: auto.sourceName,
          source_name: auto.sourceName,
          license: auto.sourceLicense,
          sourceLicense: auto.sourceLicense,
          source_license: auto.sourceLicense,
        };
      }
      return w;
    });

    if (needsUpdate) {
      setVocab(updatedVocab);
    }
  }, [isMounted, vocab, setVocab]);

  // Ref to hold current state values for key handlers
  const stateRef = useRef({
    currentIndex,
    isFlipped,
    vocab,
    isCompleted,
  });

  useEffect(() => {
    stateRef.current = {
      currentIndex,
      isFlipped,
      vocab,
      isCompleted,
    };
  }, [currentIndex, isFlipped, vocab, isCompleted]);

  // Flip card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Advance to next word
  const advanceToNext = useCallback(
    (nextIdx: number) => {
      setIsFlipped(false);
      if (nextIdx < vocab.length) {
        setCurrentIndex(nextIdx);
      } else {
        setIsCompleted(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Safe fallback
        }
      }
    },
    [vocab.length]
  );

  // Rate current word using SM-2
  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (currentIndex >= vocab.length) return;

      const currentWord = vocab[currentIndex];
      const existingProgress: UserWordProgress = progress[currentWord.id] || {
        ...INITIAL_SRS_STATE,
        wordId: currentWord.id,
        isLearned: false,
        status: "learning",
        history: [],
      };

      // Save for Undo
      setUndoStack((prev) => [
        ...prev,
        {
          index: currentIndex,
          wordId: currentWord.id,
          previousProgress: progress[currentWord.id],
        },
      ]);

      // Calculate next SRS state
      const nextProgress = calculateSM2(existingProgress, rating);
      nextProgress.isLearned = true;

      setProgress((prev) => ({
        ...prev,
        [currentWord.id]: nextProgress,
      }));

      setLearnedInSession((prev) => prev + 1);

      // Brief visual pause before advancing
      advanceToNext(currentIndex + 1);
    },
    [currentIndex, vocab, progress, setProgress, advanceToNext]
  );

  // Undo previous action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    // Restore progress
    setProgress((prev) => {
      const copy = { ...prev };
      if (lastAction.previousProgress) {
        copy[lastAction.wordId] = lastAction.previousProgress;
      } else {
        delete copy[lastAction.wordId];
      }
      return copy;
    });

    setLearnedInSession((prev) => Math.max(0, prev - 1));
    setIsFlipped(false);
    setIsCompleted(false);
    setCurrentIndex(lastAction.index);
  }, [undoStack, setProgress]);

  // Toggle lock for the current word
  const handleToggleLock = useCallback((wordId: string) => {
    setVocab((prev) =>
      prev.map((w) => {
        if (w.id === wordId) {
          const isCurrentlyLocked = Boolean(w.isLocked || w.is_locked);
          return {
            ...w,
            isLocked: !isCurrentlyLocked,
            is_locked: !isCurrentlyLocked,
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      })
    );
  }, [setVocab]);

  // Skip current card
  const handleSkip = useCallback(() => {
    advanceToNext(currentIndex + 1);
  }, [currentIndex, advanceToNext]);

  // Previous card (without rating change)
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useKeyboardShortcuts({
    onSpace: handleFlip,
    onEnter: handleFlip,
    onArrowLeft: handlePrevious,
    onArrowRight: handleSkip,
    onOne: () => handleRate("again"),
    onTwo: () => handleRate("hard"),
    onThree: () => handleRate("good"),
    onFour: () => handleRate("easy"),
  });

  // Additional key listeners for undo (u / backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  // Initial mount guard to ensure zero hydration mismatch with client localStorage
  if (!isMounted) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-6 md:py-8 flex flex-col gap-5 min-h-[calc(100vh-5rem)] justify-between">
        <div className="space-y-2 max-w-xl w-full mx-auto">
          <div className="flex justify-between items-center">
            <div className="h-4 w-28 animate-pulse bg-muted rounded-md" />
            <div className="h-4 w-20 animate-pulse bg-muted rounded-full" />
          </div>
          <div className="h-2 w-full animate-pulse bg-muted rounded-full" />
        </div>
        <FlashcardSkeleton />
        <div className="grid grid-cols-4 gap-2 pt-2 max-w-xl w-full mx-auto">
          <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
        </div>
      </div>
    );
  }

  // If no words available
  if (!vocab || vocab.length === 0) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <EmptyState
          icon={BookOpen}
          title="ยังไม่มีคำศัพท์ในคลัง"
          description="คลังคำศัพท์ของคุณยังว่างอยู่ คุณสามารถนำเข้าคำศัพท์จากไฟล์ CSV/JSON หรือเปิดชุดคำศัพท์เริ่มต้นได้เลย"
          actionLabel="ไปที่หน้าคลังคำศัพท์"
          onAction={() => router.push("/vocabulary")}
        />
      </div>
    );
  }

  // Session Completed screen
  if (isCompleted) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mx-auto shadow-md border border-primary/20">
          <Award className="h-10 w-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            จบเซสชันการเรียนรู้แล้ว! 🎉
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            คุณได้เรียนรู้คำศัพท์ครบทั้ง {vocab.length} คำในชุดนี้แล้ว ระบบได้บันทึกความก้าวหน้าตามอัลกอริทึม SM-2 เรียบร้อย
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="rounded-2xl border border-border/80 bg-card p-4 text-center">
            <span className="text-xs text-muted-foreground">คำที่เรียนในรอบนี้</span>
            <p className="text-2xl font-bold text-primary mt-1">{learnedInSession} คำ</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-4 text-center">
            <span className="text-xs text-muted-foreground">คลังคำศัพท์ทั้งหมด</span>
            <p className="text-2xl font-bold text-foreground mt-1">{vocab.length} คำ</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button asChild size="lg" className="w-full rounded-2xl gap-2 shadow-md">
            <Link href="/review">
              <span>ไปทบทวนใน Review Mode (SRS)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setIsCompleted(false);
              setLearnedInSession(0);
              setUndoStack([]);
            }}
            className="w-full rounded-2xl gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>เริ่มฝึกใหม่อีกรอบ</span>
          </Button>
        </div>
      </div>
    );
  }

  const currentWord = vocab[currentIndex] || vocab[0];
  if (!currentWord) return null;

  const nextWord = vocab[currentIndex + 1];
  const nextImageUrl = nextWord?.imageUrl || nextWord?.image_url;

  return (
    <div className="container mx-auto max-w-xl px-4 py-6 md:py-8 flex flex-col gap-5 min-h-[calc(100vh-5rem)] justify-between">
      {/* 1. Session Progress Bar & Remaining Counter */}
      <SessionProgress
        currentIndex={currentIndex}
        totalWords={vocab.length}
        learnedInSession={learnedInSession}
        streakDays={1}
      />

      {/* 2. Reusable 3D Flashcard with Swipe Gestures */}
      <div className="flex-1 flex items-center justify-center my-auto w-full py-2">
        <Flashcard
          word={currentWord}
          nextImageUrl={nextImageUrl}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          onSwipeLeft={handleSkip}
          onSwipeRight={handleUndo}
          onToggleLock={handleToggleLock}
        />
      </div>

      {/* 3. Review Controls (Again, Hard, Good, Easy, Undo, Skip, Flip) */}
      <ReviewControls
        onRate={handleRate}
        onFlip={handleFlip}
        onUndo={handleUndo}
        onSkip={handleSkip}
        isFlipped={isFlipped}
        canUndo={undoStack.length > 0}
      />
    </div>
  );
}
