"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setResendError(error.message);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setResendError("เกิดข้อผิดพลาดในการส่งอีเมลซ้ำ");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-3xl border-border/80 bg-card shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center p-6 pb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2 shadow-sm">
          <MailCheck className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          กรุณายืนยันอีเมลของคุณ
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          เราได้ส่งลิงก์ยืนยันตัวตนไปยังอีเมล{" "}
          {email ? <strong className="text-foreground">{email}</strong> : "ของคุณ"} แล้ว
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        <div className="rounded-2xl bg-secondary/50 border border-border/60 p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            กรุณาเปิดอีเมลและคลิกลิงก์ยืนยัน เพื่อเปิดใช้งานบัญชีและเข้าสู่ระบบ VocabFlow
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            * หากไม่พบในกล่องข้อความหลัก กรุณาลองตรวจสอบในโฟลเดอร์ขยะ (Spam / Junk)
          </p>
        </div>

        {resendSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>ส่งอีเมลยืนยันตัวตนใหม่เรียบร้อยแล้ว</span>
          </div>
        )}

        {resendError && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{resendError}</span>
          </div>
        )}

        {email && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={isResending}
            className="w-full h-11 rounded-2xl text-xs font-semibold gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
            <span>{isResending ? "กำลังส่ง..." : "ส่งอีเมลยืนยันซ้ำอีกครั้ง"}</span>
          </Button>
        )}

        <div className="pt-2 border-t border-border/60 text-center">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="h-96 w-full max-w-md bg-muted/40 rounded-3xl animate-pulse" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
