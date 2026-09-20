import { Skeleton } from "@/components/feedback/loading-skeleton";

export default function ProgressLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
