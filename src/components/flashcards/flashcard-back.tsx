"use client";

import React from "react";
import { VocabularyWord } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Quote, Tag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardBackProps {
  word: VocabularyWord;
  onFlip?: () => void;
  className?: string;
}

const CEFR_COLORS: Record<string, string> = {
  A1: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  A2: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  B1: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  B2: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  C1: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  C2: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function FlashcardBack({ word, onFlip, className }: FlashcardBackProps) {
  const definitionTh =
    word.definitionTh ||
    word.translation ||
    word.definition_th;

  const definitionEn =
    word.definitionEn ||
    word.definition ||
    word.definition_en;

  const example =
    word.exampleSentence ||
    word.example ||
    word.example_sentence;

  const exampleTh =
    word.exampleTranslationTh ||
    word.exampleTranslation ||
    word.example_translation_th;

  const cefrLevel = (word.cefrLevel || word.cefr_level || "A1").toUpperCase();
  const cefrClass = CEFR_COLORS[cefrLevel] || CEFR_COLORS.A1;
  const rawTags = word.tags || [];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === "string" && (rawTags as string).trim()
    ? (rawTags as string).split(/[;,]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-between overflow-y-auto rounded-3xl border border-border/80 bg-card p-5 md:p-6 shadow-xl transition-all",
        className
      )}
    >
      {/* Top Bar: CEFR Badge, Word reminder & Flip Back action */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-lg border px-2.5 py-0.5 text-xs font-bold tracking-wider",
              cefrClass
            )}
          >
            {cefrLevel}
          </span>
          <span className="text-base font-bold text-foreground truncate">
            {word.word}
          </span>
          <span className="text-xs italic text-muted-foreground">
            ({word.partOfSpeech || word.part_of_speech})
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFlip?.();
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-secondary/60"
          title="พลิกกลับ (Space)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">ด้านหน้า</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="my-auto flex flex-col gap-4 py-4">
        {/* 1. Thai Definition (Prominent) */}
        <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary/80 block mb-1">
            คำแปลภาษาไทย
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {definitionTh || "ไม่มีคำแปลภาษาไทย"}
          </p>
        </div>

        {/* 2. English Definition */}
        {definitionEn && (
          <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>English Meaning</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-medium">
              {definitionEn}
            </p>
          </div>
        )}

        {/* 3. Example Sentence & Thai Translation */}
        {example && (
          <div className="rounded-xl border border-secondary bg-secondary/30 p-3.5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
              <Quote className="h-3.5 w-3.5 rotate-180" />
              <span>Example Sentence</span>
            </div>
            <p className="text-sm sm:text-base italic text-foreground font-serif leading-relaxed">
              &ldquo;{example}&rdquo;
            </p>
            {exampleTh && (
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground border-t border-border/30 pt-1.5">
                {exampleTh}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Area: Topic & Tags */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {word.topic && (
            <Badge variant="outline" className="text-[11px] font-medium bg-background">
              📁 {word.topic}
            </Badge>
          )}
          {tags.slice(0, 3).map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-[10px] font-normal text-muted-foreground bg-muted/60"
            >
              <Tag className="mr-1 h-2.5 w-2.5" />
              {tag}
            </Badge>
          ))}
        </div>

        <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
          กดปุ่ม 1-4 เพื่อประเมินความจำ
        </span>
      </div>
    </div>
  );
}
