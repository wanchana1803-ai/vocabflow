"use client";

import React, { useState, useMemo, useSyncExternalStore, useEffect, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { VocabularyWord, CEFRLevel, PartOfSpeech } from "@/types/vocabulary";
import { UserWordProgress, WordSRSStatus } from "@/types/srs";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PronunciationButton } from "@/components/audio/pronunciation-button";
import { EmptyState } from "@/components/feedback/empty-state";
import { isCardDue } from "@/lib/srs/sm2";
import {
  Search,
  BookA,
  X,
  ShieldCheck,
  Star,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";

const CEFR_TABS: (CEFRLevel | "ALL")[] = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2"];

const PART_OF_SPEECH_LIST: { value: PartOfSpeech | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conjunction" },
  { value: "idiom", label: "Idiom" },
  { value: "phrase", label: "Phrase" },
];

const CEFR_GRADIENTS: Record<string, string> = {
  A1: "from-emerald-500/20 to-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  A2: "from-teal-500/20 to-teal-600/10 text-teal-700 dark:text-teal-400 border-teal-500/30",
  B1: "from-blue-500/20 to-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  B2: "from-indigo-500/20 to-indigo-600/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  C1: "from-purple-500/20 to-purple-600/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  C2: "from-rose-500/20 to-rose-600/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
};

export default function VocabularyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl px-4 py-8 animate-pulse space-y-6">
          <div className="h-10 bg-muted/60 rounded-2xl w-48" />
          <div className="h-14 bg-muted/40 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-44 bg-muted/30 rounded-3xl" />
            <div className="h-44 bg-muted/30 rounded-3xl" />
            <div className="h-44 bg-muted/30 rounded-3xl" />
          </div>
        </div>
      }
    >
      <VocabularyContent />
    </Suspense>
  );
}

function VocabularyContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [vocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [progress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>("vocabflow_bookmarks", []);
  const [preferredAccent] = useLocalStorage<"US" | "UK">("vocabflow_accent", "US");
  const [showThai] = useLocalStorage<boolean>("vocabflow_show_thai", true);


  // Read URL params or fallback to defaults
  const initialSearch = searchParams.get("q") || "";
  const initialCefr = (searchParams.get("cefr") as CEFRLevel | "ALL") || "ALL";
  const initialPos = (searchParams.get("pos") as PartOfSpeech | "ALL") || "ALL";
  const initialTopic = searchParams.get("topic") || "ALL";
  const initialStatus = searchParams.get("status") || "ALL";
  const initialSort = searchParams.get("sort") || "latest";
  const initialView = (searchParams.get("view") as "grid" | "list") || "grid";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // Search, Filter & View States
  const [search, setSearch] = useState(initialSearch);
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel | "ALL">(initialCefr);
  const [selectedPos, setSelectedPos] = useState<PartOfSpeech | "ALL">(initialPos);
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [sortOrder, setSortOrder] = useState<string>(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialView);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(24);

  // Word Details Modal State
  const [selectedWordForDetails, setSelectedWordForDetails] = useState<VocabularyWord | null>(null);
  const { isAdmin } = useAuth();

  // Sync state changes with URL query parameters
  useEffect(() => {
    if (!isMounted) return;

    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedCefr !== "ALL") params.set("cefr", selectedCefr);
    if (selectedPos !== "ALL") params.set("pos", selectedPos);
    if (selectedTopic !== "ALL") params.set("topic", selectedTopic);
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (sortOrder !== "latest") params.set("sort", sortOrder);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [
    isMounted,
    pathname,
    search,
    selectedCefr,
    selectedPos,
    selectedTopic,
    selectedStatus,
    sortOrder,
    viewMode,
    currentPage,
  ]);

  // Extract unique topics from vocabulary
  const availableTopics = useMemo(() => {
    const topicsSet = new Set<string>();
    vocab.forEach((w) => {
      if (w.topic && w.topic.trim()) topicsSet.add(w.topic.trim());
    });
    return Array.from(topicsSet).sort();
  }, [vocab]);

  // Toggle bookmark
  const handleToggleBookmark = (wordId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarks((prev) =>
      prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId]
    );
  };

  // Filter and sort vocabulary
  const filteredAndSortedWords = useMemo(() => {
    const now = new Date();

    const filtered = vocab.filter((w) => {
      const isBookmarked = bookmarks.includes(w.id);
      const p = progress[w.id];
      const wordStatus: WordSRSStatus = p?.status || (p?.isLearned ? "learning" : "new");

      // 1. Status Filter
      if (selectedStatus === "bookmarked" && !isBookmarked) return false;
      if (selectedStatus === "locked" && !w.isLocked && !w.is_locked) return false;
      if (selectedStatus === "due" && (!p || !p.isLearned || !isCardDue(p, now))) return false;
      if (
        selectedStatus !== "ALL" &&
        selectedStatus !== "bookmarked" &&
        selectedStatus !== "locked" &&
        selectedStatus !== "due" &&
        wordStatus !== selectedStatus
      ) {
        return false;
      }

      // 2. CEFR Filter
      if (selectedCefr !== "ALL" && w.cefrLevel !== selectedCefr) return false;

      // 3. Part of Speech Filter
      const pos = w.partOfSpeech || w.part_of_speech;
      if (selectedPos !== "ALL" && pos?.toLowerCase() !== selectedPos.toLowerCase()) {
        return false;
      }

      // 4. Topic Filter
      if (selectedTopic !== "ALL" && w.topic !== selectedTopic) return false;

      // 5. Search Filter (word, definition, translation, topic, tags)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchWord = w.word.toLowerCase().includes(q);
        const matchDef = (w.definition || w.definitionEn || w.definition_en || "").toLowerCase().includes(q);
        const matchTrans = (w.translation || w.definitionTh || w.definition_th || "").toLowerCase().includes(q);
        const matchTopic = (w.topic || "").toLowerCase().includes(q);
        const matchTags = Array.isArray(w.tags) && w.tags.some((t) => t.toLowerCase().includes(q));

        if (!matchWord && !matchDef && !matchTrans && !matchTopic && !matchTags) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    return filtered.sort((a, b) => {
      if (sortOrder === "alphabetical-asc") {
        return a.word.localeCompare(b.word);
      }
      if (sortOrder === "alphabetical-desc") {
        return b.word.localeCompare(a.word);
      }
      if (sortOrder === "cefr-asc") {
        return a.cefrLevel.localeCompare(b.cefrLevel);
      }
      if (sortOrder === "cefr-desc") {
        return b.cefrLevel.localeCompare(a.cefrLevel);
      }
      if (sortOrder === "due-date") {
        const aDue = progress[a.id]?.nextReviewDate || "9999";
        const bDue = progress[b.id]?.nextReviewDate || "9999";
        return aDue.localeCompare(bDue);
      }
      // "latest" default
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }, [vocab, search, selectedCefr, selectedPos, selectedTopic, selectedStatus, sortOrder, bookmarks, progress]);

  // Pagination calculation
  const totalItems = filteredAndSortedWords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedWords = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredAndSortedWords.slice(start, start + pageSize);
  }, [filteredAndSortedWords, currentPageSafe, pageSize]);

  // Reset page to 1 when filters change
  const handleFilterChange = <T,>(setter: (val: T) => void, val: T) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-6">
      {/* Top Header: Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <span>Vocabulary Explorer</span>
            <Badge variant="secondary" className="text-xs font-mono font-bold" suppressHydrationWarning>
              {isMounted ? totalItems : INITIAL_VOCABULARY.length} Words
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            ค้นหา กรองคำศัพท์ตามระดับ CEFR และฟังเสียงอ่านสำเนียง US/UK
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/vocabulary">
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                title="ไปยังหน้าจัดการคำศัพท์ (เพิ่ม/แก้ไข/ลบ/นำเข้า) สำหรับแอดมิน"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>จัดการคำศัพท์ (Admin Portal)</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <Card className="rounded-3xl border-border/80 shadow-xs bg-card/90">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Row 1: Search Input + View Toggles */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาคำศัพท์, คำแปลไทย, ความหมายอังกฤษ, หัวข้อ..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-background text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleFilterChange(setSearch, "")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Grid vs List View Toggle */}
            <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-muted/60 p-1 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-background text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-background text-primary shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Row 2: CEFR Level Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">CEFR:</span>
            {CEFR_TABS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleFilterChange(setSelectedCefr, level)}
                className={`rounded-xl px-3 py-1 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCefr === level
                    ? "bg-primary text-primary-foreground shadow-xs scale-105"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Row 3: Dropdowns for Part of Speech, Topic, Status, and Sort */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* Part of Speech */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Type</label>
              <select
                value={selectedPos}
                onChange={(e) => handleFilterChange(setSelectedPos, e.target.value as PartOfSpeech | "ALL")}
                className="w-full h-9 rounded-xl border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {PART_OF_SPEECH_LIST.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => handleFilterChange(setSelectedTopic, e.target.value)}
                className="w-full h-9 rounded-xl border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Topics</option>
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
                className="w-full h-9 rounded-xl border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="new">New (ยังไม่เริ่ม)</option>
                <option value="learning">Learning (กำลังเรียน)</option>
                <option value="review">Review (ทบทวน)</option>
                <option value="mastered">Mastered (แม่นยำ)</option>
                <option value="due">Due Today (ครบกำหนด)</option>
                <option value="bookmarked">Bookmarked (ติดดาว)</option>
                <option value="locked">Locked (ล็อคแล้ว)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => handleFilterChange(setSortOrder, e.target.value)}
                className="w-full h-9 rounded-xl border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="latest">Latest Added</option>
                <option value="alphabetical-asc">A ➔ Z</option>
                <option value="alphabetical-desc">Z ➔ A</option>
                <option value="cefr-asc">Level (A1 ➔ C2)</option>
                <option value="cefr-desc">Level (C2 ➔ A1)</option>
                <option value="due-date">Due Date</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {paginatedWords.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={BookA}
            title="ไม่พบคำศัพท์ที่ค้นหา"
            description="ลองปรับคำค้นหา หรือรีเซ็ตตัวกรองระดับ CEFR / ชนิดของคำ เพื่อค้นหาคำศัพท์อีกครั้ง"
            actionLabel="ล้างตัวกรองทั้งหมด"
            onAction={() => {
              setSearch("");
              setSelectedCefr("ALL");
              setSelectedPos("ALL");
              setSelectedTopic("ALL");
              setSelectedStatus("ALL");
              setSortOrder("latest");
              setCurrentPage(1);
            }}
          />
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedWords.map((word) => {
            const isBookmarked = bookmarks.includes(word.id);
            const isWordLocked = Boolean(word.isLocked || word.is_locked);
            const cefrGradient = CEFR_GRADIENTS[word.cefrLevel] || CEFR_GRADIENTS.A1;
            const initials = word.word.slice(0, 2).toUpperCase();

            return (
              <Card
                key={word.id}
                onClick={() => setSelectedWordForDetails(word)}
                className="group rounded-3xl border-border/80 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden bg-card"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                  {/* Card Header with Thumbnail & Quick Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Typographic Thumbnail Badge */}
                      <div
                        className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${cefrGradient} border flex items-center justify-center font-black text-sm tracking-wider shadow-xs shrink-0 select-none`}
                        title={`CEFR Level ${word.cefrLevel}`}
                      >
                        {initials}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {word.word}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono font-bold uppercase">
                            {word.cefrLevel}
                          </Badge>
                          <span className="text-xs italic text-muted-foreground truncate">
                            {word.partOfSpeech || word.part_of_speech}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bookmark & Lock indicators */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(word.id, e)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          isBookmarked
                            ? "text-amber-500 fill-amber-500 hover:bg-amber-500/15"
                            : "text-muted-foreground/40 hover:text-amber-500 hover:bg-muted"
                        }`}
                        title={isBookmarked ? "นำออกจากคำที่ติดดาว" : "ติดดาวคำนี้"}
                      >
                        <Star className={`h-4 w-4 ${isBookmarked ? "fill-amber-500" : ""}`} />
                      </button>

                      {isWordLocked && (
                        <span title="คำนี้ถูกตั้งค่าล็อคไว้" className="text-amber-600 dark:text-amber-400 p-1">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Definitions & Translation */}
                  <div className="space-y-1.5 py-1">
                    {word.translation &&
                      (showThai ? (
                        <p className="text-sm font-semibold text-secondary-foreground leading-snug">
                          {word.translation}
                        </p>
                      ) : (
                        <p
                          className="text-xs font-medium text-muted-foreground/70 filter blur-[4px] hover:blur-none transition-all duration-200 cursor-pointer select-none"
                          title="แตะหรือชี้เพื่อดูคำแปลภาษาไทย (โหมดฝึกภาษาอังกฤษล้วน)"
                        >
                          {word.translation}
                        </p>
                      ))}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {word.definition}
                    </p>
                  </div>

                  {/* Footer Audio Pronunciation Buttons */}
                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t border-border/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <PronunciationButton
                        word={word.word}
                        accent="US"
                        size="sm"
                        phonetic={word.phoneticUs || word.phonetic_us}
                        audioUrl={word.audioUsUrl || word.audio_us_url}
                        isDefault={preferredAccent === "US"}
                      />
                      <PronunciationButton
                        word={word.word}
                        accent="UK"
                        size="sm"
                        phonetic={word.phoneticUk || word.phonetic_uk}
                        audioUrl={word.audioUkUrl || word.audio_uk_url}
                        isDefault={preferredAccent === "UK"}
                      />
                    </div>

                    {word.topic && (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg truncate max-w-[90px]">
                        {word.topic}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs divide-y divide-border/60">
          {paginatedWords.map((word) => {
            const isBookmarked = bookmarks.includes(word.id);
            const cefrGradient = CEFR_GRADIENTS[word.cefrLevel] || CEFR_GRADIENTS.A1;
            const initials = word.word.slice(0, 2).toUpperCase();

            return (
              <div
                key={word.id}
                onClick={() => setSelectedWordForDetails(word)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Typographic Thumbnail */}
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cefrGradient} border flex items-center justify-center font-bold text-xs shrink-0 select-none`}
                  >
                    {initials}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground truncate">
                        {word.word}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold px-1.5 py-0 uppercase">
                        {word.cefrLevel}
                      </Badge>
                      <span className="text-xs italic text-muted-foreground truncate">
                        ({word.partOfSpeech || word.part_of_speech})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {word.translation &&
                        (showThai ? (
                          <span className="font-medium text-foreground">{word.translation}</span>
                        ) : (
                          <span
                            className="font-medium text-muted-foreground/70 filter blur-[3px] hover:blur-none transition-all duration-200 cursor-pointer select-none"
                            title="แตะหรือชี้เพื่อดูคำแปลไทย"
                          >
                            {word.translation}
                          </span>
                        ))}
                      {word.translation && <span className="text-muted-foreground">&bull;</span>}
                      <span className="text-muted-foreground truncate">{word.definition}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                  <PronunciationButton
                    word={word.word}
                    accent="US"
                    size="sm"
                    audioUrl={word.audioUsUrl || word.audio_us_url}
                  />
                  <PronunciationButton
                    word={word.word}
                    accent="UK"
                    size="sm"
                    audioUrl={word.audioUkUrl || word.audio_uk_url}
                  />
                  <button
                    type="button"
                    onClick={(e) => handleToggleBookmark(word.id, e)}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      isBookmarked ? "text-amber-500 hover:bg-amber-500/15" : "text-muted-foreground hover:text-amber-500"
                    }`}
                    title={isBookmarked ? "Unbookmark" : "Bookmark"}
                  >
                    <Star className={`h-4 w-4 ${isBookmarked ? "fill-amber-500" : ""}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-border/80 bg-background px-2 text-xs font-semibold cursor-pointer"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
            <span>คำต่อหน้า (ทั้งหมด {totalItems} คำ)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPageSafe <= 1}
              className="h-8 w-8 p-0 rounded-xl"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-muted/60 font-mono">
              {currentPageSafe} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageSafe >= totalPages}
              className="h-8 w-8 p-0 rounded-xl"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Word Details Modal */}
      {selectedWordForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedWordForDetails(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header: Title, Level & Part of Speech */}
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {selectedWordForDetails.word}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="font-mono font-bold uppercase text-xs">
                    {selectedWordForDetails.cefrLevel}
                  </Badge>
                  <span className="text-xs italic text-muted-foreground">
                    {selectedWordForDetails.partOfSpeech || selectedWordForDetails.part_of_speech}
                  </span>
                  {selectedWordForDetails.topic && (
                    <Badge variant="secondary" className="text-[11px]">
                      {selectedWordForDetails.topic}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(selectedWordForDetails.id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    bookmarks.includes(selectedWordForDetails.id)
                      ? "border-amber-500 bg-amber-500/15 text-amber-500"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  title="Bookmark"
                >
                  <Star className={`h-4 w-4 ${bookmarks.includes(selectedWordForDetails.id) ? "fill-amber-500" : ""}`} />
                </button>
                {(selectedWordForDetails.isLocked || selectedWordForDetails.is_locked) && (
                  <span
                    className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    title="คำนี้ถูกตั้งค่าล็อคไว้"
                  >
                    <Lock className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>

            {/* Pronunciations */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
              <PronunciationButton
                word={selectedWordForDetails.word}
                accent="US"
                phonetic={selectedWordForDetails.phoneticUs || selectedWordForDetails.phonetic_us}
                audioUrl={selectedWordForDetails.audioUsUrl || selectedWordForDetails.audio_us_url}
              />
              <PronunciationButton
                word={selectedWordForDetails.word}
                accent="UK"
                phonetic={selectedWordForDetails.phoneticUk || selectedWordForDetails.phonetic_uk}
                audioUrl={selectedWordForDetails.audioUkUrl || selectedWordForDetails.audio_uk_url}
              />
            </div>

            {/* Meanings */}
            <div className="space-y-3 text-sm">
              {selectedWordForDetails.translation && (
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3.5">
                  <span className="text-[11px] font-bold text-primary block mb-0.5">
                    คำแปลภาษาไทย
                  </span>
                  <p className="text-lg font-bold text-foreground">
                    {selectedWordForDetails.translation}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-muted/30 border border-border/50 p-3.5 space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  English Meaning
                </span>
                <p className="text-foreground leading-relaxed">
                  {selectedWordForDetails.definition}
                </p>
              </div>

              {selectedWordForDetails.example && (
                <div className="rounded-2xl bg-secondary/40 border border-secondary p-3.5 space-y-1">
                  <span className="text-[11px] font-bold text-primary block">
                    ตัวอย่างประโยค
                  </span>
                  <p className="italic text-foreground font-serif">
                    &ldquo;{selectedWordForDetails.example}&rdquo;
                  </p>
                  {selectedWordForDetails.exampleTranslation && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                      {selectedWordForDetails.exampleTranslation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWordForDetails(null)}
                className="rounded-2xl text-xs font-medium"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
