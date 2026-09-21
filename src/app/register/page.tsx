"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, UserPlus, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, CheckCircle2, UserCheck } from "lucide-react";
import { registerSchema } from "@/lib/validation/auth-schema";
import { registerAction } from "@/app/api/auth/actions";
import { useAuth } from "@/components/auth/auth-provider";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const { user, profile, isAdmin, isAuthenticated, signOut, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    setErrors({});

    // Client-side validation with Zod
    const validation = registerSchema.safeParse({
      displayName,
      email,
      password,
      confirmPassword,
    });

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
      formData.set("displayName", displayName);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const result = await registerAction(null, formData);

      if (!result.success) {
        setServerError(result.error ?? "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      } else {
        if (result.requiresEmailConfirmation) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          setSuccessMessage(result.message ?? "สมัครสมาชิกสำเร็จ กำลังนำคุณเข้าสู่ระบบ...");
          await refreshProfile();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("vocabflow-auth-change"));
          }
          setTimeout(() => {
            const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
            window.location.href = safeNext;
          }, 800);
        }
      }
    } catch {
      setServerError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-3xl border-border/80 bg-card shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center p-6 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground mx-auto mb-2 shadow-sm">
          <BookOpen className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          สมัครสมาชิกใหม่
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          สร้างบัญชีฟรีเพื่อเริ่มต้นเรียนรู้และจำคำศัพท์ด้วยระบบ Spaced Repetition
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {/* If already logged in, show current session banner */}
        {isAuthenticated && user && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>คุณเข้าสู่ระบบอยู่แล้ว</span>
              </div>
              <span className="font-bold text-primary uppercase text-[10px] bg-primary/20 px-2 py-0.5 rounded-full">
                {profile?.role || (isAdmin ? "admin" : "user")}
              </span>
            </div>
            <p className="text-muted-foreground truncate font-mono text-[11px]">{user.email}</p>
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  router.push("/");
                }}
                className="h-8 text-xs font-semibold rounded-xl flex-1 cursor-pointer"
              >
                ไปยังหน้าหลัก (Home)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await signOut();
                }}
                className="h-8 text-xs font-medium rounded-xl text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="reg-name">
              ชื่อที่แสดง (Display Name)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-name"
                type="text"
                placeholder="เช่น สมชาย ใจดี"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: "" }));
                }}
                disabled={isSubmitting}
                className={`pl-10 h-11 rounded-2xl text-xs bg-background ${
                  errors.displayName ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                autoFocus
              />
            </div>
            {errors.displayName && (
              <p className="text-[11px] text-destructive font-medium">{errors.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="reg-email">
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                disabled={isSubmitting}
                className={`pl-10 h-11 rounded-2xl text-xs bg-background ${
                  errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-[11px] text-destructive font-medium">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="reg-password">
              รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-password"
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
                autoComplete="new-password"
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-destructive font-medium">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="reg-confirm">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-confirm"
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
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-destructive font-medium">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-2xl font-bold gap-2 text-xs shadow-md transition-transform active:scale-[0.99] mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>สมัครสมาชิก</span>
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            มีบัญชีผู้ใช้อยู่แล้ว?{" "}
            <Link
              href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="h-96 w-full max-w-md bg-muted/40 rounded-3xl animate-pulse" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
