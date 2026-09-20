"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
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
import { deleteVocabulary } from "@/lib/dal/vocabulary";
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
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

const CEFR_TABS: (CEFRLevel | "ALL")[] = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function VocabularyPage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [search, setSearch] = useState("");
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel | "ALL">("ALL");
  const [filterLockedOnly, setFilterLockedOnly] = useState(false);

  // Admin & Delete State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem("vocabflow_admin_unlocked") === "true";
    } catch {
      return false;
    }
  });
  const [wordToDelete, setWordToDelete] = useState<VocabularyWord | null>(null);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Header Admin Unlock Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [headerAdminInput, setHeaderAdminInput] = useState("");
  const [headerAdminError, setHeaderAdminError] = useState("");

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

  const handleRequestDelete = (word: VocabularyWord) => {
    setWordToDelete(word);
    setPasscodeError("");
    setAdminPasscodeInput("");
  };

  const handleConfirmDelete = async () => {
    if (!wordToDelete) return;

    if (!isAdminUnlocked) {
      const p = adminPasscodeInput.trim();
      if (p === "admin123" || p === "vocabflow-admin") {
        setIsAdminUnlocked(true);
        try {
          window.sessionStorage.setItem("vocabflow_admin_unlocked", "true");
        } catch {
          // ignore
        }
      } else {
        setPasscodeError("รหัสผ่าน Admin ไม่ถูกต้อง (ทดลองใช้: admin123)");
        return;
      }
    }

    const wordName = wordToDelete.word;
    const wordId = wordToDelete.id;

    // 1. Remove from vocabulary list
    setVocab((prev) => prev.filter((w) => w.id !== wordId));

    // 2. Remove from progress storage if exists
    try {
      const rawProgress = window.localStorage.getItem("vocabflow_progress");
      if (rawProgress) {
        const progressMap = JSON.parse(rawProgress);
        if (progressMap[wordId]) {
          delete progressMap[wordId];
          window.localStorage.setItem("vocabflow_progress", JSON.stringify(progressMap));
        }
      }
    } catch {
      // ignore
    }

    // 3. Call DAL delete
    await deleteVocabulary(wordId);

    // 4. Close dialog and notify
    setWordToDelete(null);
    setAdminPasscodeInput("");
    setDeleteToast(`ลบคำศัพท์ "${wordName}" ออกจากคลังเรียบร้อยแล้ว`);
    setTimeout(() => setDeleteToast(null), 4000);
  };

  const handleHeaderAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const p = headerAdminInput.trim();
    if (p === "admin123" || p === "vocabflow-admin") {
      setIsAdminUnlocked(true);
      try {
        window.sessionStorage.setItem("vocabflow_admin_unlocked", "true");
      } catch {
        // ignore
      }
      setIsAdminModalOpen(false);
      setHeaderAdminInput("");
      setHeaderAdminError("");
      setDeleteToast("ปลดล็อคสิทธิ์แอดมินสำเร็จ! ตอนนี้คุณสามารถกดยืนยันลบคำศัพท์ได้ทันที");
      setTimeout(() => setDeleteToast(null), 4000);
    } else {
      setHeaderAdminError("รหัสผ่านไม่ถูกต้อง (ทดลองใช้: admin123)");
    }
  };

  // Prevent hydration mismatch by rendering a skeleton until mounted on client
  if (!isMounted) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-56 rounded-xl bg-muted animate-pulse mb-2" />
            <div className="h-4 w-72 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-28 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-11 w-full rounded-2xl bg-muted/60 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl border border-border/60 bg-card p-5 animate-pulse flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-6 w-32 rounded-lg bg-muted" />
                  <div className="h-6 w-16 rounded-lg bg-muted/60" />
                </div>
                <div className="h-4 w-3/4 rounded bg-muted/70" />
                <div className="h-4 w-1/2 rounded bg-muted/50" />
              </div>
              <div className="pt-3 border-t border-border/40 flex justify-between">
                <div className="h-7 w-20 rounded-lg bg-muted/60" />
                <div className="h-7 w-24 rounded-lg bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Delete Success Toast */}
      {deleteToast && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{deleteToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteToast(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Vocabulary Library</h1>
            {isAdminUnlocked ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold py-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Admin Mode</span>
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore, search, and manage your personal word collection ({vocab.length} words)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Unlock Indicator / Button */}
          {!isAdminUnlocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHeaderAdminError("");
                setHeaderAdminInput("");
                setIsAdminModalOpen(true);
              }}
              title="ปลดล็อคสิทธิ์แอดมินเพื่อลบคำศัพท์ได้สะดวก"
              className="rounded-xl text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>ปลดล็อค Admin</span>
            </Button>
          )}

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
              คุณมี <strong>{lockedCount} คำ</strong> ที่ล็อคไว้ (คำเหล่านี้จะไม่ถูกเขียนทับเวลาคุณนำเข้าไฟล์ CSV ใหม่)
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
              ? "ยังไม่มีคำศัพท์ที่ถูกล็อคไว้ คุณสามารถกดปุ่ม 🔒 บนการ์ดคำศัพท์เพื่อล็อคคำที่ต้องการได้"
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
              <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Card Header: Word, CEFR, Part of Speech & Audio Pronunciation */}
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
                      <PronunciationButton
                        word={word.word}
                        accent="US"
                        size="sm"
                        phonetic={word.phoneticUs || word.phonetic_us}
                        audioUrl={word.audioUsUrl || word.audio_us_url}
                      />
                      <PronunciationButton
                        word={word.word}
                        accent="UK"
                        size="sm"
                        phonetic={word.phoneticUk || word.phonetic_uk}
                        audioUrl={word.audioUkUrl || word.audio_uk_url}
                      />
                    </div>
                  </div>

                  {/* Definitions & Translation */}
                  <div className="space-y-1.5 mt-3">
                    <p className="text-xs font-medium text-foreground leading-snug">
                      {word.definition}
                    </p>
                    {word.translation && (
                      <p className="text-xs text-secondary-foreground font-semibold">
                        แปล: {word.translation}
                      </p>
                    )}
                  </div>

                  {/* Example sentence */}
                  {word.example && (
                    <div className="rounded-xl bg-muted/40 p-2.5 text-xs italic text-muted-foreground border border-border/40 mt-3">
                      &ldquo;{word.example}&rdquo;
                    </div>
                  )}

                  {/* Topic & Source */}
                  {word.topic && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
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
                </div>

                {/* Card Action Footer: Lock status on left, Big Red Delete Button on right */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-3">
                  {/* Lock / Unlock Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleLock(word.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                        <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>ล็อคแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5 opacity-60" />
                        <span className="opacity-75">ปลดล็อค</span>
                      </>
                    )}
                  </button>

                  {/* Prominent Red Delete Word Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRequestDelete(word)}
                    className="h-8 px-3 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold gap-1.5 transition-all cursor-pointer shadow-xs"
                    title={`ลบคำว่า "${word.word}" ออกจากคลัง (Admin)`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบคำนี้</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Import Modal */}
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
                className="text-muted-foreground hover:text-foreground cursor-pointer"
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

      {/* Header Admin Unlock Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <KeyRound className="h-5 w-5" />
                <h2 className="text-lg font-bold">ปลดล็อคโหมด Admin</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleHeaderAdminUnlock} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                กรอกรหัสผ่าน Admin เพื่อให้สามารถลบคำศัพท์ได้โดยตรงโดยไม่ต้องยืนยันซ้ำ
              </p>

              <Input
                type="password"
                placeholder="รหัสผ่าน Admin (ทดลองใช้: admin123)"
                value={headerAdminInput}
                onChange={(e) => {
                  setHeaderAdminInput(e.target.value);
                  setHeaderAdminError("");
                }}
                className="h-10 rounded-xl text-xs bg-background"
                autoFocus
              />

              {headerAdminError && (
                <p className="text-[11px] text-destructive font-medium">
                  {headerAdminError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 font-semibold"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>ปลดล็อค</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {wordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                <h2 className="text-lg font-bold">ยืนยันการลบคำศัพท์</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWordToDelete(null);
                  setPasscodeError("");
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {wordToDelete.word}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    {wordToDelete.cefrLevel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {wordToDelete.definition}
                </p>
                {wordToDelete.translation && (
                  <p className="text-xs text-foreground font-semibold">
                    แปล: {wordToDelete.translation}
                  </p>
                )}
              </div>

              {(wordToDelete.isLocked || wordToDelete.is_locked) && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong>คำเตือน:</strong> คำนี้ถูกล็อคไว้ หากกดยืนยัน คำนี้จะถูกลบออกจากระบบอย่างถาวร
                  </span>
                </div>
              )}

              {/* Admin authentication if not yet authenticated */}
              {!isAdminUnlocked && (
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>กรุณากรอกรหัสผ่าน Admin เพื่อยืนยัน</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="รหัสผ่าน Admin (เช่น admin123)"
                    value={adminPasscodeInput}
                    onChange={(e) => {
                      setAdminPasscodeInput(e.target.value);
                      setPasscodeError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmDelete();
                      }
                    }}
                    className="h-10 rounded-xl text-xs bg-background"
                    autoFocus
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-destructive font-medium">
                      {passcodeError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWordToDelete(null);
                  setPasscodeError("");
                }}
                className="rounded-xl text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="rounded-xl text-xs gap-1.5 font-semibold shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>ยืนยันการลบ</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
