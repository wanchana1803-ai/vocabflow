"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FlashcardSkeletonProps {
  className?: string;
}

export function FlashcardSkeleton({ className }: FlashcardSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto h-[480px] sm:h-[540px] md:h-[580px] rounded-3xl border border-border/80 bg-card p-5 md:p-6 shadow-xl animate-pulse flex flex-col justify-between",
        className
      )}
      aria-label="Loading flashcard"
    >
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 rounded-lg bg-muted" />
          <div className="h-4 w-24 rounded bg-muted/60" />
        </div>
        <div className="h-6 w-20 rounded bg-muted/60" />
      </div>

      {/* Center Image Skeleton */}
      <div className="my-auto w-full py-2">
        <div className="h-[220px] sm:h-[260px] md:h-[280px] w-full rounded-2xl bg-muted/70 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>

      {/* Bottom Area Skeleton */}
      <div className="flex flex-col items-center justify-center pt-2 gap-3">
        <div className="h-10 w-48 rounded-xl bg-muted" />
        <div className="h-4 w-32 rounded bg-muted/60" />
        <div className="flex items-center gap-3 mt-1">
          <div className="h-8 w-24 rounded-xl bg-muted/80" />
          <div className="h-8 w-24 rounded-xl bg-muted/80" />
        </div>
      </div>
    </div>
  );
}
