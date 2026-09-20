"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, Compass, Heart, Sparkles, Trophy, MessageCircle, Layers } from "lucide-react";
import { getCategoryFallback } from "@/lib/images/fallback";
import { cn } from "@/lib/utils";

interface VocabImageProps {
  imageUrl?: string | null;
  imageAlt?: string | null;
  word: string;
  topic?: string | null;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
}

const ICONS_MAP: Record<string, React.ElementType> = {
  "book-open": BookOpen,
  compass: Compass,
  heart: Heart,
  sparkles: Sparkles,
  trophy: Trophy,
  "message-circle": MessageCircle,
  layers: Layers,
};

export function VocabImage({
  imageUrl,
  imageAlt,
  word,
  topic,
  className,
  aspectRatio = "video",
}: VocabImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fallback = getCategoryFallback(topic);
  const FallbackIcon = ICONS_MAP[fallback.iconName] || Layers;

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : "aspect-[16/10]";

  const altText = imageAlt || `Visual representation of ${word}`;

  if (!imageUrl || hasError) {
    return (
      <div
        className={cn(
          "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br border border-border/50",
          fallback.bg,
          aspectClass,
          className
        )}
        role="img"
        aria-label={altText}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card/80 text-primary shadow-sm backdrop-blur-sm">
          <FallbackIcon className="h-7 w-7" />
        </div>
        {topic && (
          <span className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {topic}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/30",
        aspectClass,
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted/60 z-10" />
      )}
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        unoptimized
      />
    </div>
  );
}
