"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PronunciationButton } from "@/components/audio/pronunciation-button";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { UserWordProgress } from "@/types/srs";
import { calculateSRSMetrics } from "@/lib/srs/sm2";
import {
  Sparkles,
  Repeat,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [vocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [progress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});

  const greeting = (() => {
    if (!isMounted) return "Hello";
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const totalWords = vocab.length;
  const metrics = React.useMemo(() => {
    return calculateSRSMetrics(vocab, progress);
  }, [vocab, progress]);

  const dailyGoal = 10;
  const todayReviewedCount = Math.min(
    dailyGoal,
    Math.max(0, metrics.learningCount + metrics.reviewCount + metrics.masteredCount)
  );

  if (!isMounted) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="rounded-3xl bg-muted/50 border border-border/40 p-6 md:p-8 h-64" />
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-2xl bg-muted/40 h-24 border border-border/40" />
          <div className="rounded-2xl bg-muted/40 h-24 border border-border/40" />
          <div className="rounded-2xl bg-muted/40 h-24 border border-border/40" />
          <div className="rounded-2xl bg-muted/40 h-24 border border-border/40" />
        </div>
        {/* Featured Cards Skeleton */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/30 h-36 border border-border/30" />
          <div className="rounded-2xl bg-muted/30 h-36 border border-border/30" />
          <div className="rounded-2xl bg-muted/30 h-36 border border-border/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-8 animate-in fade-in-50 duration-200">
      {/* Hero / Greeting Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-secondary to-background border border-primary/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personalized SRS Learning</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground" suppressHydrationWarning>
              {greeting}, ready to build your vocabulary?
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg">
              Boost your retention with spaced repetition, native audio accents, and visual memory cues.
            </p>
          </div>

          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
            <Link href="/review" className="w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-2xl gap-2 shadow-md shadow-primary/25 cursor-pointer">
                <Repeat className="h-5 w-5" />
                <span suppressHydrationWarning>Review Due ({metrics.dueToday})</span>
              </Button>
            </Link>
            <Link href="/learn" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full rounded-2xl gap-2 cursor-pointer">
                <Sparkles className="h-5 w-5" />
                <span suppressHydrationWarning>Learn New ({metrics.newCount})</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Daily Goal Bar */}
        <div className="mt-6 rounded-2xl bg-card/80 p-4 border border-border/60 shadow-xs backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="flex items-center gap-1.5 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Study Goal
            </span>
            <span className="text-muted-foreground" suppressHydrationWarning>
              <strong className="text-foreground">{todayReviewedCount}</strong> / {dailyGoal} words
            </span>
          </div>
          <Progress value={todayReviewedCount} max={dailyGoal} className="h-2" />
        </div>
      </section>

      {/* Quick Metrics Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="rounded-2xl border-border/80 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Due for Review</span>
            <Clock className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" suppressHydrationWarning>
            {metrics.dueToday} <span className="text-xs font-normal text-muted-foreground">Cards</span>
          </p>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">New Words</span>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" suppressHydrationWarning>
            {metrics.newCount} <span className="text-xs font-normal text-muted-foreground">Words</span>
          </p>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Mastered</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" suppressHydrationWarning>
            {metrics.masteredCount} <span className="text-xs font-normal text-muted-foreground">Words</span>
          </p>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Library</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground font-mono" suppressHydrationWarning>
            {totalWords} <span className="text-xs font-normal text-muted-foreground">Words</span>
          </p>
        </Card>
      </section>

      {/* Featured Words Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Featured Practice Words</h2>
            <p className="text-xs text-muted-foreground">Listen to pronunciations or tap to study</p>
          </div>
          <Link
            href="/vocabulary"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {vocab.slice(0, 3).map((word) => (
            <Card key={word.id} className="group rounded-2xl border-border/80 hover:border-primary/50 transition-all hover:shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {word.word}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                      {word.cefrLevel}
                    </Badge>
                  </div>
                  <span className="text-xs italic text-muted-foreground">{word.partOfSpeech}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PronunciationButton
                    word={word.word}
                    accent="US"
                    size="sm"
                    audioUrl={word.audioUsUrl || word.audio_us_url}
                    phonetic={word.phoneticUs || word.phonetic_us}
                  />
                  <PronunciationButton
                    word={word.word}
                    accent="UK"
                    size="sm"
                    audioUrl={word.audioUkUrl || word.audio_uk_url}
                    phonetic={word.phoneticUk || word.phonetic_uk}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {word.definition}
                </p>
                {word.translation && (
                  <p className="mt-1 text-xs font-medium text-secondary-foreground line-clamp-1">
                    {word.translation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
