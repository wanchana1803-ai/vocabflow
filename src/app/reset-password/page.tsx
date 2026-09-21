"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { resetPasswordSchema } from "@/lib/validation/auth-schema";
import { resetPasswordAction } from "@/app/api/auth/actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    setErrors({});

    const validation = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const result = await resetPasswordAction(null, formData);

      if (!result.success) {
        setServerError(result.error ?? "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setServerError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-3xl border-border/80 bg-card shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center p-6 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-2 shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            ตั้งรหัสผ่านใหม่
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            กรุณากรอกรหัสผ่านใหม่ของคุณที่มีความยาวอย่างน้อย 8 ตัวอักษร
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground">เปลี่ยนรหัสผ่านสำเร็จแล้ว!</h3>
                <p className="text-xs text-muted-foreground">
                  กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
                </p>
              </div>
              <div className="pt-2">
                <Link href="/login">
                  <Button className="w-full rounded-2xl h-11 text-xs font-bold gap-2">
                    <span>ไปที่หน้าเข้าสู่ระบบ</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="new-password">
                  รหัสผ่านใหม่ (New Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    disabled={isSubmitting}
                    className={`pl-10 h-11 rounded-2xl text-xs bg-background ${
                      errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    autoFocus
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive font-medium">{errors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="new-confirm-password">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    disabled={isSubmitting}
                    className={`pl-10 h-11 rounded-2xl text-xs bg-background ${
                      errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-2xl font-bold gap-2 text-xs shadow-md transition-transform active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกรหัสผ่านใหม่</span>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
