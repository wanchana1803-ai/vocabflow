import { Skeleton } from "@/components/feedback/loading-skeleton";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-36 rounded-3xl" />
      <Skeleton className="h-36 rounded-3xl" />
      <Skeleton className="h-36 rounded-3xl" />
    </div>
  );
}
