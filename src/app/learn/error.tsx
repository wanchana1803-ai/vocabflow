"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Learn Page Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        เกิดข้อผิดพลาดในการโหลดบทเรียน
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "ไม่สามารถแสดงผล Flashcard ได้ กรุณาลองใหม่อีกครั้ง"}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" />
          ลองใหม่อีกครั้ง
        </Button>
        <Button variant="outline" asChild className="rounded-xl">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </Button>
      </div>
    </div>
  );
}
