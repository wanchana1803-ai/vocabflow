import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted/60", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-3xl border bg-card/60 shadow-sm space-y-4">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-1/3 mx-auto rounded-md" />
      </div>
      <div className="pt-4 space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>
    </div>
  );
}
