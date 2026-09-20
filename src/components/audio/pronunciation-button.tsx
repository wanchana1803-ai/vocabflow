"use client";

import React, { useState } from "react";
import { Volume2, Loader2, AlertCircle } from "lucide-react";
import { playPronunciation, AccentType } from "@/lib/audio/speech";
import { cn } from "@/lib/utils";

interface PronunciationButtonProps {
  word: string;
  accent?: AccentType;
  audioUrl?: string | null;
  phonetic?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PronunciationButton({
  word,
  accent = "US",
  audioUrl,
  phonetic,
  className,
  size = "md",
}: PronunciationButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setHasError(false);
    playPronunciation({
      text: word,
      accent,
      audioUrl,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => {
        setIsPlaying(false);
        setHasError(true);
        setTimeout(() => setHasError(false), 3000);
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={isPlaying}
      aria-label={`Listen to ${accent} pronunciation for ${word}`}
      title={`Play ${accent} pronunciation`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isPlaying && "border-primary bg-secondary/80 text-primary ring-1 ring-primary",
        hasError && "border-destructive text-destructive",
        size === "lg" && "px-3.5 py-1.5 text-sm",
        className
      )}
    >
      {isPlaying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      ) : hasError ? (
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      ) : (
        <Volume2 className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
      )}
      <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
        {accent}
      </span>
      {phonetic && (
        <span className="font-mono text-muted-foreground/90 font-normal">
          {phonetic}
        </span>
      )}
    </button>
  );
}
