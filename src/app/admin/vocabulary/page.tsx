"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PronunciationButton } from "@/components/audio/pronunciation-button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVocabularyWords, broadcastVocabularyUpdate } from "@/hooks/use-vocabulary-words";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord, CEFRLevel, PartOfSpeech } from "@/types/vocabulary";
import { AdminAuditLog } from "@/types/auth";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Download,
  Eye,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  Volume2,
  ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  A2: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
  B1: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  B2: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  C1: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  C2: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

export default function AdminVocabularyPage() {
  const { vocab, setVocab, isLoading, refresh } = useVocabularyWords();
  const [search, setSearch] = useState("");
  const [selectedCefr, setSelectedCefr] = useState<CEFRLevel | "ALL">("ALL");

  // Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [viewingWord, setViewingWord] = useState<VocabularyWord | null>(null);
  const [wordToDelete, setWordToDelete] = useState<VocabularyWord | null>(null);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formWord, setFormWord] = useState("");
  const [formPos, setFormPos] = useState<PartOfSpeech>("noun");
  const [formCefr, setFormCefr] = useState<CEFRLevel>("A1");
  const [formDefEn, setFormDefEn] = useState("");
  const [formDefTh, setFormDefTh] = useState("");
  const [formExample, setFormExample] = useState("");
  const [formExampleTh, setFormExampleTh] = useState("");
  const [formPhoneticUs, setFormPhoneticUs] = useState("");
  const [formPhoneticUk, setFormPhoneticUk] = useState("");
  const [formAudioUs, setFormAudioUs] = useState("");
  const [formAudioUk, setFormAudioUk] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageAlt, setFormImageAlt] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formTags, setFormTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const resetForm = () => {
    setFormWord("");
    setFormPos("noun");
    setFormCefr("A1");
    setFormDefEn("");
    setFormDefTh("");
    setFormExample("");
    setFormExampleTh("");
    setFormPhoneticUs("");
    setFormPhoneticUk("");
    setFormAudioUs("");
    setFormAudioUk("");
    setFormImageUrl("");
    setFormImageAlt("");
    setFormTopic("");
    setFormTags("");
    setErrorMessage(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (word: VocabularyWord) => {
    resetForm();
    setEditingWord(word);
    setFormWord(word.word);
    setFormPos((word.partOfSpeech || word.part_of_speech || "noun") as PartOfSpeech);
    setFormCefr((word.cefrLevel || word.cefr_level || "A1") as CEFRLevel);
    setFormDefEn(word.definitionEn || word.definition || "");
    setFormDefTh(word.definitionTh || word.translation || "");
    setFormExample(word.exampleSentence || word.example || "");
    setFormExampleTh(word.exampleTranslationTh || word.exampleTranslation || "");
    setFormPhoneticUs(word.phoneticUs || word.phonetic_us || "");
    setFormPhoneticUk(word.phoneticUk || word.phonetic_uk || "");
    setFormAudioUs(word.audioUsUrl || word.audio_us_url || "");
    setFormAudioUk(word.audioUkUrl || word.audio_uk_url || "");
    setFormImageUrl(word.imageUrl || word.image_url || "");
    setFormImageAlt(word.imageAlt || word.image_alt || "");
    setFormTopic(word.topic || "");
    setFormTags(Array.isArray(word.tags) ? word.tags.join(", ") : "");
  };

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/audit-logs?limit=40");
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Handle Save Word (Add or Edit)
  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim() || !formDefEn.trim()) {
      setErrorMessage("กรุณากรอกคำศัพท์และความหมายภาษาอังกฤษ");
      return;
    }

    // Duplicate Check
    const normalized = formWord.trim().toLowerCase();
    const isDuplicate = vocab.some(
      (w) =>
        w.word.toLowerCase() === normalized &&
        (w.partOfSpeech || w.part_of_speech) === formPos &&
        w.id !== editingWord?.id
    );

    if (isDuplicate) {
      setErrorMessage(`คำศัพท์ "${formWord}" (${formPos}) มีอยู่ในระบบแล้ว`);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const wordPayload = {
      id: editingWord?.id,
      word: formWord.trim(),
      normalizedWord: normalized,
      partOfSpeech: formPos,
      cefrLevel: formCefr,
      definitionEn: formDefEn.trim(),
      definition: formDefEn.trim(),
      definitionTh: formDefTh.trim() || null,
      translation: formDefTh.trim() || null,
      exampleSentence: formExample.trim(),
      example: formExample.trim(),
      exampleTranslationTh: formExampleTh.trim() || null,
      exampleTranslation: formExampleTh.trim() || null,
      phoneticUs: formPhoneticUs.trim() || null,
      phoneticUk: formPhoneticUk.trim() || null,
      audioUsUrl: formAudioUs.trim() || null,
      audioUkUrl: formAudioUk.trim() || null,
      imageUrl: formImageUrl.trim() || "",
      imageAlt: formImageAlt.trim() || `${formWord} illustration`,
      topic: formTopic.trim() || null,
      tags: formTags
        ? formTags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      const endpoint = "/api/admin/vocabulary";
      const method = editingWord ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wordPayload),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      } else {
        const savedWord: VocabularyWord = {
          ...wordPayload,
          id: json.data?.id || editingWord?.id || `local_${Date.now()}`,
          createdAt: json.data?.created_at || editingWord?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (editingWord) {
          setVocab((prev) => prev.map((w) => (w.id === editingWord.id ? savedWord : w)));
          showToast(`แก้ไขคำว่า "${savedWord.word}" สำเร็จ`);
          setEditingWord(null);
        } else {
          setVocab((prev) => [savedWord, ...prev]);
          showToast(`เพิ่มคำว่า "${savedWord.word}" สำเร็จ`);
          setIsAddModalOpen(false);
        }
      }
    } catch {
      // Local fallback if API fails
      const fallbackWord: VocabularyWord = {
        ...wordPayload,
        id: editingWord?.id || `word_${Date.now()}`,
        createdAt: editingWord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingWord) {
        setVocab((prev) => prev.map((w) => (w.id === editingWord.id ? fallbackWord : w)));
        showToast(`แก้ไขคำว่า "${fallbackWord.word}" สำเร็จ (Local)`);
        setEditingWord(null);
      } else {
        setVocab((prev) => [fallbackWord, ...prev]);
        showToast(`เพิ่มคำว่า "${fallbackWord.word}" สำเร็จ (Local)`);
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Word
  const handleDeleteWord = async () => {
    if (!wordToDelete) return;
    setIsSaving(true);

    try {
      await fetch(`/api/admin/vocabulary?id=${encodeURIComponent(wordToDelete.id)}`, {
        method: "DELETE",
      });
    } catch {
      // fallback
    }

    setVocab((prev) => prev.filter((w) => w.id !== wordToDelete.id));
    showToast(`ลบคำว่า "${wordToDelete.word}" เรียบร้อยแล้ว`);
    setWordToDelete(null);
    setIsSaving(false);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocab, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `vocabflow-admin-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("ส่งออกข้อมูลสำรองคำศัพท์ (JSON) เรียบร้อยแล้ว");
  };

  // Filtered Vocabulary
  const filteredWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vocab.filter((w) => {
      if (selectedCefr !== "ALL" && (w.cefrLevel || w.cefr_level) !== selectedCefr) {
        return false;
      }
      if (q) {
        const matchWord = w.word.toLowerCase().includes(q);
        const matchDef = (w.definition || w.definitionEn || "").toLowerCase().includes(q);
        const matchTrans = (w.translation || w.definitionTh || "").toLowerCase().includes(q);
        return matchWord || matchDef || matchTrans;
      }
      return true;
    });
  }, [vocab, search, selectedCefr]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-4 py-2.5 shadow-2xl text-xs font-semibold animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>คลังคำศัพท์ส่วนกลาง (Vocabulary Management)</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {vocab.length} คำ
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            เพิ่ม แก้ไข ลบคำศัพท์ จัดการรูปภาพและเสียงอ่าน (สิทธิ์เฉพาะ Admin)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={openAddModal}
            size="sm"
            className="rounded-2xl gap-1.5 text-xs font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มคำศัพท์ใหม่</span>
          </Button>

          <Link href="/admin/import">
            <Button variant="outline" size="sm" className="rounded-2xl gap-1.5 text-xs font-semibold">
              <Upload className="h-3.5 w-3.5" />
              <span>นำเข้า CSV / JSON</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBackup}
            className="rounded-2xl gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>สำรองข้อมูล</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAuditLogsOpen(true);
              fetchAuditLogs();
            }}
            className="rounded-2xl gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit Logs</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="rounded-3xl border-border/80">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาคำศัพท์ ความหมาย หรือคำแปลไทย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-2xl text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* CEFR Level Filter */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(["ALL", "A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lvl) => (
              <Button
                key={lvl}
                size="sm"
                variant={selectedCefr === lvl ? "default" : "outline"}
                onClick={() => setSelectedCefr(lvl)}
                className="h-9 rounded-xl text-xs px-2.5"
              >
                {lvl}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Table */}
      <Card className="rounded-3xl border-border/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">คำศัพท์</th>
                <th className="py-3 px-3 font-bold">ชนิดคำ</th>
                <th className="py-3 px-3 font-bold">CEFR</th>
                <th className="py-3 px-4 font-bold">คำแปลไทย / ความหมาย</th>
                <th className="py-3 px-3 font-bold text-center">เสียงอ่าน</th>
                <th className="py-3 px-4 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                    ไม่พบคำศัพท์ที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                filteredWords.map((word) => {
                  const cefr = (word.cefrLevel || word.cefr_level || "A1").toUpperCase();
                  const cefrStyle = CEFR_COLORS[cefr] || CEFR_COLORS.A1;

                  return (
                    <tr key={word.id} className="hover:bg-muted/20 transition-colors">
                      {/* Word & Thumbnail */}
                      <td className="py-3 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary/20 to-teal-400/20 text-primary font-bold text-xs flex items-center justify-center border border-border/50 shrink-0">
                            {word.word[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-foreground block">
                              {word.word}
                            </span>
                            {(word.phoneticUs || word.phonetic_us) && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                /{word.phoneticUs || word.phonetic_us}/
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Part of Speech */}
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {word.partOfSpeech || word.part_of_speech}
                        </Badge>
                      </td>

                      {/* CEFR */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${cefrStyle}`}>
                          {cefr}
                        </span>
                      </td>

                      {/* Translation & Definition */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground truncate">
                            {word.translation || word.definitionTh || "-"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {word.definition || word.definitionEn}
                          </p>
                        </div>
                      </td>

                      {/* Audio */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
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
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingWord(word)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(word)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                            title="แก้ไขคำศัพท์"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setWordToDelete(word)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="ลบคำศัพท์"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: Add or Edit Vocabulary Word */}
      {(isAddModalOpen || editingWord) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingWord(null);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                {editingWord ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                <span>{editingWord ? `แก้ไขคำศัพท์: "${editingWord.word}"` : "เพิ่มคำศัพท์ใหม่"}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingWord(null);
                }}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveWord} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Word */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-semibold text-foreground">
                    คำศัพท์ (Word) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={formWord}
                    onChange={(e) => setFormWord(e.target.value)}
                    placeholder="เช่น serenity"
                    className="h-10 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Part of Speech */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">ชนิดคำ (POS)</label>
                  <select
                    value={formPos}
                    onChange={(e) => setFormPos(e.target.value as PartOfSpeech)}
                    className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="noun">Noun (คำนาม)</option>
                    <option value="verb">Verb (คำกริยา)</option>
                    <option value="adjective">Adjective (คำคุณศัพท์)</option>
                    <option value="adverb">Adverb (คำกริยาวิเศษณ์)</option>
                    <option value="idiom">Idiom (สำนวน)</option>
                    <option value="phrase">Phrase (วลี)</option>
                    <option value="preposition">Preposition (คำบุพบท)</option>
                  </select>
                </div>

                {/* CEFR Level */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">ระดับ CEFR</label>
                  <select
                    value={formCefr}
                    onChange={(e) => setFormCefr(e.target.value as CEFRLevel)}
                    className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Proficiency</option>
                  </select>
                </div>
              </div>

              {/* Definitions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    ความหมายอังกฤษ (English Definition) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={formDefEn}
                    onChange={(e) => setFormDefEn(e.target.value)}
                    placeholder="the state of being calm and peaceful"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    คำแปลภาษาไทย (Thai Translation)
                  </label>
                  <Input
                    value={formDefTh}
                    onChange={(e) => setFormDefTh(e.target.value)}
                    placeholder="ความสงบเงียบ ความราบรื่น"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Examples */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    ประโยคตัวอย่าง (Example Sentence)
                  </label>
                  <Input
                    value={formExample}
                    onChange={(e) => setFormExample(e.target.value)}
                    placeholder="She found serenity by the quiet mountain lake."
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    คำแปลประโยค (Example Translation)
                  </label>
                  <Input
                    value={formExampleTh}
                    onChange={(e) => setFormExampleTh(e.target.value)}
                    placeholder="เธอพบความสงบเงียบข้างทะเลสาบอันเงียบสงบ"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Phonetics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Phonetic (US)</label>
                  <Input
                    value={formPhoneticUs}
                    onChange={(e) => setFormPhoneticUs(e.target.value)}
                    placeholder="/səˈren.ə.t̬i/"
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Phonetic (UK)</label>
                  <Input
                    value={formPhoneticUk}
                    onChange={(e) => setFormPhoneticUk(e.target.value)}
                    placeholder="/səˈren.ə.ti/"
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Audio URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Volume2 className="h-3 w-3 text-primary" />
                    <span>Audio URL (US)</span>
                  </label>
                  <Input
                    type="url"
                    value={formAudioUs}
                    onChange={(e) => setFormAudioUs(e.target.value)}
                    placeholder="https://.../us.mp3 (ถ้าว่างจะใช้ TTS)"
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Volume2 className="h-3 w-3 text-primary" />
                    <span>Audio URL (UK)</span>
                  </label>
                  <Input
                    type="url"
                    value={formAudioUk}
                    onChange={(e) => setFormAudioUk(e.target.value)}
                    placeholder="https://.../uk.mp3 (ถ้าว่างจะใช้ TTS)"
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Image URL & Alt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3 text-primary" />
                    <span>Image URL (รูปภาพประกอบ)</span>
                  </label>
                  <Input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">คำอธิบายภาพ (Image Alt)</label>
                  <Input
                    value={formImageAlt}
                    onChange={(e) => setFormImageAlt(e.target.value)}
                    placeholder="Calm serene lake scenery"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Topic & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">หมวดหมู่ (Topic)</label>
                  <Input
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Mindset & Life"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">แท็ก (คั่นด้วยจุลภาค)</label>
                  <Input
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="peace, nature, calm"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingWord(null);
                  }}
                  className="rounded-2xl text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="rounded-2xl text-xs font-bold gap-1.5"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingWord ? "บันทึกการแก้ไข" : "เพิ่มคำศัพท์"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation */}
      {wordToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onClick={() => setWordToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">ยืนยันการลบคำศัพท์?</h3>
                  <p className="text-xs text-muted-foreground">Delete Vocabulary Confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWordToDelete(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              คุณกำลังจะลบคำว่า <strong className="text-foreground text-sm font-bold">&quot;{wordToDelete.word}&quot;</strong> ({wordToDelete.translation || wordToDelete.definition}) ออกจากระบบส่วนกลาง การดำเนินการนี้จะถูกบันทึกลง Audit Log
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWordToDelete(null)}
                className="rounded-2xl text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isSaving}
                onClick={handleDeleteWord}
                className="rounded-2xl text-xs font-bold gap-1.5"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>ยืนยันลบคำศัพท์</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: View Word Details */}
      {viewingWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onClick={() => setViewingWord(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CEFR_COLORS[(viewingWord.cefrLevel || viewingWord.cefr_level || "A1").toUpperCase()]}`}>
                    {viewingWord.cefrLevel || viewingWord.cefr_level}
                  </span>
                  <span className="text-xs text-muted-foreground italic">
                    ({viewingWord.partOfSpeech || viewingWord.part_of_speech})
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{viewingWord.word}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingWord(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-2xl bg-secondary/50 p-3 border border-border/60">
                <span className="text-[10px] font-bold text-primary block uppercase">คำแปลภาษาไทย</span>
                <p className="text-base font-bold text-foreground">{viewingWord.translation || viewingWord.definitionTh || "-"}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground block uppercase">English Definition</span>
                <p className="text-foreground leading-relaxed">{viewingWord.definition || viewingWord.definitionEn}</p>
              </div>
              {(viewingWord.exampleSentence || viewingWord.example) && (
                <div className="rounded-2xl bg-muted/30 p-3 border border-border/60">
                  <span className="text-[10px] font-bold text-primary block uppercase">Example Sentence</span>
                  <p className="italic text-foreground">&ldquo;{viewingWord.exampleSentence || viewingWord.example}&rdquo;</p>
                  {(viewingWord.exampleTranslationTh || viewingWord.exampleTranslation) && (
                    <p className="mt-1 text-muted-foreground">{viewingWord.exampleTranslationTh || viewingWord.exampleTranslation}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const w = viewingWord;
                  setViewingWord(null);
                  openEditModal(w);
                }}
                className="rounded-2xl text-xs gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>แก้ไขคำนี้</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setViewingWord(null)}
                className="rounded-2xl text-xs"
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Audit Logs Drawer */}
      {isAuditLogsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onClick={() => setIsAuditLogsOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Admin Audit Logs</h3>
                  <p className="text-xs text-muted-foreground">
                    บันทึกประวัติการเพิ่ม แก้ไข ลบ และนำเข้าคำศัพท์ส่วนกลาง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditLogsOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5 text-xs">
              {isLoadingLogs ? (
                <div className="text-center py-12 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">กำลังโหลดประวัติ...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">ยังไม่มีประวัติการทำรายการ</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-start justify-between gap-3 font-mono text-[11px]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-sans">
                        <span className="font-bold text-primary uppercase text-[10px] px-2 py-0.5 rounded bg-primary/10">
                          {log.action.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground">[{log.entity_type}]</span>
                      </div>
                      {log.after_data && (
                        <p className="text-foreground line-clamp-2">
                          Data: {JSON.stringify(log.after_data)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-sans">
                      {new Date(log.created_at).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 border-t border-border/60 flex justify-between items-center bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAuditLogs}
                className="rounded-xl text-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
                <span>รีเฟรชประวัติ</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuditLogsOpen(false)}
                className="rounded-xl text-xs"
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
