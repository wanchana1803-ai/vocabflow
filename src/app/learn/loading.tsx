import { FlashcardSkeleton } from "@/components/flashcards/flashcard-skeleton";

export default function LearnLoading() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-8 space-y-4">
      {/* Top progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 animate-pulse bg-muted rounded-md" />
          <div className="h-4 w-20 animate-pulse bg-muted rounded-full" />
        </div>
        <div className="h-2 w-full animate-pulse bg-muted rounded-full" />
      </div>

      {/* Main card skeleton */}
      <FlashcardSkeleton />

      {/* Controls skeleton */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}
