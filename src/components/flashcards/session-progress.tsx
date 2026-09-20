"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionProgressProps {
  currentIndex: number;
  totalWords: number;
  learnedInSession?: number;
  streakDays?: number;
  className?: string;
}

export function SessionProgress({
  currentIndex,
  totalWords,
  learnedInSession = 0,
  streakDays = 1,
  className,
}: SessionProgressProps) {
  const currentNumber = totalWords > 0 ? currentIndex + 1 : 0;
  const remainingWords = Math.max(0, totalWords - currentIndex - 1);
  const percent = totalWords > 0 ? Math.round((currentNumber / totalWords) * 100) : 0;

  return (
    <div className={cn("flex flex-col gap-2 w-full max-w-xl mx-auto select-none", className)}>
      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground" suppressHydrationWarning>
            คำที่ {currentNumber} / {totalWords}
          </span>
          <Badge
            variant="outline"
            className="text-[11px] font-medium bg-secondary/50 text-foreground border-border/60"
            suppressHydrationWarning
          >
            เหลืออีก {remainingWords} คำ
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {learnedInSession > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>เรียนแล้ว {learnedInSession}</span>
            </span>
          )}
          {streakDays > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Flame className="h-3.5 w-3.5 fill-current" />
              <span>{streakDays} วัน</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar with smooth animation */}
      <div className="relative" suppressHydrationWarning>
        <Progress value={percent} className="h-2 rounded-full bg-secondary overflow-hidden" />
      </div>
    </div>
  );
}
