"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlashcardCard } from "@/components/flashcards/flashcard-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { SRSRating, UserWordProgress } from "@/types/srs";
import {
  calculateSM2,
  calculateNextSRSState,
  calculateSRSMetrics,
  isCardDue,
  resolveCurrentTime,
  INITIAL_SRS_STATE,
  DEFAULT_SRS_CONFIG,
} from "@/lib/srs/sm2";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { playPronunciation, stopAllAudio } from "@/lib/audio/speech";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Undo2,
  CalendarCheck,
  Flame,
  Clock,
  BookOpen,
  Award,
  RefreshCw,
} from "lucide-react";

interface UndoState {
  wordId: string;
  previousProgress: UserWordProgress;
  queueIndex: number;
}

interface SavedSession {
  queueWordIds: string[];
  queueIndex: number;
  completedWordIds: string[];
  timestamp: number;
}

const SESSION_STORAGE_KEY = "vocabflow_review_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function ReviewPage() {
  const router = useRouter();
  const [vocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [progress, setProgress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});
  const [preferredAccent] = useLocalStorage<"US" | "UK">("vocabflow_accent", "US");
  const [autoPlayAudio] = useLocalStorage<boolean>("vocabflow_autoplay_audio", false);

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [queueIndex, setQueueIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [reviewMode, setReviewMode] = useState<"due" | "all">("due");

  const isSubmittingRef = useRef(false);

  // Sync server or device time once mounted
  useEffect(() => {
    if (!isMounted) return;
    const hasSupabase = isSupabaseConfigured();
    resolveCurrentTime(hasSupabase).then((time) => {
      setCurrentTime(time);
    });
  }, [isMounted]);

  // Compute live SRS Metrics (Due Today, New, Mastered)
  const metrics = useMemo(() => {
    return calculateSRSMetrics(vocab, progress, currentTime);
  }, [vocab, progress, currentTime]);

  // Determine cards in review queue (prioritize Due Today cards; fallback to all if none due or mode is all)
  const dueWords = useMemo(() => {
    if (!vocab || vocab.length === 0) return [];

    if (reviewMode === "due") {
      const dueCards = vocab.filter((w) => {
        const p = progress[w.id];
        return !p || !p.isLearned || isCardDue(p, currentTime);
      });
      if (dueCards.length > 0) return dueCards;
    }

    return vocab;
  }, [vocab, progress, currentTime, reviewMode]);

  // Session Resume: Load saved session from localStorage on initial load
  useEffect(() => {
    if (!isMounted || !dueWords || dueWords.length === 0) return;

    try {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (rawSession) {
        const session: SavedSession = JSON.parse(rawSession);
        const isFresh = Date.now() - session.timestamp < SESSION_MAX_AGE_MS;
        
        if (
          isFresh &&
          session.queueIndex > 0 &&
          session.queueIndex < dueWords.length &&
          session.queueWordIds &&
          session.queueWordIds.length === dueWords.length
        ) {
          setQueueIndex(session.queueIndex);
          setIsResumedSession(true);
        }
      }
    } catch {
      // Ignore corrupted session storage
    }
  }, [isMounted, dueWords]);

  // Persist session progress to localStorage
  const saveSessionState = useCallback((nextIndex: number, queue: VocabularyWord[]) => {
    try {
      if (nextIndex >= queue.length) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        const session: SavedSession = {
          queueWordIds: queue.map((w) => w.id),
          queueIndex: nextIndex,
          completedWordIds: queue.slice(0, nextIndex).map((w) => w.id),
          timestamp: Date.now(),
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const currentWord = dueWords[queueIndex];

  // Auto-play audio when card opens if enabled in settings
  useEffect(() => {
    if (!isMounted || isCompleted || !autoPlayAudio || !currentWord) return;

    const timer = setTimeout(() => {
      const audioUrl = preferredAccent === "UK"
        ? (currentWord.audioUkUrl || currentWord.audio_uk_url)
        : (currentWord.audioUsUrl || currentWord.audio_us_url);

      playPronunciation({
        text: currentWord.word,
        accent: preferredAccent,
        audioUrl,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [queueIndex, isMounted, isCompleted, autoPlayAudio, preferredAccent, currentWord]);

  // Clean up any ongoing audio when unmounting
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Calculate projected next intervals for preview on rating buttons
  const projectedIntervals = useMemo(() => {
    if (!currentWord) return { again: 1, hard: 1, good: 1, easy: 2 };
    const currentSRS = progress[currentWord.id] || INITIAL_SRS_STATE;

    return {
      again: calculateNextSRSState(currentSRS, "again", currentTime, DEFAULT_SRS_CONFIG).interval,
      hard: calculateNextSRSState(currentSRS, "hard", currentTime, DEFAULT_SRS_CONFIG).interval,
      good: calculateNextSRSState(currentSRS, "good", currentTime, DEFAULT_SRS_CONFIG).interval,
      easy: calculateNextSRSState(currentSRS, "easy", currentTime, DEFAULT_SRS_CONFIG).interval,
    };
  }, [currentWord, progress, currentTime]);

  // SRS submission handler with double-submission prevention
  const handleRate = useCallback(
    (rating: SRSRating) => {
      // Guard against race conditions and double submission
      if (!currentWord || isCompleted || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      const currentSRS: UserWordProgress = progress[currentWord.id] || {
        ...INITIAL_SRS_STATE,
        wordId: currentWord.id,
        isLearned: false,
        status: "new",
        history: [],
      };

      // Save previous state for undo capability
      setUndoState({
        wordId: currentWord.id,
        previousProgress: { ...currentSRS },
        queueIndex,
      });

      // Calculate next state using pure SM-2 function
      const updatedProgress = calculateSM2(currentSRS, rating, currentTime, DEFAULT_SRS_CONFIG);

      setProgress((prev) => ({
        ...prev,
        [currentWord.id]: updatedProgress,
      }));

      setIsFlipped(false);

      const nextIndex = queueIndex + 1;
      saveSessionState(nextIndex, dueWords);

      if (nextIndex < dueWords.length) {
        setQueueIndex(nextIndex);
      } else {
        setIsCompleted(true);
        try {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // Safe fallback
        }
      }

      // Unlock after short visual debounce (300ms)
      setTimeout(() => {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }, 300);
    },
    [currentWord, isCompleted, progress, queueIndex, dueWords, currentTime, setProgress, saveSessionState]
  );

  // Undo previous action
  const handleUndo = useCallback(() => {
    if (!undoState || isSubmittingRef.current) return;

    setProgress((prev) => ({
      ...prev,
      [undoState.wordId]: undoState.previousProgress,
    }));
    setQueueIndex(undoState.queueIndex);
    setIsFlipped(false);
    setIsCompleted(false);
    setUndoState(null);

    saveSessionState(undoState.queueIndex, dueWords);
  }, [undoState, setProgress, dueWords, saveSessionState]);

  // Restart session from the beginning
  const handleRestartSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setQueueIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setUndoState(null);
    setIsResumedSession(false);
  }, []);

  // Keyboard Shortcuts: Space (Flip), 1 (Again), 2 (Hard), 3 (Good), 4 (Easy), U (Undo)
  useKeyboardShortcuts({
    onSpace: () => setIsFlipped((prev) => !prev),
    onEnter: () => setIsFlipped((prev) => !prev),
    onOne: () => handleRate("again"),
    onTwo: () => handleRate("hard"),
    onThree: () => handleRate("good"),
    onFour: () => handleRate("easy"),
  });

  // Additional key listener for Undo (U or Backspace)
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

  if (!isMounted) {
    return (
      <div className="container mx-auto max-w-md px-4 py-6 space-y-5 animate-pulse">
        <div className="h-10 bg-muted/60 rounded-xl" />
        <div className="h-6 bg-muted/60 rounded-full w-2/3" />
        <div className="h-2 bg-muted/60 rounded-full" />
        <div className="h-[480px] bg-muted/60 rounded-3xl" />
      </div>
    );
  }

  if (!vocab || vocab.length === 0) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <EmptyState
          icon={CalendarCheck}
          title="All Caught Up!"
          description="There are no flashcards in your collection right now. Explore vocabulary to get started."
          actionLabel="Explore Vocabulary"
          onAction={() => router.push("/vocabulary")}
        />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-primary mx-auto shadow-md">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Review Completed! 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            คุณทบทวนคำศัพท์เสร็จสิ้น {dueWords.length} คำในรอบนี้ อัลกอริทึม SM-2 ได้คำนวณและปรับระยะเวลาทบทวนเรียบร้อยแล้ว
          </p>
        </div>

        {/* Breakdown badge summary */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="rounded-2xl border border-border/80 bg-card p-3 text-center">
            <span className="text-[11px] text-muted-foreground">Due Today</span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{metrics.dueToday}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-3 text-center">
            <span className="text-[11px] text-muted-foreground">New</span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{metrics.newCount}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-3 text-center">
            <span className="text-[11px] text-muted-foreground">Mastered</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{metrics.masteredCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link href="/progress">
            <Button size="lg" className="w-full rounded-2xl gap-2 shadow-md">
              <Sparkles className="h-5 w-5" />
              <span>ดูสถิติความจำ (Analytics)</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={handleRestartSession}
            className="w-full rounded-2xl gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>ทบทวนใหม่อีกรอบ</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-6 space-y-5">
      {/* 1. Header Bar with Title, Undo, and Progress Counter */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Spaced Review</h1>
            {isResumedSession && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20">
                <RefreshCw className="h-2.5 w-2.5" />
                <span>ต่อจากเดิม</span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Enhanced SM-2 Repetition</p>
        </div>

        <div className="flex items-center gap-2">
          {undoState && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={isSubmitting}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              title="Undo last rating (U)"
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

      {/* 2. Due Today, New, and Mastered Badges Bar */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-muted/40 border border-border/60 text-xs">
        <div className="flex items-center gap-1.5" title="คำที่ครบกำหนดทบทวนในวันนี้">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-muted-foreground text-[11px]">Due Today:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
            {metrics.dueToday}
          </span>
        </div>

        <div className="flex items-center gap-1.5" title="คำใหม่ที่ยังไม่ได้เริ่มเรียน">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground text-[11px]">New:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
            {metrics.newCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5" title="คำที่จำได้แม่นยำ (Mastered)">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground text-[11px]">Mastered:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.masteredCount}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={queueIndex + 1} max={dueWords.length} className="h-2" />

      {/* 3. 3D Flashcard */}
      <FlashcardCard
        word={currentWord}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped((prev) => !prev)}
      />

      {/* 4. Enhanced SRS Rating Control Buttons: Again, Hard, Good, Easy */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-4 gap-2">
          {/* Again Button */}
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRate("again")}
            className="flex flex-col h-14 rounded-2xl border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-1 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold">Again</span>
            <span className="text-[10px] opacity-75 font-mono">+{projectedIntervals.again}d (1)</span>
          </Button>

          {/* Hard Button */}
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRate("hard")}
            className="flex flex-col h-14 rounded-2xl border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-1 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold">Hard</span>
            <span className="text-[10px] opacity-75 font-mono">+{projectedIntervals.hard}d (2)</span>
          </Button>

          {/* Good Button */}
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRate("good")}
            className="flex flex-col h-14 rounded-2xl border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-1 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold">Good</span>
            <span className="text-[10px] opacity-75 font-mono">+{projectedIntervals.good}d (3)</span>
          </Button>

          {/* Easy Button */}
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleRate("easy")}
            className="flex flex-col h-14 rounded-2xl border-teal-200 dark:border-teal-900/50 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-600 dark:text-teal-400 p-1 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
          >
            <span className="text-xs font-bold">Easy</span>
            <span className="text-[10px] opacity-75 font-mono">+{projectedIntervals.easy}d (4)</span>
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>
            คีย์ลัด: <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">Space</kbd> พลิก &bull; <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">1-4</kbd> ให้คะแนน &bull; <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">U</kbd> เลิกทำ
          </span>
          <button
            type="button"
            onClick={handleRestartSession}
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer text-[10px]"
            title="เริ่มทบทวนใหม่อีกครั้งตั้งแต่คำแรก"
          >
            เริ่มเซสชันใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
