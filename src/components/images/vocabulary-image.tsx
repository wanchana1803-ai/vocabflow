"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  BookOpen,
  Compass,
  Heart,
  Sparkles,
  Trophy,
  MessageCircle,
  Layers,
  Zap,
  Briefcase,
  GraduationCap,
  Globe,
  Smile,
  Shield,
  Palette,
  Apple,
  User,
  Package,
  ExternalLink,
  Flame,
} from "lucide-react";
import { getCoreCategoryFallback } from "@/lib/images/fallback";
import { getAutomaticImageForWord, OUTDATED_IMAGE_URLS } from "@/lib/images/auto-matcher";
import { cn } from "@/lib/utils";

interface VocabularyImageProps {
  imageUrl?: string | null;
  imageAlt?: string | null;
  word: string;
  partOfSpeech?: string | null;
  definition?: string | null;
  topic?: string | null;
  creator?: string | null;
  creatorUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  license?: string | null;
  nextImageUrl?: string | null;
  className?: string;
  aspectRatio?: "video" | "square" | "card" | "wide";
  priority?: boolean;
}

const EXTENDED_ICONS_MAP: Record<string, React.ElementType> = {
  user: User,
  compass: Compass,
  package: Package,
  zap: Zap,
  heart: Heart,
  sparkles: Sparkles,
  "book-open": BookOpen,
  trophy: Trophy,
  "message-circle": MessageCircle,
  layers: Layers,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  globe: Globe,
  smile: Smile,
  shield: Shield,
  palette: Palette,
  apple: Apple,
  flame: Flame,
};

export function VocabularyImage({
  imageUrl,
  imageAlt,
  word,
  partOfSpeech,
  definition,
  topic,
  creator,
  creatorUrl,
  sourceName,
  sourceUrl,
  license,
  nextImageUrl,
  className,
  aspectRatio = "card",
  priority = false,
}: VocabularyImageProps) {
  // Resolve automatic semantic image for context
  const autoMatch = getAutomaticImageForWord(word, partOfSpeech, topic, definition);

  // Determine initial effective image URL
  const rawProvidedUrl = (imageUrl || "").trim();
  const isOutdated = OUTDATED_IMAGE_URLS.has(rawProvidedUrl);
  const initialUrl = rawProvidedUrl && !isOutdated ? rawProvidedUrl : autoMatch.imageUrl;

  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [prevUrlProp, setPrevUrlProp] = useState(imageUrl);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageUrl !== prevUrlProp) {
    setPrevUrlProp(imageUrl);
    const newTarget = rawProvidedUrl && !isOutdated ? rawProvidedUrl : autoMatch.imageUrl;
    setCurrentSrc(newTarget);
    setTriedFallback(false);
    setHasError(false);
    setIsLoading(true);
  }

  // Prefetch the next card's image to ensure instant rendering
  useEffect(() => {
    if (nextImageUrl && typeof window !== "undefined") {
      try {
        const prefetchImg = new window.Image();
        prefetchImg.src = nextImageUrl;
      } catch {
        // Silently handle prefetch failures
      }
    }
  }, [nextImageUrl]);

  const fallback = getCoreCategoryFallback(word, partOfSpeech, topic, definition);
  const FallbackIcon = EXTENDED_ICONS_MAP[fallback.iconName] || Sparkles;

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : aspectRatio === "video"
      ? "aspect-[16/9]"
      : "aspect-[16/10]";

  const altText = imageAlt || autoMatch.imageAlt || `Visual representation of ${word}`;
  const shouldRenderImage = Boolean(currentSrc && currentSrc.trim() !== "" && !hasError);

  const effectiveCreator = creator || (currentSrc === autoMatch.imageUrl ? autoMatch.creator : null);
  const effectiveCreatorUrl = creatorUrl || (currentSrc === autoMatch.imageUrl ? autoMatch.creatorUrl : null);
  const effectiveSourceName = sourceName || (currentSrc === autoMatch.imageUrl ? autoMatch.sourceName : null);
  const effectiveLicense = license || (currentSrc === autoMatch.imageUrl ? autoMatch.sourceLicense : null);
  const hasAttribution = Boolean(effectiveCreator || effectiveSourceName);

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted/40 shadow-sm transition-all select-none",
        aspectClass,
        className
      )}
    >
      {shouldRenderImage ? (
        <>
          {/* Skeleton Shimmer while loading image */}
          {isLoading && (
            <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
            </div>
          )}

          {/* Actual image rendered with Next.js Image */}
          <Image
            src={currentSrc}
            alt={altText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
            priority={priority}
            unoptimized
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              if (!triedFallback && currentSrc !== autoMatch.imageUrl) {
                // Secondary self-healing: switch to verified auto-matched image
                setTriedFallback(true);
                setCurrentSrc(autoMatch.imageUrl);
                setIsLoading(true);
              } else {
                setHasError(true);
                setIsLoading(false);
              }
            }}
          />

          {/* Subtle gradient overlay at bottom for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Attribution Badge (Required by License) */}
          {hasAttribution && (
            <div
              className="absolute bottom-2 right-2 z-20 opacity-70 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {effectiveCreatorUrl || sourceUrl ? (
                <a
                  href={effectiveCreatorUrl || sourceUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] text-white/90 hover:text-white transition-colors border border-white/10"
                  title={`Photo by ${effectiveCreator || "Unknown"} on ${effectiveSourceName || "Web"}${effectiveLicense ? ` (${effectiveLicense})` : ""}`}
                >
                  <span className="truncate max-w-[120px]">
                    {effectiveCreator ? `© ${effectiveCreator}` : effectiveSourceName}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              ) : (
                <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] text-white/80 border border-white/10">
                  {effectiveCreator ? `© ${effectiveCreator}` : effectiveSourceName}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        /* Guaranteed Category Fallback Illustration (Never empty space) */
        <div
          className={cn(
            "relative flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br transition-colors overflow-hidden",
            fallback.bg
          )}
          role="img"
          aria-label={altText}
        >
          {/* Decorative background glow circles */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/15 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          {/* Symbolic background geometry for Abstract words */}
          {fallback.id === "abstract" && (
            <svg
              className="absolute inset-0 h-full w-full opacity-10 pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon points="50,15 90,85 10,85" stroke="currentColor" fill="none" strokeWidth="1" />
              <circle cx="50" cy="50" r="30" stroke="currentColor" fill="none" strokeWidth="1" />
              <line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="0.75" />
            </svg>
          )}

          {/* Icon Badge */}
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-background/85 shadow-md backdrop-blur-md transition-transform group-hover:scale-105">
            <FallbackIcon className={cn("h-8 w-8", fallback.accent)} aria-hidden="true" />
          </div>

          {/* Category Tag & Word Reminder */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90">
              <span>{fallback.nameTh}</span>
              <span>•</span>
              <span>{fallback.name}</span>
            </span>
            <span className="mt-1 text-base font-bold tracking-tight text-foreground/90 line-clamp-1">
              {word}
            </span>
            <span className="mt-1 text-[11px] text-muted-foreground/80 max-w-[240px] line-clamp-1 italic">
              {fallback.symbolDescription}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
