"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Laptop,
  Volume2,
  Database,
  Download,
  Trash2,
  ShieldCheck,
  Target,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [accent, setAccent] = useLocalStorage<"US" | "UK">("vocabflow_accent", "US");
  const [autoPlayAudio, setAutoPlayAudio] = useLocalStorage<boolean>("vocabflow_autoplay_audio", false);
  const [dailyGoal, setDailyGoal] = useLocalStorage<number>("vocabflow_daily_goal", 10);
  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);
  const [, setProgress] = useLocalStorage("vocabflow_progress", {});

  const hasSupabase = isSupabaseConfigured();

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocab, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vocabflow-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to reset all vocabulary and learning progress to default?")) {
      setVocab(INITIAL_VOCABULARY);
      setProgress({});
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Customize your study experience, audio playback, and storage preferences
        </p>
      </div>

      {/* Theme / Appearance */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <span>Appearance & Theme</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Select your preferred visual style for comfortable day and night reading
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

      {/* Audio & Speech Settings */}
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
                className="h-11 rounded-2xl font-medium text-xs"
              >
                🇺🇸 American English (US)
              </Button>
              <Button
                variant={accent === "UK" ? "default" : "outline"}
                onClick={() => setAccent("UK")}
                className="h-11 rounded-2xl font-medium text-xs"
              >
                🇬🇧 British English (UK)
              </Button>
            </div>
          </div>

          {/* Auto-play on Card Reveal toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3.5 border border-border/60">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                เล่นเสียงอ่านอัตโนมัติ (Auto-play Pronunciation)
              </p>
              <p className="text-[11px] text-muted-foreground">
                ออกเสียงคำศัพท์อัตโนมัติตามสำเนียงเริ่มต้นเมื่อเปิดดูการ์ดคำศัพท์
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

      {/* Study Target */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span>Daily Goal Target</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Number of flashcards to review each day
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((num) => (
              <Button
                key={num}
                variant={dailyGoal === num ? "default" : "outline"}
                onClick={() => setDailyGoal(num)}
                className="h-11 rounded-2xl font-medium"
              >
                {num} Cards
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage & Supabase Sync */}
      <Card className="rounded-3xl border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span>Cloud Sync & Storage</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Synchronize learning progress and backup your word lists
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3.5 border border-border/60">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {hasSupabase ? "Supabase Connected" : "Local Guest Mode Active"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hasSupabase
                    ? "Authenticated cloud sync is enabled via Supabase."
                    : "Progress is safely saved in local offline browser storage."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="flex-1 rounded-2xl gap-2 text-xs"
            >
              <Download className="h-4 w-4" />
              <span>Export Word List (JSON)</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAllData}
              className="rounded-2xl gap-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About & Copyright Integrity Notice */}
      <Card className="rounded-3xl border-border/80 bg-muted/20">
        <CardContent className="p-5 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Info className="h-4 w-4 text-primary" />
            <span>VocabFlow & Copyright Policy</span>
          </div>
          <p>
            VocabFlow operates strictly with licensed, open, or user-provided datasets. Proprietary vocabulary lists (such as Oxford 3000) are neither scraped nor redistributed without authorization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
