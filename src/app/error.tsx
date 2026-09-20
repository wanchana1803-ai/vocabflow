"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        An unexpected error occurred while loading this page.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()} className="rounded-xl flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
        <Button variant="outline" onClick={() => router.push("/")} className="rounded-xl">
          Return Home
        </Button>
      </div>
    </div>
  );
}
