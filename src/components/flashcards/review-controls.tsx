"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SRSRating } from "@/types/srs";
import {
  RotateCcw,
  SkipForward,
  Undo2,
  ThumbsDown,
  AlertTriangle,
  ThumbsUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewControlsProps {
  onRate: (rating: SRSRating) => void;
  onFlip: () => void;
  onUndo?: () => void;
  onSkip?: () => void;
  isFlipped: boolean;
  canUndo?: boolean;
  className?: string;
}

export function ReviewControls({
  onRate,
  onFlip,
  onUndo,
  onSkip,
  isFlipped,
  canUndo = false,
  className,
}: ReviewControlsProps) {
  return (
    <div className={cn("flex flex-col gap-3 w-full max-w-xl mx-auto select-none", className)}>
      {/* Primary Action / SRS Rating Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {/* 1. Again (1) */}
        <Button
          type="button"
          onClick={() => onRate("again")}
          variant="outline"
          className="group relative flex flex-col items-center justify-center py-5 h-auto rounded-2xl border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/60 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-sm sm:text-base">
            <ThumbsDown className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Again</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">ลืม / จำไม่ได้</span>
          <kbd className="absolute top-1.5 right-1.5 rounded border border-rose-500/30 bg-rose-500/10 px-1.5 text-[10px] font-mono text-rose-600 dark:text-rose-400">
            1
          </kbd>
        </Button>

        {/* 2. Hard (2) */}
        <Button
          type="button"
          onClick={() => onRate("hard")}
          variant="outline"
          className="group relative flex flex-col items-center justify-center py-5 h-auto rounded-2xl border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/60 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm sm:text-base">
            <AlertTriangle className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Hard</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">นึกยาก</span>
          <kbd className="absolute top-1.5 right-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
            2
          </kbd>
        </Button>

        {/* 3. Good (3) */}
        <Button
          type="button"
          onClick={() => onRate("good")}
          variant="outline"
          className="group relative flex flex-col items-center justify-center py-5 h-auto rounded-2xl border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/60 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">
            <ThumbsUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Good</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">จำได้ดี</span>
          <kbd className="absolute top-1.5 right-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            3
          </kbd>
        </Button>

        {/* 4. Easy (4) */}
        <Button
          type="button"
          onClick={() => onRate("easy")}
          variant="outline"
          className="group relative flex flex-col items-center justify-center py-5 h-auto rounded-2xl border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/60 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">
            <Sparkles className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Easy</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">ง่ายมาก</span>
          <kbd className="absolute top-1.5 right-1.5 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 text-[10px] font-mono text-blue-600 dark:text-blue-400">
            4
          </kbd>
        </Button>
      </div>

      {/* Auxiliary Buttons: Undo, Flip Card, Skip */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Undo Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-xl"
          title="ย้อนกลับการ์ดก่อนหน้า"
        >
          <Undo2 className="mr-1.5 h-4 w-4" />
          <span>ย้อนกลับ</span>
        </Button>

        {/* Flip Button */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onFlip}
          className="rounded-xl px-4 text-xs font-semibold shadow-sm hover:bg-secondary/80 active:scale-95 transition-all"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-primary" />
          <span>{isFlipped ? "ดูด้านหน้า" : "พลิกดูความหมาย"}</span>
          <kbd className="ml-2 hidden sm:inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border">
            Space
          </kbd>
        </Button>

        {/* Skip Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
          title="ข้ามคำนี้ไปก่อน"
        >
          <span>ข้าม</span>
          <SkipForward className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
