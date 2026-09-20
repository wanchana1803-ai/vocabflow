"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { ImageSearchModal } from "@/components/admin/image-search-modal";
import { VocabularyImage } from "@/components/images/vocabulary-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord, CEFRLevel } from "@/types/vocabulary";
import { updateVocabularyImage } from "@/lib/dal/vocabulary";
import { getAutomaticImageForWord, OUTDATED_IMAGE_URLS } from "@/lib/images/auto-matcher";
import {
  Search,
  ImageIcon,
  RefreshCw,
  Sparkles,
  Link2,
  RotateCcw,
  Check,
  X,
  Lock,
  Unlock,
} from "lucide-react";

export default function AdminImagesPage() {
  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>(
    "vocabflow_words",
    INITIAL_VOCABULARY
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "has_image" | "missing_image" | "locked" | "unlocked">("all");
  const [cefrFilter, setCefrFilter] = useState<CEFRLevel | "ALL">("ALL");

  // Modal & Dialog state
  const [modalWord, setModalWord] = useState<VocabularyWord | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Custom URL Dialog state
  const [customUrlWord, setCustomUrlWord] = useState<VocabularyWord | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [customAltInput, setCustomAltInput] = useState("");
  const [customCreatorInput, setCustomCreatorInput] = useState("");

  // Batch Auto-Fetch state
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, percent: 0 });

  // Filtered words list
  const filteredWords = useMemo(() => {
    return vocab.filter((w) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesWord = w.word.toLowerCase().includes(q);
        const matchesDef = (w.definition || w.definition_en || "").toLowerCase().includes(q);
        const matchesTopic = (w.topic || "").toLowerCase().includes(q);
        if (!matchesWord && !matchesDef && !matchesTopic) return false;
      }

      // 2. CEFR Filter
      if (cefrFilter !== "ALL") {
        const wordCefr = w.cefrLevel || w.cefr_level;
        if (wordCefr !== cefrFilter) return false;
      }

      // 3. Status Filter
      const u = (w.imageUrl || w.image_url || "").trim();
      const hasImg = u !== "" && !OUTDATED_IMAGE_URLS.has(u);
      const isLocked = Boolean(w.isLocked || w.is_locked);
      if (statusFilter === "has_image" && !hasImg) return false;
      if (statusFilter === "missing_image" && hasImg) return false;
      if (statusFilter === "locked" && !isLocked) return false;
      if (statusFilter === "unlocked" && isLocked) return false;

      return true;
    });
  }, [vocab, searchQuery, cefrFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = vocab.length;
    const withImage = vocab.filter((w) => {
      const u = (w.imageUrl || w.image_url || "").trim();
      return u !== "" && !OUTDATED_IMAGE_URLS.has(u);
    }).length;
    const missing = total - withImage;
    const locked = vocab.filter((w) => Boolean(w.isLocked || w.is_locked)).length;
    return { total, withImage, missing, locked };
  }, [vocab]);

  // Toggle word lock status
  const handleToggleLock = (wordId: string) => {
    const updated = vocab.map((item) => {
      if (item.id === wordId) {
        const isCurrentlyLocked = Boolean(item.isLocked || item.is_locked);
        return {
          ...item,
          isLocked: !isCurrentlyLocked,
          is_locked: !isCurrentlyLocked,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    setVocab(updated);
  };

  // Update image in local storage and backend
  const applyImageUpdate = async (
    wordId: string,
    imageDetails: {
      imageUrl: string;
      imageAlt: string;
      sourceName?: string;
      sourceLicense?: string;
    }
  ) => {
    // 1. Update state in LocalStorage
    const updated = vocab.map((item) => {
      if (item.id === wordId) {
        return {
          ...item,
          imageUrl: imageDetails.imageUrl,
          image_url: imageDetails.imageUrl,
          imageAlt: imageDetails.imageAlt,
          image_alt: imageDetails.imageAlt,
          source: imageDetails.sourceName || item.source,
          sourceName: imageDetails.sourceName || item.sourceName,
          source_name: imageDetails.sourceName || item.source_name,
          license: imageDetails.sourceLicense || item.license,
          sourceLicense: imageDetails.sourceLicense || item.sourceLicense,
          source_license: imageDetails.sourceLicense || item.source_license,
          tags: Array.from(new Set([...(item.tags || []), "image-approved"])),
        };
      }
      return item;
    });

    setVocab(updated);

    // 2. Sync to Supabase in background
    await updateVocabularyImage(wordId, imageDetails);
  };

  // Reset image back to cascade default
  const handleResetImage = async (wordId: string) => {
    const updated = vocab.map((item) => {
      if (item.id === wordId) {
        return {
          ...item,
          imageUrl: "",
          image_url: "",
          imageAlt: "",
          image_alt: "",
          source: null,
          sourceName: null,
          source_name: null,
          tags: (item.tags || []).filter((t) => t !== "image-approved"),
        };
      }
      return item;
    });

    setVocab(updated);
    await updateVocabularyImage(wordId, { imageUrl: "", imageAlt: "" });
  };

  // Mark existing image as approved
  const handleApproveImage = (wordId: string) => {
    const updated = vocab.map((item) => {
      if (item.id === wordId) {
        return {
          ...item,
          tags: Array.from(new Set([...(item.tags || []), "image-approved"])),
        };
      }
      return item;
    });
    setVocab(updated);
  };

  // Batch Auto-Fetch or Upgrade Images (Protects locked words!)
  const handleBatchAutoFetch = async (forceAll: boolean = false) => {
    const targetWords = forceAll
      ? vocab.filter((w) => !w.isLocked && !w.is_locked)
      : vocab.filter((w) => {
          if (w.isLocked || w.is_locked) return false;
          const u = (w.imageUrl || w.image_url || "").trim();
          return !u || OUTDATED_IMAGE_URLS.has(u);
        });

    if (targetWords.length === 0) return;

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: targetWords.length, percent: 0 });

    let currentVocabList = [...vocab];

    for (let i = 0; i < targetWords.length; i++) {
      const target = targetWords[i];
      try {
        const auto = getAutomaticImageForWord(
          target.word,
          target.partOfSpeech || target.part_of_speech,
          target.topic,
          target.definition || target.definition_en
        );
        currentVocabList = currentVocabList.map((item) => {
          if (item.id === target.id) {
            return {
              ...item,
              imageUrl: auto.imageUrl,
              image_url: auto.imageUrl,
              imageAlt: auto.imageAlt,
              image_alt: auto.imageAlt,
              source: auto.sourceName,
              sourceName: auto.sourceName,
              source_name: auto.sourceName,
              license: auto.sourceLicense,
              sourceLicense: auto.sourceLicense,
              source_license: auto.sourceLicense,
              tags: Array.from(new Set([...(item.tags || []), "auto-matched"])),
            };
          }
          return item;
        });

        // Background DB sync
        updateVocabularyImage(target.id, {
          imageUrl: auto.imageUrl,
          imageAlt: auto.imageAlt,
          sourceName: auto.sourceName,
          sourceLicense: auto.sourceLicense,
        });
      } catch (err) {
        console.warn("Auto-enrich error for:", target.word, err);
      }

      const currentCount = i + 1;
      const pct = Math.round((currentCount / targetWords.length) * 100);
      setBatchProgress({ current: currentCount, total: targetWords.length, percent: pct });

      // Yield momentarily for smooth UI progress
      if (targetWords.length > 50) {
        if (i % 10 === 0) await new Promise((r) => setTimeout(r, 10));
      } else {
        await new Promise((r) => setTimeout(r, 15));
      }
    }

    setVocab(currentVocabList);
    setIsBatchRunning(false);
  };

  return (
    <AdminGuard>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <AdminNav />

        {/* Header with Title and Action */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ImageIcon className="h-6 w-6" />
              </span>
              จัดการรูปภาพคำศัพท์ (Image Provider & Management)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ระบบจับคู่รูปภาพอัตโนมัติความละเอียดสูงทุกคำศัพท์ พร้อมระบบ Provider Cascade และตรวจเช็คความถูกต้อง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => handleBatchAutoFetch(true)}
              disabled={isBatchRunning || vocab.length === 0}
              variant="outline"
              className="h-11 rounded-2xl gap-2 font-medium border-primary/30 text-primary hover:bg-primary/10"
              title="อัพเดทรูปภาพทุกคำศัพท์ด้วย Semantic AI Matcher รุ่นปรับปรุงใหม่"
            >
              <RefreshCw className={`h-4 w-4 ${isBatchRunning ? "animate-spin" : ""}`} />
              <span>อัพเกรดรูปภาพทุกคำ</span>
            </Button>
            <Button
              type="button"
              onClick={() => handleBatchAutoFetch(false)}
              disabled={isBatchRunning || stats.missing === 0}
              className="h-11 rounded-2xl gap-2 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" />
              <span>⚡ ใส่รูปภาพให้คำที่ขาด ({stats.missing} คำ)</span>
            </Button>
          </div>
        </div>

        {/* Auto-Enrich Notice Banner when words are missing images */}
        {stats.missing > 0 && !isBatchRunning && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  พบคำศัพท์ {stats.missing} คำที่ยังไม่มีรูปภาพประกอบ
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ไม่ต้องเสียเวลากรอกทีละคำ ระบบสามารถวิเคราะห์ความหมายและใส่รูปภาพความละเอียดสูงให้อัตโนมัติในคลิกเดียว
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => handleBatchAutoFetch(false)}
              className="rounded-xl px-4 py-2 font-bold shadow-sm shrink-0 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>ใส่รูปภาพให้ทันที</span>
            </Button>
          </div>
        )}

        {/* Batch Progress Bar */}
        {isBatchRunning && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                กำลังค้นหาและจับคู่รูปภาพคำศัพท์...
              </span>
              <span>
                {batchProgress.current} / {batchProgress.total} ({batchProgress.percent}%)
              </span>
            </div>
            <Progress value={batchProgress.percent} className="h-2 rounded-full" />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl border border-border/80 bg-card p-4 text-center">
            <p className="text-2xl font-extrabold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">คำศัพท์ทั้งหมด</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.withImage}
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">มีรูปภาพบันทึกแล้ว</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.missing}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">ใช้ Category Fallback</p>
          </div>
          <div className="rounded-2xl border border-amber-600/20 bg-amber-500/10 p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1">
              <Lock className="h-5 w-5" />
              <span>{stats.locked}</span>
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 font-medium">คำที่ล็อคไว้ (ห้ามทับ)</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามคำศัพท์, นิยาม หรือหัวข้อ..."
              className="pl-10 h-11 rounded-2xl bg-muted/40 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-11 rounded-2xl border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">สถานะรูปภาพทั้งหมด</option>
              <option value="has_image">มีรูปภาพแล้ว</option>
              <option value="missing_image">ยังไม่มีรูปภาพ</option>
              <option value="locked">🔒 ล็อคแล้ว ({stats.locked})</option>
              <option value="unlocked">🔓 ยังไม่ล็อค ({stats.total - stats.locked})</option>
            </select>

            <select
              value={cefrFilter}
              onChange={(e) => setCefrFilter(e.target.value as CEFRLevel | "ALL")}
              className="h-11 rounded-2xl border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">ทุกระดับ CEFR</option>
              <option value="A1">ระดับ A1</option>
              <option value="A2">ระดับ A2</option>
              <option value="B1">ระดับ B1</option>
              <option value="B2">ระดับ B2</option>
              <option value="C1">ระดับ C1</option>
              <option value="C2">ระดับ C2</option>
            </select>
          </div>
        </div>

        {/* Vocabulary Image Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word) => {
            const hasCustomImage = Boolean(word.imageUrl || word.image_url);
            const isApproved = (word.tags || []).includes("image-approved");
            const isLocked = Boolean(word.isLocked || word.is_locked);

            return (
              <div
                key={word.id}
                className="group relative flex flex-col rounded-3xl border border-border/80 bg-card p-4 shadow-sm hover:shadow-md transition-all"
              >
                {/* Image Preview Container */}
                <div className="relative mb-3 w-full">
                  <VocabularyImage
                    imageUrl={word.imageUrl || word.image_url}
                    imageAlt={word.imageAlt || word.image_alt || word.word}
                    word={word.word}
                    partOfSpeech={word.partOfSpeech || word.part_of_speech}
                    definition={word.definition || word.definition_en}
                    topic={word.topic}
                    creator={word.source || word.sourceName || word.source_name}
                    sourceName={word.source || word.sourceName || word.source_name}
                    license={word.license || word.sourceLicense || word.source_license}
                    aspectRatio="video"
                    className="rounded-2xl"
                  />

                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1">
                    {hasCustomImage ? (
                      <Badge className="bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-md">
                        {word.source || word.sourceName || "DB Image"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] backdrop-blur-md">
                        Fallback Placeholder
                      </Badge>
                    )}
                    {isApproved && (
                      <Badge className="bg-blue-600/90 text-white text-[10px] font-semibold gap-0.5">
                        <Check className="h-2.5 w-2.5" />
                        Approved
                      </Badge>
                    )}
                    {isLocked && (
                      <Badge className="bg-amber-600/90 text-white text-[10px] font-semibold gap-1 backdrop-blur-md">
                        <Lock className="h-2.5 w-2.5" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Word Info */}
                <div className="flex-1 pb-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-foreground">{word.word}</h3>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {word.cefrLevel || word.cefr_level || "B1"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {word.partOfSpeech || word.part_of_speech}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {word.definition || word.definition_en || "No definition available"}
                  </p>
                  {word.translation && (
                    <p className="text-xs text-primary/90 mt-0.5 line-clamp-1 font-medium">
                      แปล: {word.translation || word.definition_th}
                    </p>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Search Alternatives Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModalWord(word);
                        setIsSearchModalOpen(true);
                      }}
                      className="h-8 rounded-xl text-xs px-2.5 gap-1"
                      title="ค้นหารูปทางเลือก"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>ค้นหา</span>
                    </Button>

                    {/* Custom URL Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomUrlWord(word);
                        setCustomUrlInput(word.imageUrl || word.image_url || "");
                        setCustomAltInput(word.imageAlt || word.image_alt || "");
                        setCustomCreatorInput(word.source || word.sourceName || "");
                      }}
                      className="h-8 rounded-xl text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                      title="ใส่ Direct Image URL"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>URL</span>
                    </Button>

                    {/* Lock / Unlock Toggle Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLock(word.id)}
                      className={`h-8 rounded-xl text-xs px-2 gap-1 ${
                        isLocked
                          ? "text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      title={
                        isLocked
                          ? "คำนี้ล็อคอยู่ (จะไม่ถูกแก้ไขหรือเปลี่ยนรูปเมื่อ Import) คลิกเพื่อปลดล็อค"
                          : "คลิกเพื่อล็อคคำนี้ (จะไม่ถูกแก้ไขเมื่อ Import)"
                      }
                    >
                      {isLocked ? (
                        <>
                          <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>ล็อค</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 opacity-60" />
                          <span className="opacity-70">ปลด</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Approve Button */}
                    {!isApproved && hasCustomImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveImage(word.id)}
                        className="h-8 rounded-xl text-xs px-2 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                        title="อนุมัติรูปนี้"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>อนุมัติ</span>
                      </Button>
                    )}

                    {/* Reset Button */}
                    {hasCustomImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResetImage(word.id)}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="รีเซ็ตกลับเป็นค่าเริ่มต้น"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredWords.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center text-muted-foreground my-8">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
            <p className="text-sm font-semibold">ไม่พบคำศัพท์ที่ตรงตามเงื่อนไข</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              ลองเปลี่ยนคำค้นหาหรือตัวกรอง
            </p>
          </div>
        )}

        {/* Modal: Search Alternatives */}
        <ImageSearchModal
          isOpen={isSearchModalOpen}
          word={modalWord}
          onClose={() => {
            setIsSearchModalOpen(false);
            setModalWord(null);
          }}
          onSelectImage={(wordId, imageDetails) => {
            applyImageUpdate(wordId, imageDetails);
          }}
        />

        {/* Dialog: Custom URL Input */}
        {customUrlWord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setCustomUrlWord(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span>ระบุ URL รูปภาพสำหรับ &ldquo;{customUrlWord.word}&rdquo;</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCustomUrlWord(null)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Image URL *</label>
                  <Input
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="h-10 rounded-xl text-xs"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Alt Text (คำอธิบายภาพ)</label>
                  <Input
                    value={customAltInput}
                    onChange={(e) => setCustomAltInput(e.target.value)}
                    placeholder={`Photo representing ${customUrlWord.word}`}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Creator / Attribution (เจ้าของภาพ/แหล่งที่มา)</label>
                  <Input
                    value={customCreatorInput}
                    onChange={(e) => setCustomCreatorInput(e.target.value)}
                    placeholder="e.g. Unsplash, Photographer Name"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Preview */}
              {customUrlInput.trim() && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border/80 bg-muted/40">
                  <Image
                    src={customUrlInput.trim()}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                    onError={() => {}}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomUrlWord(null)}
                  className="rounded-xl text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!customUrlInput.trim()}
                  onClick={() => {
                    applyImageUpdate(customUrlWord.id, {
                      imageUrl: customUrlInput.trim(),
                      imageAlt: customAltInput.trim() || `Photo for ${customUrlWord.word}`,
                      sourceName: customCreatorInput.trim() || "Custom URL",
                    });
                    setCustomUrlWord(null);
                  }}
                  className="rounded-xl text-xs font-semibold gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>บันทึกรูปภาพ</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
