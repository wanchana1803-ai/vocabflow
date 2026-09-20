import { Skeleton } from "@/components/feedback/loading-skeleton";

export default function AdminImportLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-8 w-64 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
