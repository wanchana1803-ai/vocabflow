"use client";

import React from "react";
import { VocabularyWord } from "@/types/vocabulary";
import { VocabularyImage } from "@/components/images/vocabulary-image";
import { PronunciationButton } from "@/components/audio/pronunciation-button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardFrontProps {
  word: VocabularyWord;
  nextImageUrl?: string | null;
  onFlip?: () => void;
  onToggleLock?: (wordId: string) => void;
  className?: string;
}

export function FlashcardFront({
  word,
  nextImageUrl,
  onFlip,
  onToggleLock,
  className,
}: FlashcardFrontProps) {
  const phoneticUk = word.phoneticUk || word.phonetic_uk;
  const phoneticUs = word.phoneticUs || word.phonetic_us;
  const audioUk = word.audioUkUrl || word.audio_uk_url;
  const audioUs = word.audioUsUrl || word.audio_us_url;
  const imageUrl = word.imageUrl || word.image_url;
  const imageAlt = word.imageAlt || word.image_alt;
  const partOfSpeech = word.partOfSpeech || word.part_of_speech || "word";
  const isLocked = Boolean(word.isLocked || word.is_locked);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 md:p-6 shadow-xl transition-all",
        className
      )}
    >
      {/* Top Header: Part of Speech & Topic */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary border border-primary/20"
          >
            {partOfSpeech}
          </Badge>
          {word.topic && (
            <span className="text-xs font-medium text-muted-foreground line-clamp-1">
              {word.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Lock Button */}
          {onToggleLock && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(word.id);
              }}
              className={`inline-flex items-center gap-1 text-xs transition-colors cursor-pointer py-1 px-2 rounded-md ${
                isLocked
                  ? "text-amber-600 dark:text-amber-400 bg-amber-500/15 font-semibold hover:bg-amber-500/25 border border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
              title={
                isLocked
                  ? "คำนี้ล็อคไว้แล้ว (จะไม่ถูกเขียนทับเมื่อ Import) คลิกเพื่อปลดล็อค"
                  : "คลิกเพื่อล็อคคำนี้ (จะไม่ถูกเขียนทับเมื่อ Import)"
              }
            >
              {isLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>ล็อคแล้ว</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 opacity-60" />
                  <span className="hidden sm:inline opacity-75">ล็อคคำนี้</span>
                </>
              )}
            </button>
          )}

          {/* Flip Hint button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlip?.();
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-secondary/60"
            title="พลิกการ์ด (Space)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">พลิกการ์ด</span>
          </button>
        </div>
      </div>

      {/* Center Image: Large & Zero CLS */}
      <div className="my-auto w-full py-2">
        <VocabularyImage
          imageUrl={imageUrl}
          imageAlt={imageAlt || `Visual for ${word.word}`}
          word={word.word}
          partOfSpeech={partOfSpeech}
          definition={word.definition || word.definition_en}
          topic={word.topic}
          creator={word.source || word.sourceName || word.source_name}
          sourceName={word.source || word.sourceName || word.source_name}
          license={word.license || word.sourceLicense || word.source_license}
          nextImageUrl={nextImageUrl}
          aspectRatio="card"
          className="max-h-[260px] md:max-h-[300px] w-full shadow-inner"
        />
      </div>

      {/* Bottom Area: Word, Phonetics & Audio Pronunciation */}
      <div className="flex flex-col items-center justify-center pt-2 text-center">
        {/* Main Word */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          {word.word}
        </h2>

        {/* Phonetic Transcriptions (UK & US) */}
        {(phoneticUk || phoneticUs) && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground font-mono">
            {phoneticUs && (
              <span className="rounded bg-muted/60 px-1.5 py-0.5" title="US IPA">
                🇺🇸 {phoneticUs}
              </span>
            )}
            {phoneticUk && phoneticUk !== phoneticUs && (
              <span className="rounded bg-muted/60 px-1.5 py-0.5" title="UK IPA">
                🇬🇧 {phoneticUk}
              </span>
            )}
          </div>
        )}

        {/* Audio Pronunciation Buttons */}
        <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3">
          <PronunciationButton
            word={word.word}
            accent="US"
            audioUrl={audioUs}
            phonetic={phoneticUs}
            size="md"
          />
          <PronunciationButton
            word={word.word}
            accent="UK"
            audioUrl={audioUk}
            phonetic={phoneticUk}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
