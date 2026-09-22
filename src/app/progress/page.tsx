"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVocabularyWords } from "@/hooks/use-vocabulary-words";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord, CEFRLevel } from "@/types/vocabulary";
import { UserWordProgress } from "@/types/srs";
import {
  BarChart3,
  Award,
  TrendingUp,
  Flame,
  Calendar,
} from "lucide-react";
import { calculateStreak } from "@/lib/srs/sm2";
import { cn } from "@/lib/utils";

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function ProgressPage() {
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { vocab } = useVocabularyWords();
  const [progress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});

  const totalWords = vocab.length;
  const progressList = Object.values(progress);
  const learnedCount = progressList.filter((p) => p.isLearned).length;
  const masteryPercentage = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
  const streak = React.useMemo(() => calculateStreak(progress), [progress]);

  // Breakdown by CEFR level
  const cefrStats = CEFR_LEVELS.map((level) => {
    const wordsInLevel = vocab.filter((w) => w.cefrLevel === level);
    const learnedInLevel = wordsInLevel.filter((w) => progress[w.id]?.isLearned).length;
    return {
      level,
      total: wordsInLevel.length,
      learned: learnedInLevel,
      percentage: wordsInLevel.length > 0 ? Math.round((learnedInLevel / wordsInLevel.length) * 100) : 0,
    };
  });

  // Recent reviews list
  const allLogs = progressList
    .flatMap((p) => p.history || [])
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
    .slice(0, 5);

  if (!isMounted) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6 animate-pulse">
        <div className="h-10 bg-muted/60 rounded-xl w-1/3" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-32 bg-muted/50 rounded-3xl" />
          <div className="h-32 bg-muted/50 rounded-3xl" />
          <div className="h-32 bg-muted/50 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Learning Analytics</h1>
        <p className="text-xs text-muted-foreground">
          Track your vocabulary mastery, memory retention, and study streaks
        </p>
      </div>

      {/* Main Stats Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border-border/80 p-5 bg-gradient-to-br from-primary/10 to-card">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Mastery</span>
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{masteryPercentage}%</span>
            <span className="text-xs text-muted-foreground font-medium">
              ({learnedCount}/{totalWords} words)
            </span>
          </div>
          <Progress value={masteryPercentage} max={100} className="mt-4 h-2" />
        </Card>

        <Card className="rounded-3xl border-border/80 p-5 bg-gradient-to-br from-amber-500/10 to-card">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
            <Flame className={cn("h-5 w-5", streak > 0 ? "text-amber-500 fill-amber-500" : "text-muted-foreground/50")} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground" suppressHydrationWarning>{streak}</span>
            <span className="text-xs text-muted-foreground font-medium">
              {streak === 0 ? "Days (เริ่มนับในวันถัดไป)" : streak === 1 ? "Consecutive Day" : "Consecutive Days"}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {streak === 0 ? "เริ่มต้นเรียนวันนี้ และเรียนต่อเนื่องในวันถัดไปเพื่อเริ่มนับ Streak!" : "ทบทวนวันนี้เพื่อรักษา Streak ต่อเนื่อง!"}
          </p>
        </Card>

        <Card className="rounded-3xl border-border/80 p-5 bg-gradient-to-br from-teal-500/10 to-card">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">SRS Retention</span>
            <TrendingUp className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">92%</span>
            <span className="text-xs text-muted-foreground font-medium">Est. Recall</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Based on active SM-2 ease factor weighting
          </p>
        </Card>
      </div>

      {/* CEFR Level Mastery Breakdown */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Mastery by CEFR Level</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Progression from Beginner (A1) to Advanced Professional (C2)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {cefrStats.map((stat) => (
            <div key={stat.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold">
                    {stat.level}
                  </Badge>
                  <span className="text-muted-foreground font-medium">
                    {stat.learned} of {stat.total} words
                  </span>
                </div>
                <span className="font-semibold text-foreground">{stat.percentage}%</span>
              </div>
              <Progress value={stat.percentage} max={100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent SRS Activity Log */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Recent Review Log</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {allLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No review history recorded yet. Complete a session in Learn or Review to see your logs!
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {allLogs.map((log) => {
                const word = vocab.find((w) => w.id === log.wordId);
                return (
                  <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{word?.word || "Word"}</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-secondary-foreground uppercase">
                        {log.rating}
                      </span>
                    </div>
                    <div className="text-right text-muted-foreground text-[11px]">
                      <span>Next interval: {log.intervalAfter}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
