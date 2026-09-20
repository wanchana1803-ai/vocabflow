"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { INITIAL_VOCABULARY } from "@/config/initial-vocab";
import { VocabularyWord } from "@/types/vocabulary";
import { parseCSV, parseJSON, TARGET_COLUMNS, detectColumnMapping, TargetColumnKey } from "@/lib/import/parser";
import { validateBatchRows, ValidationBatchResult } from "@/lib/import/validator";
import { executeBatchImport, DuplicateStrategy, ImportExecutionResult, getDuplicateKey } from "@/lib/import/import-service";
import confetti from "canvas-confetti";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  ArrowLeft,
  Copy,
  Check,
  ImageIcon,
  Lock,
} from "lucide-react";

export default function AdminImportPage() {
  const [vocab, setVocab] = useLocalStorage<VocabularyWord[]>("vocabflow_words", INITIAL_VOCABULARY);

  // Workflow steps: 1 = upload, 2 = mapping & validation preview, 3 = importing, 4 = complete
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File state
  const [fileName, setFileName] = useState("");
  const [fileFormat, setFileFormat] = useState<"csv" | "json">("csv");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column mapping state
  const [mapping, setMapping] = useState<Record<TargetColumnKey, string>>({} as Record<TargetColumnKey, string>);

  // Global metadata
  const [sourceName, setSourceName] = useState("Licensed User Dataset");
  const [sourceLicense, setSourceLicense] = useState("CC-BY-4.0");

  // Duplicate resolution strategy - Default to "update" so old words and images are overwritten with new AI data
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("update");

  // Validation results
  const [validationResult, setValidationResult] = useState<ValidationBatchResult | null>(null);

  // Execution & Progress state
  const [importProgress, setImportProgress] = useState(0);
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);

  // Set of duplicate keys for existing words that are currently locked
  const existingLockedKeys = useMemo(() => {
    const set = new Set<string>();
    vocab.forEach((w) => {
      if (w.isLocked || w.is_locked) {
        set.add(getDuplicateKey(w.word, w.partOfSpeech || w.part_of_speech || ""));
      }
    });
    return set;
  }, [vocab]);

  // Handle file drop & reading
  const handleFileProcess = (file: File) => {
    const isJson = file.name.endsWith(".json");
    const isCsv = file.name.endsWith(".csv");

    if (!isJson && !isCsv) {
      alert("Please upload a valid .csv or .json file.");
      return;
    }

    setFileName(file.name);
    setFileFormat(isJson ? "json" : "csv");

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const parsed = isJson ? parseJSON(content) : parseCSV(content);

      if (parsed.error) {
        alert(parsed.error);
        return;
      }

      setFileHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto-detect mapping
      const autoMapping = detectColumnMapping(parsed.headers);
      setMapping(autoMapping);

      // Perform initial validation preview
      const validated = validateBatchRows(parsed.rows, autoMapping, {
        defaultSource: sourceName,
        defaultLicense: sourceLicense,
      });
      setValidationResult(validated);

      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (targetKey: TargetColumnKey, sourceHeader: string) => {
    const updated = { ...mapping, [targetKey]: sourceHeader };
    setMapping(updated);

    // Re-run validation preview
    if (rawRows.length > 0) {
      const validated = validateBatchRows(rawRows, updated, {
        defaultSource: sourceName,
        defaultLicense: sourceLicense,
      });
      setValidationResult(validated);
    }
  };

  const handleStartImport = async () => {
    if (!validationResult || validationResult.validRecords.length === 0) {
      alert("No valid records available to import.");
      return;
    }

    setStep(3);
    setImportProgress(0);

    const result = await executeBatchImport(validationResult.validRecords, vocab, {
      duplicateStrategy,
      batchSize: 20,
      onProgress: (percentage) => {
        setImportProgress(percentage);
      },
    });

    setExecutionResult(result);
    setVocab(result.finalVocabularyList);
    setStep(4);

    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }
  };

  const handleReset = () => {
    setStep(1);
    setFileName("");
    setRawRows([]);
    setFileHeaders([]);
    setValidationResult(null);
    setExecutionResult(null);
    setImportProgress(0);
  };

  const handleCopyAiPrompt = async () => {
    const promptText = `ช่วยสร้างชุดคำศัพท์ภาษาอังกฤษในรูปแบบตาราง CSV สำหรับนำเข้าแอพพลิเคชัน VocabFlow โดยมีคอลัมน์และลำดับหัวตารางดังนี้:

word,part_of_speech,cefr_level,definition_en,definition_th,example_sentence,example_translation_th,phonetic_uk,phonetic_us,image_url,image_alt,topic,tags,is_locked

ข้อกำหนดสำคัญ:
1. part_of_speech ให้ระบุอย่างใดอย่างหนึ่ง: noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection, determiner, phrase, idiom
2. cefr_level ให้ระบุ: A1, A2, B1, B2, C1, หรือ C2
3. image_url ให้ใส่ลิงก์รูปภาพความละเอียดสูงจาก Unsplash หรือ Direct Image URL ที่มีความหมายตรงกับคำศัพท์นั้นๆ เช่น:
   https://images.unsplash.com/photo-[ID]?w=800&auto=format&fit=crop&q=80
4. image_alt ให้ใส่คำอธิบายภาพสั้นๆ เป็นภาษาอังกฤษที่สื่อถึงคำศัพท์และรูปภาพ
5. is_locked ให้ใส่ false (หรือ true หากต้องการล็อคคำนี้ไม่ให้ถูกเขียนทับในอนาคต)
6. หากข้อความมีเครื่องหมายจุลภาค (,) ให้ครอบด้วยเครื่องหมายคำพูดคู่ ("...") ตามมาตรฐาน RFC 4180
7. ตอบกลับเป็น Code Block รูปแบบ CSV เท่านั้น`;

    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      alert("ไม่สามารถคัดลอกได้อัตโนมัติ กรุณาคัดลอกด้วยตนเอง");
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <AdminNav />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary flex items-center gap-1">
                <Shield className="h-3 w-3" /> Admin Area
              </span>
              <span className="text-xs text-muted-foreground">ระบบนำเข้าคำศัพท์พร้อมรูปภาพ</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Batch Vocabulary Importer (CSV / JSON)
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyAiPrompt}
              className="rounded-xl text-xs gap-1.5 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              title="คัดลอก Prompt สำหรับนำไปสั่งให้ AI (ChatGPT / Claude / Gemini) สร้างคำศัพท์พร้อมรูปภาพตาม Template"
            >
              {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedPrompt ? "คัดลอก Prompt แล้ว!" : "คัดลอก Prompt สั่ง AI"}</span>
            </Button>

            <a
              href="/templates/vocabulary-template.csv"
              download="vocabulary-template.csv"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors shadow-xs"
              title="ดาวน์โหลดไฟล์แม่แบบ CSV ที่มีคอลัมน์รูปภาพ image_url ครบถ้วน"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Download CSV Template</span>
            </a>
            <Link href="/vocabulary">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Library</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Legal & Anti-Scraping Reminder */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>นโยบายลิขสิทธิ์และการนำเข้ารูปภาพ</span>
          </p>
          <p className="opacity-90 leading-relaxed">
            รองรับคอลัมน์ <strong>image_url</strong> สำหรับระบุรูปภาพจาก Unsplash หรือ Direct Image URL ที่มีสิทธิ์ใช้งานได้โดยตรง ระบบจะจับคู่และอัปเดตคำศัพท์พร้อมรูปภาพให้อัตโนมัติ
          </p>
        </div>

        {/* STEP 1: Upload & Drag-and-Drop */}
        {step === 1 && (
          <Card className="rounded-3xl border-border/80 p-6 md:p-8 shadow-sm">
            <CardHeader className="p-0 pb-6 text-center">
              <CardTitle className="text-xl font-bold">อัปโหลดไฟล์คำศัพท์ของคุณ (.CSV หรือ .JSON)</CardTitle>
              <CardDescription className="text-xs">
                รองรับไฟล์ CSV ที่มีคอลัมน์รูปภาพ (image_url) จาก AI หรือไฟล์ที่จัดเตรียมไว้
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary mb-4 shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-base font-bold text-foreground">
                  ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  รองรับได้สูงสุด 5,000 คำต่อไฟล์ (พร้อมรูปภาพและคำแปล)
                </p>

                <div className="mt-6 flex gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1 text-xs font-mono border border-border/60">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    .CSV
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1 text-xs font-mono border border-border/60">
                    <FileCode className="h-3.5 w-3.5 text-blue-600" />
                    .JSON
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Column Mapping, Duplicate Strategy & Preview */}
        {step === 2 && validationResult && (
          <div className="space-y-6">
            {/* File Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-secondary/60 p-4 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-primary font-bold shadow-xs">
                  {fileFormat === "json" ? <FileCode className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{rawRows.length} total rows detected</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-semibold">
                  {validationResult.validRecords.length} Valid Rows
                </Badge>
                {validationResult.invalidRows.length > 0 && (
                  <Badge variant="destructive" className="text-xs font-semibold">
                    {validationResult.invalidRows.length} Issues
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                  Change File
                </Button>
              </div>
            </div>

            {/* Column Mapping Section - Grouped by domain with Highlight on Image */}
            <Card className="rounded-3xl border-border/80">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>การจับคู่คอลัมน์ (Column Mapping & Schema Matching)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  ระบบจะตรวจจับคอลัมน์จากไฟล์ CSV ให้อัตโนมัติ รวมถึงคอลัมน์รูปภาพที่คุณให้ AI เจนมา
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                {/* 1. Core Vocabulary Fields */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    📌 ข้อมูลคำศัพท์หลัก (Core Information)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {TARGET_COLUMNS.filter((c) =>
                      ["word", "part_of_speech", "cefr_level", "definition_en", "definition_th", "example_sentence", "example_translation_th"].includes(c.key)
                    ).map((col) => (
                      <div key={col.key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                          <span>{col.label}</span>
                          {col.required && <span className="text-destructive">*</span>}
                        </label>
                        <select
                          value={mapping[col.key] || ""}
                          onChange={(e) => handleMappingChange(col.key, e.target.value)}
                          className="w-full h-9 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- ไม่ระบุ / ละเว้น --</option>
                          {fileHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Image & Visuals Section (Highlighted) */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4" />
                      <span>🖼️ รูปภาพประกอบคำศัพท์ (AI Generated Images)</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border/60">
                      ตรวจพบคอลัมน์: {mapping.image_url ? `"${mapping.image_url}"` : "ไม่พบ (จะใช้ AI Auto-Matcher แทน)"}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TARGET_COLUMNS.filter((c) => ["image_url", "image_alt"].includes(c.key)).map((col) => (
                      <div key={col.key} className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <span>{col.label}</span>
                          <span className="text-[10px] text-primary font-normal">({col.key})</span>
                        </label>
                        <select
                          value={mapping[col.key] || ""}
                          onChange={(e) => handleMappingChange(col.key, e.target.value)}
                          className="w-full h-9 rounded-xl border border-primary/40 bg-card px-2.5 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- ไม่ระบุ (จะใช้รูปภาพอัตโนมัติ) --</option>
                          {fileHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Audio & Pronunciation */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    🔊 การออกเสียงและเสียงอ่าน (Pronunciation & Audio)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {TARGET_COLUMNS.filter((c) =>
                      ["phonetic_uk", "phonetic_us", "audio_uk_url", "audio_us_url"].includes(c.key)
                    ).map((col) => (
                      <div key={col.key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                          <span>{col.label}</span>
                        </label>
                        <select
                          value={mapping[col.key] || ""}
                          onChange={(e) => handleMappingChange(col.key, e.target.value)}
                          className="w-full h-9 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- ละเว้น --</option>
                          {fileHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Metadata & Topic */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    🏷️ หมวดหมู่และป้ายกำกับ (Topic & Tags)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    {TARGET_COLUMNS.filter((c) =>
                      ["topic", "tags", "source_name", "source_license"].includes(c.key)
                    ).map((col) => (
                      <div key={col.key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                          <span>{col.label}</span>
                        </label>
                        <select
                          value={mapping[col.key] || ""}
                          onChange={(e) => handleMappingChange(col.key, e.target.value)}
                          className="w-full h-9 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- ละเว้น --</option>
                          {fileHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Lock Status */}
                <div>
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>🔒 สถานะล็อคคำศัพท์ (Lock Status - ห้ามแก้ไข)</span>
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TARGET_COLUMNS.filter((c) => ["is_locked"].includes(c.key)).map((col) => (
                      <div key={col.key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                          <span>{col.label}</span>
                        </label>
                        <select
                          value={mapping[col.key] || ""}
                          onChange={(e) => handleMappingChange(col.key, e.target.value)}
                          className="w-full h-9 rounded-xl border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">-- ละเว้น (คำใหม่จะไม่ถูกล็อคเริ่มต้น) --</option>
                          {fileHeaders.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Source & Duplicate Strategy Options */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-3xl border-border/80 p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">แหล่งที่มาของข้อมูล (Dataset Metadata)</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Source Name</label>
                    <Input
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. My Custom Deck / AI Generated"
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">License / Attribution</label>
                    <Input
                      value={sourceLicense}
                      onChange={(e) => setSourceLicense(e.target.value)}
                      placeholder="e.g. CC-BY-4.0 / Unsplash License"
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </Card>

              <Card className="rounded-3xl border-border/80 p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground">การจัดการคำซ้ำ (Duplicate Strategy)</h3>
                <p className="text-[11px] text-muted-foreground">
                  ตรวจสอบความซ้ำซ้อนด้วย (คำศัพท์ + ชนิดคำ POS):
                </p>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-primary/40 bg-primary/5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      className="mt-0.5"
                      checked={duplicateStrategy === "update"}
                      onChange={() => setDuplicateStrategy("update")}
                    />
                    <div>
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <span>เขียนทับคำเก่าพร้อมรูปภาพใหม่ (Update)</span>
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary">แนะนำ</Badge>
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        เขียนทับข้อมูลและรูปลิงก์เดิมทั้งหมดด้วยข้อมูลชุดใหม่จากไฟล์นี้ (เหมาะสำหรับการอัปเดตรูปภาพที่ AI เจนให้)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/80 bg-card cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      className="mt-0.5"
                      checked={duplicateStrategy === "merge"}
                      onChange={() => setDuplicateStrategy("merge")}
                    />
                    <div>
                      <span className="font-bold text-foreground">ผสานข้อมูล (Merge)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        รวม Tags เดิมเข้าด้วยกัน และอัปเดตรูปภาพใหม่หากมีในไฟล์
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/80 bg-card cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      className="mt-0.5"
                      checked={duplicateStrategy === "skip"}
                      onChange={() => setDuplicateStrategy("skip")}
                    />
                    <div>
                      <span className="font-bold text-foreground">ข้ามคำซ้ำ (Skip)</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        เก็บคำศัพท์และรูปภาพเดิมไว้ ข้ามคำที่มีอยู่แล้วในระบบ
                      </p>
                    </div>
                  </label>

                  {/* Lock Protection Notice */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold">ระบบล็อคคำศัพท์ (Lock Protection):</span>
                      <p className="text-[11px] opacity-90">
                        คำเดิมในระบบที่ถูกล็อคไว้ (🔒) จะ<strong>ได้รับการคุ้มครองเสมอ</strong> ระบบจะข้ามคำนั้นโดยอัตโนมัติ ไม่มีการแก้ไขข้อมูลหรือเปลี่ยนรูปภาพแน่นอน 100%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Validation Diagnostic List (If any invalid rows exist) */}
            {validationResult.invalidRows.length > 0 && (
              <Card className="rounded-3xl border-destructive/30 bg-destructive/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{validationResult.invalidRows.length} แถวที่พบข้อผิดพลาด (จะถูกข้ามอัตโนมัติ)</span>
                  </h3>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] text-destructive">
                  {validationResult.invalidRows.slice(0, 5).map((err, i) => (
                    <div key={i} className="bg-card/70 p-2 rounded-lg border border-destructive/20">
                      แถวที่ {err.rowIndex} ({err.word}): <strong>{err.field}</strong> &rarr; {err.message}
                    </div>
                  ))}
                  {validationResult.invalidRows.length > 5 && (
                    <p className="text-center pt-1 text-muted-foreground font-sans">
                      + อีก {validationResult.invalidRows.length - 5} แถว...
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Valid Records Preview Table */}
            {validationResult.validRecords.length > 0 && (
              <Card className="rounded-3xl border-border/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>ตัวอย่างข้อมูลที่จะนำเข้า (Preview 5 คำแรก)</span>
                    <Badge variant="secondary" className="text-[11px]">
                      {validationResult.validRecords.length} คำพร้อมนำเข้า
                    </Badge>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground">
                        <th className="pb-2 font-semibold">คำศัพท์</th>
                        <th className="pb-2 font-semibold">ชนิดคำ</th>
                        <th className="pb-2 font-semibold">ระดับ</th>
                        <th className="pb-2 font-semibold">คำแปลไทย</th>
                        <th className="pb-2 font-semibold">รูปภาพ (image_url)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {validationResult.validRecords.slice(0, 5).map((row, i) => {
                        const isMatchingLocked = existingLockedKeys.has(
                          getDuplicateKey(row.word, row.part_of_speech)
                        );
                        return (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="py-2.5 font-bold font-sans text-foreground">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{row.word}</span>
                                {isMatchingLocked && (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] px-1.5 py-0 gap-1 font-sans"
                                  >
                                    <Lock className="h-2.5 w-2.5" /> ล็อคอยู่ (จะข้ามไม่ทับ)
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5">
                              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-sans">
                                {row.part_of_speech}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className="rounded bg-primary/10 text-primary font-bold px-1.5 py-0.5 text-[10px] font-sans">
                                {row.cefr_level}
                              </span>
                            </td>
                            <td className="py-2.5 font-sans text-muted-foreground line-clamp-1 max-w-[180px]">
                              {row.definition_th || row.definition_en}
                            </td>
                            <td className="py-2.5 font-sans">
                              {row.image_url ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate max-w-[180px]" title={row.image_url}>
                                    {row.image_url.slice(0, 35)}...
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  ไม่มี (จะใส่ให้อัตโนมัติ)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={handleReset} className="rounded-xl">
                Cancel
              </Button>

              <Button
                onClick={handleStartImport}
                disabled={validationResult.validRecords.length === 0}
                className="rounded-xl gap-2 font-bold px-6 shadow-md"
              >
                <span>Import {validationResult.validRecords.length} Valid Words</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Progress Bar during Batch Import */}
        {step === 3 && (
          <Card className="rounded-3xl border-border/80 p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-secondary text-primary flex items-center justify-center mx-auto animate-pulse">
              <Upload className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Importing Vocabulary in Batches...</h2>
              <p className="text-xs text-muted-foreground">
                Resolving duplicates ({duplicateStrategy}) and updating local storage & cloud database
              </p>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <Progress value={importProgress} max={100} className="h-3" />
              <p className="text-xs font-semibold text-primary">{importProgress}%</p>
            </div>
          </Card>
        )}

        {/* STEP 4: Completion Summary */}
        {step === 4 && executionResult && (
          <Card className="rounded-3xl border-border/80 p-8 text-center space-y-6">
            <div className="h-20 w-20 rounded-3xl bg-secondary text-primary flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">Import Completed Successfully!</h2>
              <p className="text-xs text-muted-foreground">
                Your vocabulary library has been updated with the imported records.
              </p>
            </div>

            {/* Locked Words Protected Banner */}
            {executionResult.lockedSkippedCount > 0 && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 max-w-xl mx-auto flex items-center justify-center gap-2">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  ระบบได้ปกป้องคำที่ถูกล็อคไว้ <strong>{executionResult.lockedSkippedCount} คำ</strong> (ข้อมูลเดิมและรูปภาพเดิมคงอยู่ครบถ้วน 100%)
                </span>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
              <div className="rounded-2xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">New Added</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{executionResult.successCount}</p>
              </div>

              <div className="rounded-2xl bg-blue-500/10 p-3 border border-blue-500/20">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Updated/Merged</span>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{executionResult.updatedCount}</p>
              </div>

              <div className="rounded-2xl bg-amber-500/10 p-3 border border-amber-500/20">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Skipped</span>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{executionResult.skippedCount}</p>
                {executionResult.lockedSkippedCount > 0 && (
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block mt-0.5">
                    (🔒 ล็อค {executionResult.lockedSkippedCount} คำ)
                  </span>
                )}
              </div>

              <div className="rounded-2xl bg-secondary p-3 border border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Total Processed</span>
                <p className="text-2xl font-bold text-foreground">{executionResult.totalProcessed}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Link href="/vocabulary">
                <Button className="rounded-2xl gap-2 font-semibold shadow-md">
                  <Sparkles className="h-4 w-4" />
                  <span>View Vocabulary Library</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleReset} className="rounded-2xl gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Import Another File</span>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}
