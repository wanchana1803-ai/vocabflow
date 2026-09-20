import { CardSkeleton } from "@/components/feedback/loading-skeleton";

export default function ReviewLoading() {
  return (
    <div className="container mx-auto max-w-md px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-6 w-32 animate-pulse bg-muted rounded-md" />
        <div className="h-6 w-16 animate-pulse bg-muted rounded-full" />
      </div>
      <CardSkeleton />
    </div>
  );
}
