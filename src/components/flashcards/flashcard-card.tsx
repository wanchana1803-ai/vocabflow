"use client";

import React from "react";
import { VocabularyWord } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";
import { PronunciationButton } from "@/components/audio/pronunciation-button";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface FlashcardCardProps {
  word: VocabularyWord;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}

export function FlashcardCard({
  word,
  isFlipped,
  onFlip,
  className,
}: FlashcardCardProps) {
  const [preferredAccent] = useLocalStorage<"US" | "UK">("vocabflow_accent", "US");

  const phoneticUs = word.phoneticUs || word.phonetic_us;
  const phoneticUk = word.phoneticUk || word.phonetic_uk;
  const audioUs = word.audioUsUrl || word.audio_us_url;
  const audioUk = word.audioUkUrl || word.audio_uk_url;

  const getCefrVariant = (level: string) => {
    switch (level) {
      case "A1":
        return "cefrA1";
      case "A2":
        return "cefrA2";
      case "B1":
        return "cefrB1";
      case "B2":
        return "cefrB2";
      case "C1":
        return "cefrC1";
      case "C2":
        return "cefrC2";
      default:
        return "default";
    }
  };

  return (
    <div
      className={cn(
        "perspective-1000 relative w-full max-w-md mx-auto h-[480px] select-none cursor-pointer",
        className
      )}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard for ${word.word}. Press Space or click to ${isFlipped ? "show front" : "reveal definition"}.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={cn(
          "transform-style-3d relative h-full w-full rounded-3xl transition-transform duration-500 ease-out",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* FRONT OF CARD */}
        <div
          className={cn(
            "backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-6 shadow-md transition-shadow hover:shadow-lg"
          )}
        >
          {/* Top metadata tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getCefrVariant(word.cefrLevel)}>
                {word.cefrLevel}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {word.partOfSpeech}
              </span>
            </div>
            {word.topic && (
              <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs text-secondary-foreground">
                {word.topic}
              </span>
            )}
          </div>

          {/* Word and Pronunciation */}
          <div className="text-center my-auto py-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {word.word}
            </h2>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <PronunciationButton
                word={word.word}
                accent="US"
                phonetic={phoneticUs}
                audioUrl={audioUs}
                isDefault={preferredAccent === "US"}
              />
              <PronunciationButton
                word={word.word}
                accent="UK"
                phonetic={phoneticUk}
                audioUrl={audioUk}
                isDefault={preferredAccent === "UK"}
              />
            </div>
          </div>

          {/* Flip Hint */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <RotateCw className="h-3.5 w-3.5 animate-spin-slow" />
            <span>Tap card or press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-[10px]">Space</kbd> to reveal meaning</span>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div
          className={cn(
            "backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl border border-primary/30 bg-gradient-to-b from-card via-card to-secondary/20 p-6 shadow-md"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">{word.word}</span>
              <Badge variant={getCefrVariant(word.cefrLevel)}>
                {word.cefrLevel}
              </Badge>
            </div>
            <span className="text-xs italic text-muted-foreground">
              {word.partOfSpeech}
            </span>
          </div>

          {/* Core Content */}
          <div className="my-auto space-y-4 overflow-y-auto pr-1">
            {/* English Definition */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Definition
              </h4>
              <p className="text-base font-medium leading-snug text-foreground">
                {word.definition}
              </p>
            </div>

            {/* Thai Translation */}
            {word.translation && (
              <div className="space-y-1 rounded-2xl bg-secondary/50 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/80">
                  คำแปล (Translation)
                </h4>
                <p className="text-base font-semibold text-secondary-foreground">
                  {word.translation}
                </p>
              </div>
            )}

            {/* Example Sentence */}
            <div className="space-y-1 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Example
              </h4>
              <p className="text-sm italic text-foreground leading-relaxed">
                &ldquo;{word.example}&rdquo;
              </p>
              {word.exampleTranslation && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {word.exampleTranslation}
                </p>
              )}
            </div>
          </div>

          {/* Flip Hint */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <RotateCw className="h-3.5 w-3.5" />
            <span>Tap to flip back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
