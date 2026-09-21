"use client";

import React, { useState, useRef, useEffect } from "react";
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
  isDefault?: boolean;
}

export function PronunciationButton({
  word,
  accent = "US",
  audioUrl,
  phonetic,
  className,
  size = "md",
  isDefault = false,
}: PronunciationButtonProps) {
  const [playbackState, setPlaybackState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const handlePlay = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();

    // Replay capability: even if playing, pressing again stops and restarts
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setErrorMessage(null);

    playPronunciation({
      text: word,
      accent,
      audioUrl,
      onLoading: () => setPlaybackState("loading"),
      onStart: () => setPlaybackState("playing"),
      onEnd: () => setPlaybackState("idle"),
      onError: (msg) => {
        setPlaybackState("error");
        setErrorMessage(msg);
        errorTimerRef.current = setTimeout(() => {
          setPlaybackState("idle");
          setErrorMessage(null);
        }, 4000);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      handlePlay();
    }
  };

  const accentLabel = accent === "UK" ? "British English (UK)" : "American English (US)";

  return (
    <button
      type="button"
      onClick={handlePlay}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`ฟังเสียงอ่านคำว่า "${word}" สำเนียง ${accentLabel}${phonetic ? ` คำอ่าน ${phonetic}` : ""}`}
      aria-busy={playbackState === "loading"}
      title={errorMessage || `ฟังเสียงอ่านสำเนียง ${accent} (กดซ้ำเพื่อเล่นใหม่)`}
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground transition-all cursor-pointer select-none",
        "hover:bg-secondary hover:border-primary/40 hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        playbackState === "playing" && "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30",
        playbackState === "loading" && "border-primary/50 bg-secondary/50 text-muted-foreground",
        playbackState === "error" && "border-destructive/60 bg-destructive/10 text-destructive",
        isDefault && playbackState === "idle" && "border-primary/30 bg-primary/5",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "lg" && "px-3.5 py-1.5 text-sm",
        className
      )}
    >
      {playbackState === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
      ) : playbackState === "error" ? (
        <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
      ) : (
        <Volume2
          className={cn(
            "h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform shrink-0",
            playbackState === "playing" && "animate-pulse scale-110 text-primary"
          )}
        />
      )}

      {/* Accent badge */}
      <span className={cn(
        "font-bold text-[10px] uppercase tracking-wider",
        playbackState === "playing" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {accent}
      </span>

      {/* Phonetic guide if provided */}
      {phonetic && (
        <span className="font-mono text-muted-foreground/85 font-normal text-[11px] truncate max-w-[110px]">
          {phonetic}
        </span>
      )}

      {/* Polite Error Tooltip */}
      {playbackState === "error" && errorMessage && (
        <span
          role="alert"
          className="sr-only"
        >
          {errorMessage}
        </span>
      )}
    </button>
  );
}
