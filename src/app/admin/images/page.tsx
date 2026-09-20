"use client";

import React from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AdminImagesPage() {
  return (
    <AdminGuard>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <AdminNav />

        <Card className="rounded-3xl border-border/80 p-6 text-center max-w-lg mx-auto shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                ระบบรูปภาพถูกปิดการใช้งานแล้ว
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ระบบได้เปลี่ยนมาใช้รูปแบบ Clean Typography เรียบหรู ไม่ใช้รูปภาพ
                คุณสามารถจัดการ ลบ หรือเพิ่มคำศัพท์ได้ที่หน้าคลังคำศัพท์
              </p>
            </div>

            <div className="pt-2">
              <Link href="/vocabulary">
                <Button className="rounded-xl gap-2 font-semibold text-xs">
                  <BookOpen className="h-4 w-4" />
                  <span>ไปยังหน้าคลังคำศัพท์</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
