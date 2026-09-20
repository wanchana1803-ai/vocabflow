"use client";

import React, { useState, useRef } from "react";
import { VocabularyWord } from "@/types/vocabulary";
import { FlashcardFront } from "./flashcard-front";
import { FlashcardBack } from "./flashcard-back";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  word: VocabularyWord;
  nextImageUrl?: string | null;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onToggleLock?: (wordId: string) => void;
  className?: string;
}

export function Flashcard({
  word,
  nextImageUrl,
  isFlipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  onToggleLock,
  className,
}: FlashcardProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  // Mobile Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // If horizontal movement is dominant, apply gentle resistance translation
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Limit swipe preview translation to max +/- 40px
      const clampedOffset = Math.max(-40, Math.min(40, diffX * 0.35));
      setSwipeOffset(clampedOffset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    // Trigger threshold: 50px horizontal swipe
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // Swiped Left -> Next / Advance
        onSwipeLeft?.();
      } else {
        // Swiped Right -> Previous / Undo
        onSwipeRight?.();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setSwipeOffset(0);
  };

  return (
    <div
      className={cn(
        "perspective-1000 w-full max-w-xl mx-auto h-[480px] sm:h-[540px] md:h-[580px] cursor-pointer select-none transition-transform",
        className
      )}
      onClick={onFlip}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard for ${word.word}. ${isFlipped ? "Showing back meaning." : "Showing front word. Click to flip."}`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={cn(
          "flashcard-inner relative h-full w-full transform-style-3d duration-500 ease-in-out",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front Face */}
        <div className="backface-hidden absolute inset-0 h-full w-full">
          <FlashcardFront
            word={word}
            nextImageUrl={nextImageUrl}
            onFlip={onFlip}
            onToggleLock={onToggleLock}
          />
        </div>

        {/* Back Face */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 h-full w-full">
          <FlashcardBack
            word={word}
            onFlip={onFlip}
          />
        </div>
      </div>
    </div>
  );
}
