"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validation/auth-schema";
import { forgotPasswordAction } from "@/app/api/auth/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      await forgotPasswordAction(null, formData);
      // Always show success message to prevent user enumeration
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-3xl border-border/80 bg-card shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center p-6 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto mb-2 shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            ลืมรหัสผ่าน
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          {isSubmitted ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">ตรวจสอบกล่องข้อความของคุณ</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  หากอีเมล <strong className="text-foreground">{email}</strong> มีอยู่ในระบบ
                  เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องข้อความหรือโฟลเดอร์สแปม
                </p>
              </div>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full rounded-2xl h-11 text-xs font-semibold gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>กลับไปหน้าเข้าสู่ระบบ</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="forgot-email">
                  อีเมลของคุณ (Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isSubmitting}
                    className={`pl-10 h-11 rounded-2xl text-xs bg-background ${
                      error ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    autoFocus
                  />
                </div>
                {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-2xl font-bold gap-2 text-xs shadow-md transition-transform active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>กำลังส่งคำขอ...</span>
                  </>
                ) : (
                  <span>ส่งลิงก์ตั้งรหัสผ่านใหม่</span>
                )}
              </Button>

              <div className="text-center pt-2 border-t border-border/60">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
