"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { VocabularyWord, CEFRLevel } from "@/types/vocabulary";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PronunciationButton } from "@/components/audio/pronunciation-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { parseVocabularyCsv, parseVocabularyJson, ImportResult } from "@/features/import/importer";
import {
  Search,
  Upload,
  BookA,
  FileCode,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  RotateCcw,
  Shield,
  Lock,
  Unlock,
} from "lucide-react";

const CEFR_TABS: (CEFRLevel | "ALL")[] = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function VocabularyPage() {
  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [search, setSearch] = useState("");
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel | "ALL">("ALL");
  const [filterLockedOnly, setFilterLockedOnly] = useState(false);

  // Count of locked words
  const lockedCount = useMemo(() => {
    return vocab.filter((w) => Boolean(w.isLocked || w.is_locked)).length;
  }, [vocab]);

  // Toggle lock status for a word
  const handleToggleLock = (wordId: string) => {
    setVocab((prev) =>
      prev.map((w) => {
        if (w.id === wordId) {
          const isCurrentlyLocked = Boolean(w.isLocked || w.is_locked);
          return {
            ...w,
            isLocked: !isCurrentlyLocked,
            is_locked: !isCurrentlyLocked,
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      })
    );
  };

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importType, setImportType] = useState<"json" | "csv">("json");
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Filter words
  const filteredWords = useMemo(() => {
    return vocab.filter((w) => {
      const isWordLocked = Boolean(w.isLocked || w.is_locked);
      if (filterLockedOnly && !isWordLocked) return false;

      const matchSearch =
        !search ||
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.definition.toLowerCase().includes(search.toLowerCase()) ||
        w.translation?.toLowerCase().includes(search.toLowerCase()) ||
        w.topic?.toLowerCase().includes(search.toLowerCase());

      const matchCefr = selectedCefr === "ALL" || w.cefrLevel === selectedCefr;

      return matchSearch && matchCefr;
    });
  }, [vocab, search, selectedCefr, filterLockedOnly]);

  const handleTestImport = () => {
    if (!importText.trim()) return;
    if (importType === "json") {
      setImportResult(parseVocabularyJson(importText));
    } else {
      setImportResult(parseVocabularyCsv(importText));
    }
  };

  const handleApplyImport = () => {
    if (!importResult || importResult.words.length === 0) return;
    // Merge without duplicate words (case-insensitive)
    const existingWords = new Set(vocab.map((v) => v.word.toLowerCase().trim()));
    const newUniqueWords = importResult.words.filter(
      (w) => !existingWords.has(w.word.toLowerCase().trim())
    );

    setVocab([...newUniqueWords, ...vocab]);
    setIsImportOpen(false);
    setImportText("");
    setImportResult(null);
  };

  const handleResetToDefault = () => {
    if (confirm("Reset word list back to the default curated set?")) {
      setVocab(INITIAL_VOCABULARY);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header and Import Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Vocabulary Library</h1>
          <p className="text-xs text-muted-foreground">
            Explore, search, and manage your personal word collection ({vocab.length} words)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            title="Reset words"
            className="rounded-xl text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="rounded-xl text-xs gap-1.5 shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Quick Import</span>
          </Button>
          <Link href="/admin/import">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl text-xs gap-1.5 font-semibold"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Admin Import</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and CEFR Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search word, translation, definition, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-card"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* CEFR Level filter pills & Lock Filter */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5">
            {CEFR_TABS.map((tab) => {
              const isSelected = selectedCefr === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedCefr(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setFilterLockedOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border shrink-0 ${
              filterLockedOnly
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
            }`}
            title="กรองแสดงเฉพาะคำที่กดล็อคไว้"
          >
            <Lock className="h-3 w-3" />
            <span>คำที่ล็อค ({lockedCount})</span>
          </button>
        </div>
      </div>

      {/* Notice about Locked words */}
      {lockedCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              คุณมี <strong>{lockedCount} คำ</strong> ที่ล็อคไว้ (คำเหล่านี้จะไม่ถูกเขียนทับหรือเปลี่ยนรูปภาพเวลาคุณนำเข้าไฟล์ CSV ใหม่)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilterLockedOnly((prev) => !prev)}
            className="text-[11px] underline font-bold hover:text-foreground cursor-pointer shrink-0"
          >
            {filterLockedOnly ? "แสดงทั้งหมด" : "ดูคำที่ล็อค"}
          </button>
        </div>
      )}

      {/* Word Grid */}
      {filteredWords.length === 0 ? (
        <EmptyState
          icon={BookA}
          title="No Matching Words Found"
          description={
            filterLockedOnly
              ? "ยังไม่มีคำศัพท์ที่ถูกล็อคไว้ คุณสามารถกดปุ่ม 🔓 บนการ์ดคำศัพท์เพื่อล็อคคำที่ต้องการได้"
              : `We couldn't find any vocabulary matching "${search}". Try searching another keyword or clearing your filter.`
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch("");
            setSelectedCefr("ALL");
            setFilterLockedOnly(false);
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredWords.map((word) => (
            <Card key={word.id} className="rounded-3xl border-border/80 overflow-hidden hover:border-primary/40 transition-all hover:shadow-sm flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{word.word}</h3>
                      <Badge variant="outline" className="text-[10px] px-1.5 uppercase font-mono">
                        {word.cefrLevel}
                      </Badge>
                    </div>
                    <span className="text-xs italic text-muted-foreground">{word.partOfSpeech}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Lock / Unlock button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLock(word.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        word.isLocked || word.is_locked
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs hover:bg-amber-500/25"
                          : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
                      }`}
                      title={
                        word.isLocked || word.is_locked
                          ? "คำนี้ล็อคไว้แล้ว (จะไม่ถูกเขียนทับเมื่อ Import) คลิกเพื่อปลดล็อค"
                          : "คลิกเพื่อล็อคคำนี้ (จะไม่ถูกเขียนทับเมื่อ Import)"
                      }
                    >
                      {word.isLocked || word.is_locked ? (
                        <>
                          <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>ล็อค</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 opacity-60" />
                          <span className="opacity-75">ปลด</span>
                        </>
                      )}
                    </button>

                    <PronunciationButton
                      word={word.word}
                      accent="US"
                      size="sm"
                      phonetic={word.phoneticUs}
                      audioUrl={word.audioUsUrl}
                    />
                    <PronunciationButton
                      word={word.word}
                      accent="UK"
                      size="sm"
                      phonetic={word.phoneticUk}
                      audioUrl={word.audioUkUrl}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground leading-snug">
                    {word.definition}
                  </p>
                  {word.translation && (
                    <p className="text-xs text-secondary-foreground font-semibold">
                      {word.translation}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-muted/40 p-2.5 text-xs italic text-muted-foreground border border-border/40">
                  &ldquo;{word.example}&rdquo;
                </div>

                {word.topic && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-secondary-foreground font-medium">
                      {word.topic}
                    </span>
                    {word.source && (
                      <span className="text-[10px] truncate max-w-[150px] opacity-75">
                        {word.source}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Import Vocabulary</h2>
              </div>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportResult(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste your licensed or personal vocabulary data in JSON or CSV format. Data is validated with Zod before adding.
            </p>

            <div className="flex gap-2">
              <Button
                variant={importType === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("json")}
                className="rounded-xl text-xs gap-1.5"
              >
                <FileCode className="h-3.5 w-3.5" />
                JSON
              </Button>
              <Button
                variant={importType === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("csv")}
                className="rounded-xl text-xs gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                CSV
              </Button>
            </div>

            <textarea
              className="w-full h-44 rounded-2xl border border-input bg-background p-3 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={
                importType === "json"
                  ? '[\n  {\n    "word": "eloquent",\n    "partOfSpeech": "adjective",\n    "cefrLevel": "C1",\n    "definition": "Fluent in speech",\n    "example": "An eloquent speaker."\n  }\n]'
                  : "word,partOfSpeech,cefrLevel,definition,example\neloquent,adjective,C1,Fluent in speech,An eloquent speaker."
              }
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />

            {/* Validation Feedback */}
            {importResult && (
              <div className="rounded-2xl bg-muted/40 p-3 space-y-2 border border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-foreground">
                    Valid Words: {importResult.successCount}
                  </span>
                  {importResult.errorCount > 0 && (
                    <span className="text-destructive font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {importResult.errorCount} Invalid
                    </span>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1 text-destructive font-mono text-[11px] pt-1">
                    {importResult.errors.slice(0, 3).map((err, i) => (
                      <p key={i}>&bull; {err.word ? `"${err.word}": ` : ""}{err.error}</p>
                    ))}
                    {importResult.errors.length > 3 && (
                      <p>+ {importResult.errors.length - 3} more errors...</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestImport}
                disabled={!importText.trim()}
                className="rounded-xl"
              >
                Validate Data
              </Button>
              <Button
                size="sm"
                onClick={handleApplyImport}
                disabled={!importResult || importResult.successCount === 0}
                className="rounded-xl gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Import {importResult ? importResult.successCount : ""} Words</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
