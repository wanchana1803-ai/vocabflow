"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { VocabularyWord } from "@/types/vocabulary";
import { ImageSearchResult } from "@/types/image-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSearchModalProps {
  isOpen: boolean;
  word: VocabularyWord | null;
  onClose: () => void;
  onSelectImage: (
    wordId: string,
    imageDetails: {
      imageUrl: string;
      imageAlt: string;
      sourceName?: string;
      sourceLicense?: string;
    }
  ) => void;
}

interface DialogContentProps {
  word: VocabularyWord;
  onClose: () => void;
  onSelectImage: (
    wordId: string,
    imageDetails: {
      imageUrl: string;
      imageAlt: string;
      sourceName?: string;
      sourceLicense?: string;
    }
  ) => void;
}

function ImageSearchDialogContent({
  word,
  onClose,
  onSelectImage,
}: DialogContentProps) {
  const [queryInput, setQueryInput] = useState(word.word);
  const [selectedProvider, setSelectedProvider] = useState<string>("curated");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageSearchResult | null>(null);
  const [customAlt, setCustomAlt] = useState(`Illustration of ${word.word}`);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(
    async (searchTerm: string, provider: string, targetWord: VocabularyWord) => {
      setIsLoading(true);
      setError(null);

      try {
        const url = new URL("/api/images/search", window.location.origin);
        url.searchParams.set("word", searchTerm);
        url.searchParams.set("provider", provider);
        if (targetWord.definition || targetWord.definition_en) {
          url.searchParams.set("definition", (targetWord.definition || targetWord.definition_en)!);
        }
        if (targetWord.partOfSpeech || targetWord.part_of_speech) {
          url.searchParams.set("partOfSpeech", (targetWord.partOfSpeech || targetWord.part_of_speech)!);
        }
        if (targetWord.topic) {
          url.searchParams.set("topic", targetWord.topic);
        }
        url.searchParams.set("limit", "12");

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.success && Array.isArray(data.results)) {
          setResults(data.results);
          if (data.results.length > 0) {
            setSelectedImage(data.results[0]);
            setCustomAlt(data.results[0].altText);
          } else {
            setSelectedImage(null);
          }
        } else {
          setError(data.error || "No images found for this query");
          setResults([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search request failed");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger initial search once upon mount
  useEffect(() => {
    let ignore = false;

    const initialFetch = async () => {
      try {
        const url = new URL("/api/images/search", window.location.origin);
        url.searchParams.set("word", word.word);
        url.searchParams.set("provider", "curated");
        if (word.definition || word.definition_en) {
          url.searchParams.set("definition", (word.definition || word.definition_en)!);
        }
        if (word.partOfSpeech || word.part_of_speech) {
          url.searchParams.set("partOfSpeech", (word.partOfSpeech || word.part_of_speech)!);
        }
        if (word.topic) {
          url.searchParams.set("topic", word.topic);
        }
        url.searchParams.set("limit", "12");

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!ignore) {
          if (data.success && Array.isArray(data.results)) {
            setResults(data.results);
            if (data.results.length > 0) {
              setSelectedImage(data.results[0]);
              setCustomAlt(data.results[0].altText);
            }
          } else {
            setError(data.error || "No images found");
          }
        }
      } catch {
        if (!ignore) {
          setError("Failed to load initial images");
        }
      }
    };

    initialFetch();

    return () => {
      ignore = true;
    };
  }, [word]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryInput.trim()) {
      performSearch(queryInput.trim(), selectedProvider, word);
    }
  };

  const handleApply = () => {
    if (!selectedImage) return;

    onSelectImage(word.id, {
      imageUrl: selectedImage.imageUrl,
      imageAlt: customAlt || selectedImage.altText,
      sourceName: selectedImage.sourceName,
      sourceLicense: selectedImage.license || undefined,
    });
    onClose();
  };

  return (
    <div
      className="relative w-full max-w-3xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">
              ค้นหารูปภาพสำหรับ &ldquo;{word.word}&rdquo;
            </h2>
            <Badge variant="secondary" className="text-xs uppercase">
              {word.partOfSpeech || word.part_of_speech}
            </Badge>
            {word.topic && (
              <Badge variant="outline" className="text-xs">
                {word.topic}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {word.definition || word.definition_en || "No definition available"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search bar & Provider Selector */}
      <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="ค้นหาด้วยคำศัพท์ หรือคำอธิบายภาพ..."
            className="pl-10 h-10 rounded-xl bg-muted/40 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => {
              const nextProv = e.target.value;
              setSelectedProvider(nextProv);
              performSearch(queryInput || word.word, nextProv, word);
            }}
            className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="curated">Curated Local Library</option>
            <option value="unsplash">Unsplash Provider</option>
            <option value="pexels">Pexels Provider</option>
          </select>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 rounded-xl px-4 text-xs font-semibold gap-1.5 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="h-4 w-4" />
            )}
            <span>ค้นหา</span>
          </Button>
        </div>
      </form>

      {/* Results Gallery Grid */}
      <div className="mt-4 max-h-[340px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs">กำลังค้นหารูปภาพคุณภาพสูงจาก {selectedProvider}...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium">{error}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              ลองสลับ Provider หรือเปลี่ยนคำค้นหา
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-xs font-medium">ไม่พบรูปภาพ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.map((item, idx) => {
              const isSelected = selectedImage?.imageUrl === item.imageUrl;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedImage(item);
                    setCustomAlt(item.altText);
                  }}
                  className={cn(
                    "group relative aspect-[16/10] overflow-hidden rounded-xl border-2 transition-all cursor-pointer bg-muted/30",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]"
                      : "border-border/60 hover:border-border hover:shadow-sm"
                  )}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.thumbnailUrl || item.imageUrl}
                      alt={item.altText}
                      fill
                      unoptimized
                      sizes="240px"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                      {item.altText}
                    </div>
                  )}

                  {/* Checkmark indicator */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {/* Attribution overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[10px] text-white">
                    <p className="truncate font-medium">{item.creator || item.sourceName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Image Metadata & Action Footer */}
      <div className="mt-5 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto flex-1">
          {selectedImage ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                เลือก: {selectedImage.creator ? `© ${selectedImage.creator}` : selectedImage.sourceName} ({selectedImage.sourceName})
              </span>
              {selectedImage.sourceUrl && (
                <a
                  href={selectedImage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-0.5 ml-1"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">เลือกรูปภาพที่ต้องการใช้งาน</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 rounded-xl text-xs font-semibold px-4"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            disabled={!selectedImage}
            onClick={handleApply}
            className="h-10 rounded-xl text-xs font-semibold px-5 gap-1.5 shadow-sm"
          >
            <Check className="h-4 w-4" />
            <span>ใช้รูปภาพนี้</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ImageSearchModal({
  isOpen,
  word,
  onClose,
  onSelectImage,
}: ImageSearchModalProps) {
  if (!isOpen || !word) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <ImageSearchDialogContent
        word={word}
        onClose={onClose}
        onSelectImage={onSelectImage}
      />
    </div>
  );
}
