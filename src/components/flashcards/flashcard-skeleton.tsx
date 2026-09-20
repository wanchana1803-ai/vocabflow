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
        "w-full max-w-xl mx-auto h-[480px] sm:h-[540px] md:h-[580px] rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xl animate-pulse flex flex-col justify-between",
        className
      )}
      aria-label="Loading flashcard"
    >
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 rounded-lg bg-muted" />
          <div className="h-6 w-12 rounded-lg bg-muted/60" />
          <div className="h-4 w-24 rounded bg-muted/60" />
        </div>
        <div className="h-6 w-20 rounded bg-muted/60" />
      </div>

      {/* Center Typography Skeleton */}
      <div className="my-auto flex flex-col items-center justify-center py-6 gap-4">
        <div className="h-14 w-64 sm:w-80 rounded-2xl bg-muted" />
        <div className="h-6 w-44 rounded-lg bg-muted/60" />
        <div className="flex items-center gap-3 mt-3">
          <div className="h-10 w-24 rounded-xl bg-muted/80" />
          <div className="h-10 w-24 rounded-xl bg-muted/80" />
        </div>
      </div>

      {/* Bottom Area Skeleton */}
      <div className="flex items-center justify-center pt-3 border-t border-border/40">
        <div className="h-4 w-48 rounded bg-muted/60" />
      </div>
    </div>
  );
}
