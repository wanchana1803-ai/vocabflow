"use client";

import React, { useState, useSyncExternalStore, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { UserWordProgress } from "@/types/srs";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Laptop,
  Volume2,
  Database,
  Download,
  Trash2,
  Shield,
  ShieldCheck,
  Target,
  Info,
  Languages,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  FileJson,
  X,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Settings states stored in localStorage
  const [accent, setAccent] = useLocalStorage<"US" | "UK">("vocabflow_accent", "US");
  const [autoPlayAudio, setAutoPlayAudio] = useLocalStorage<boolean>("vocabflow_autoplay_audio", false);
  const [dailyGoal, setDailyGoal] = useLocalStorage<number>("vocabflow_daily_goal", 10);
  const [showThai, setShowThai] = useLocalStorage<boolean>("vocabflow_show_thai", true);
  const [reducedMotion, setReducedMotion] = useLocalStorage<boolean>("vocabflow_reduced_motion", false);

  // Data states
  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [progress, setProgress] = useLocalStorage<Record<string, UserWordProgress>>("vocabflow_progress", {});
  const [, setBookmarks] = useLocalStorage<string[]>("vocabflow_bookmarks", []);

  // UI state for modals and notifications
  const [isResetProgressModalOpen, setIsResetProgressModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const hasSupabase = isSupabaseConfigured();

  // Handle reduced motion class sync immediately
  const handleToggleReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("reduce-motion", enabled);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Export Learning Progress as JSON
  const handleExportProgress = () => {
    const progressEntries = Object.values(progress);
    const masteredCount = progressEntries.filter((p) => p.status === "mastered").length;
    const learningCount = progressEntries.filter((p) => p.status === "learning" || p.status === "review").length;

    const exportData = {
      app: "VocabFlow",
      version: "1.0",
      exportType: "learning_progress",
      exportedAt: new Date().toISOString(),
      summary: {
        totalTrackedWords: progressEntries.length,
        masteredWords: masteredCount,
        learningWords: learningCount,
        dailyGoal,
        defaultAccent: accent,
      },
      progress,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vocabflow-progress-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessToast("ส่งออกข้อมูล Progress (JSON) เรียบร้อยแล้ว");
  };

  // Export Vocabulary Word List as JSON
  const handleExportVocabulary = () => {
    const exportData = {
      app: "VocabFlow",
      version: "1.0",
      exportType: "vocabulary_collection",
      exportedAt: new Date().toISOString(),
      totalWords: vocab.length,
      words: vocab,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vocabflow-words-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessToast("ส่งออกรายการคำศัพท์ (JSON) เรียบร้อยแล้ว");
  };

  // Reset Progress Only (Keeps vocabulary words intact)
  const handleResetProgressConfirm = () => {
    setProgress({});
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vocabflow_review_session");
    }
    setIsResetProgressModalOpen(false);
    setSuccessToast("รีเซ็ตประวัติการเรียนรู้ (SRS Progress) เป็น 0 เรียบร้อยแล้ว");
  };

  // Delete Account & Erase All Data
  const handleDeleteAccountConfirm = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      return;
    }

    if (typeof window !== "undefined") {
      // Clear all VocabFlow localStorage keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vocabflow_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Clear session storage
      sessionStorage.clear();

      // Reset document classes
      document.documentElement.classList.remove("reduce-motion");
    }

    setVocab(INITIAL_VOCABULARY);
    setProgress({});
    setBookmarks([]);
    setAccent("US");
    setAutoPlayAudio(false);
    setDailyGoal(10);
    setShowThai(true);
    setReducedMotion(false);

    setIsDeleteAccountModalOpen(false);
    setDeleteConfirmText("");

    // Reload to fresh state
    router.push("/");
    router.refresh();
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">การตั้งค่า (Settings)</h1>
        <p className="text-xs text-muted-foreground">
          ปรับแต่งรูปแบบการเรียนรู้ สำเนียงเสียง ธีมสี และจัดการข้อมูลของคุณ
        </p>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Theme / Appearance */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <span>ธีมและหน้าตา (Appearance & Theme)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            เลือกโหมดสีหน้าจอที่คุณชื่นชอบสำหรับอ่านได้อย่างสบายตาทั้งกลางวันและกลางคืน
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {mounted ? (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="h-12 rounded-2xl gap-2 font-medium"
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="h-12 rounded-2xl gap-2 font-medium"
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="h-12 rounded-2xl gap-2 font-medium"
              >
                <Laptop className="h-4 w-4" />
                <span>System</span>
              </Button>
            </div>
          ) : (
            <div className="h-12 rounded-2xl bg-muted/40 animate-pulse" />
          )}
        </CardContent>
      </Card>

      {/* 2. Audio & Speech Settings */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <span>การออกเสียงและระบบเสียง (Audio & Speech)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            กำหนดสำเนียงเริ่มต้นและเปิด/ปิดระบบเล่นเสียงอ่านอัตโนมัติ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {/* Default Accent selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              สำเนียงเริ่มต้น (Default Accent)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={accent === "US" ? "default" : "outline"}
                onClick={() => setAccent("US")}
                className="h-11 rounded-2xl font-medium text-xs gap-1.5"
              >
                <span>🇺🇸</span>
                <span>American English (US)</span>
              </Button>
              <Button
                variant={accent === "UK" ? "default" : "outline"}
                onClick={() => setAccent("UK")}
                className="h-11 rounded-2xl font-medium text-xs gap-1.5"
              >
                <span>🇬🇧</span>
                <span>British English (UK)</span>
              </Button>
            </div>
          </div>

          {/* Auto-play on Card Reveal toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3.5 border border-border/60">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-bold text-foreground">
                เล่นเสียงอ่านอัตโนมัติ (Auto-play Pronunciation)
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ออกเสียงคำศัพท์อัตโนมัติตามสำเนียงเริ่มต้นทันทีเมื่อเปิดดูการ์ด
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoPlayAudio((prev) => !prev)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                autoPlayAudio ? "bg-primary" : "bg-muted"
              )}
              role="switch"
              aria-checked={autoPlayAudio}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                  autoPlayAudio ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Learning & Display Preferences */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <span>การแสดงผลและการเรียนรู้ (Display & Learning)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            ปรับแต่งการแสดงคำแปลภาษาไทยและแอนิเมชันสำหรับประสบการณ์เรียนรู้ที่เหมาะกับคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          {/* Thai Translation On/Off */}
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3.5 border border-border/60">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-bold text-foreground">
                แสดงคำแปลภาษาไทย (Show Thai Translation)
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ปิดหากต้องการฝึกในโหมดภาษาอังกฤษล้วน (English Immersion) โดยยังแตะดูคำแปลชั่วคราวได้
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowThai((prev) => !prev)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showThai ? "bg-primary" : "bg-muted"
              )}
              role="switch"
              aria-checked={showThai}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                  showThai ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Reduced Animation Toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3.5 border border-border/60">
            <div className="space-y-0.5 pr-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>ลดแอนิเมชันการเคลื่อนไหว (Reduced Animation)</span>
                <Sparkles className="h-3 w-3 text-muted-foreground" />
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ปิดการพลิกการ์ด 3D และทรานซิชัน เหมาะสำหรับผู้ที่ต้องการความเร็วหรือสบายตา
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleReducedMotion(!reducedMotion)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                reducedMotion ? "bg-primary" : "bg-muted"
              )}
              role="switch"
              aria-checked={reducedMotion}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                  reducedMotion ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Daily Goal Target */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span>เป้าหมายประจำวัน (Daily Goal)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            จำนวนคำศัพท์ที่ต้องการทบทวนในแต่ละวันเพื่อรักษาความต่อเนื่อง (Streak)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((num) => (
              <Button
                key={num}
                variant={dailyGoal === num ? "default" : "outline"}
                onClick={() => setDailyGoal(num)}
                className="h-11 rounded-2xl font-medium text-xs"
              >
                {num} คำ
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">หรือระบุจำนวนเอง:</span>
            <div className="flex items-center gap-2 max-w-[140px]">
              <Input
                type="number"
                min={1}
                max={100}
                value={dailyGoal}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) setDailyGoal(val);
                }}
                className="h-8 rounded-xl text-center text-xs font-semibold"
              />
              <span className="text-xs text-muted-foreground font-medium">คำ/วัน</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Data Export & Storage Management */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span>การจัดการข้อมูลและการสำรอง (Data & Backup)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            ส่งออกความก้าวหน้าเพื่อสำรองข้อมูล หรือซิงค์ข้อมูลกับคลาวด์
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3.5 border border-border/60">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {hasSupabase ? "Supabase Connected" : "Local Guest Mode Active"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hasSupabase
                    ? "Authenticated cloud sync is enabled via Supabase."
                    : "ข้อมูลทั้งหมดถูกบันทึกอย่างปลอดภัยในหน่วยความจำของเบราว์เซอร์"}
                </p>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              ส่งออกข้อมูล (Export as JSON)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleExportProgress}
                className="h-11 rounded-2xl gap-2 text-xs font-medium justify-start px-3.5"
              >
                <FileJson className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <p className="font-semibold leading-none">Export Progress (JSON)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ประวัติ SRS, ช่วงเวลา, Streak
                  </p>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportVocabulary}
                className="h-11 rounded-2xl gap-2 text-xs font-medium justify-start px-3.5"
              >
                <Download className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <p className="font-semibold leading-none">Export Word List (JSON)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    รายการคำศัพท์ทั้งหมด ({vocab.length} คำ)
                  </p>
                </div>
              </Button>
            </div>
          </div>

          {/* Reset Actions */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <label className="text-xs font-semibold text-foreground block">
              การรีเซ็ตข้อมูล (Reset Options)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsResetProgressModalOpen(true)}
                className="flex-1 h-11 rounded-2xl gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-700"
              >
                <RotateCcw className="h-4 w-4" />
                <span>รีเซ็ตประวัติการเรียนรู้ (Reset Progress)</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmText("");
                  setIsDeleteAccountModalOpen(true);
                }}
                className="h-11 rounded-2xl gap-2 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>ลบบัญชีและข้อมูลทั้งหมด (Delete Account)</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Admin Portal & Vocabulary Importer */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>โหมดผู้ดูแลระบบ (Admin Portal)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            นำเข้าชุดคำศัพท์ขนาดใหญ่แบบ CSV / JSON พร้อมรูปภาพ และจัดการระบบคำศัพท์
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-secondary/60 p-4 border border-border/60">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                Batch Vocabulary Importer (CSV / JSON)
              </p>
              <p className="text-[11px] text-muted-foreground">
                รหัสผ่านแอดมินเริ่มต้นคือ: <code className="px-1.5 py-0.5 rounded bg-card font-mono text-primary font-bold border border-border/60">admin123</code>
              </p>
            </div>
            <Link href="/admin/import">
              <Button className="h-10 rounded-2xl gap-2 text-xs font-semibold shadow-sm w-full sm:w-auto">
                <ShieldCheck className="h-4 w-4" />
                <span>เข้าสู่ระบบ Admin Mode</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 7. About VocabFlow & Copyright */}
      <Card className="rounded-3xl border-border/80 bg-muted/20">
        <CardContent className="p-5 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>VocabFlow & Copyright Integrity</span>
          </div>
          <p className="leading-relaxed">
            VocabFlow ดำเนินการโดยใช้องค์ความรู้และชุดข้อมูลคำศัพท์มาตรฐานที่เปิดเผยตามลิขสิทธิ์โอเพ่นซอร์ส
            ไม่มีการคัดลอกหรือละเมิดฐานข้อมูลที่มีลิขสิทธิ์เฉพาะ (เช่น Oxford 3000) โดยไม่ได้รับอนุญาต
          </p>
        </CardContent>
      </Card>

      {/* MODAL 1: Confirm Reset Progress Only */}
      {isResetProgressModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsResetProgressModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    รีเซ็ตประวัติการเรียนรู้?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Reset Spaced Repetition Progress
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetProgressModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              การรีเซ็ตนี้จะล้างประวัติการทบทวน ช่วงเวลา (Intervals), ค่า Ease Factor และสถิติความจำทั้งหมดเป็นสถานะเริ่มต้น (New Cards)
              <br />
              <strong className="text-foreground font-semibold">
                * รายการคำศัพท์ในคลังและคำที่ Bookmark จะยังคงอยู่ครบถ้วน ไม่ถูกลบ
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsResetProgressModalOpen(false)}
                className="rounded-2xl text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                variant="default"
                onClick={handleResetProgressConfirm}
                className="rounded-2xl text-xs h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>ยืนยันรีเซ็ต Progress</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Delete Account / Wipe All Data */}
      {isDeleteAccountModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsDeleteAccountModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-destructive">
                    ลบบัญชีและข้อมูลทั้งหมด?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Delete Account & Factory Reset
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-3.5 text-xs text-destructive leading-relaxed space-y-1">
              <p className="font-bold">⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้ (Irreversible):</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                <li>ประวัติการทบทวนคำศัพท์และ Streak ทั้งหมดจะถูกล้าง</li>
                <li>คำศัพท์ที่เพิ่มเข้ามาเองและการ Bookmark จะถูกล้าง</li>
                <li>การตั้งค่าทั้งหมดจะถูกคืนค่าเป็นค่าเริ่มต้นจากโรงงาน</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-foreground font-medium block">
                พิมพ์คำว่า <strong className="text-destructive font-bold">DELETE</strong> เพื่อยืนยัน:
              </label>
              <Input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="h-10 rounded-2xl text-xs font-mono border-destructive/40 focus-visible:ring-destructive"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="rounded-2xl text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                onClick={handleDeleteAccountConfirm}
                className="rounded-2xl text-xs h-9 px-4 gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>ยืนยันลบข้อมูลทั้งหมด</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
