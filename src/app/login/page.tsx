"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, LogIn, Lock, Mail, AlertCircle, ArrowRight, Loader2, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { loginSchema } from "@/lib/validation/auth-schema";
import { loginAction } from "@/app/api/auth/actions";
import { useAuth } from "@/components/auth/auth-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const { user, profile, isAdmin, isAuthenticated, signOut, refreshProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    if (isSubmitting) return;

    setServerError(null);
    setErrors({});

    // Client-side validation with Zod
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPass });
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
      formData.set("email", loginEmail);
      formData.set("password", loginPass);

      const result = await loginAction(null, formData);

      if (!result.success) {
        setServerError(result.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        if (result.requiresEmailConfirmation) {
          router.push(`/verify-email?email=${encodeURIComponent(loginEmail)}`);
        }
      } else {
        await refreshProfile();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("vocabflow-auth-change"));
        }
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : (loginEmail.toLowerCase().includes("admin") ? "/admin/vocabulary" : "/");
        window.location.href = safeNext;
      }
    } catch {
      setServerError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleAdminSelect = () => {
    setEmail("admin@vocabflow.local");
    setPassword("");
    setServerError(null);
    setErrors({});
    setTimeout(() => {
      document.getElementById("login-password")?.focus();
    }, 50);
  };

  const handleUserQuickLogin = async () => {
    setEmail("user@vocabflow.local");
    setPassword("user123456");
    await performLogin("user@vocabflow.local", "user123456");
  };

  const isAdminEmail = email.toLowerCase().includes("admin");

  return (
    <Card className="w-full max-w-md rounded-3xl border-border/80 bg-card shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center p-6 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground mx-auto mb-2 shadow-sm">
          <BookOpen className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          เข้าสู่ระบบ VocabFlow
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          เข้าสู่ระบบเพื่อซิงค์ข้อมูลคำศัพท์ บันทึกความก้าวหน้า และทบทวนการ์ด
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
                  window.location.href = isAdmin ? "/admin/vocabulary" : "/";
                }}
                className="h-8 text-xs font-semibold rounded-xl flex-1 cursor-pointer"
              >
                {isAdmin ? "ไปหน้าจัดการคำศัพท์ (Admin)" : "ไปยังหน้าหลัก (Home)"}
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between" htmlFor="login-email">
              <span>อีเมล (Email)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
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
                autoFocus
              />
            </div>
            {errors.email && <p className="text-[11px] text-destructive font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5" htmlFor="login-password">
                <span>รหัสผ่าน (Password)</span>
                {isAdminEmail && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    (ต้องระบุรหัสผ่าน Admin)
                  </span>
                )}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
                tabIndex={0}
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
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
                autoComplete="current-password"
              />
            </div>
            {errors.password && <p className="text-[11px] text-destructive font-medium">{errors.password}</p>}
          </div>

          {/* Admin password guidance box when Admin email is typed */}
          {isAdminEmail && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>สิทธิ์ Admin ต้องใส่รหัสผ่าน</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                • รหัสผ่านเริ่มต้นคือ: <code className="px-1.5 py-0.5 rounded bg-card font-mono font-bold text-foreground border border-border/80">admin123456</code>
                <br />
                • <strong>ต้องการเปลี่ยนรหัสผ่าน?</strong> ตั้งค่าได้ที่ตัวแปร <code className="text-primary font-mono font-semibold">ADMIN_PASSWORD</code> ในไฟล์ <code className="font-mono font-semibold">.env.local</code> ที่โฟลเดอร์โปรเจกต์
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-2xl font-bold gap-2 text-xs shadow-md transition-transform active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </Button>
        </form>

        {/* Quick Demo Login Buttons */}
        <div className="pt-3 border-t border-border/60 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground text-center">
            เลือกประเภทบัญชีสำหรับทดสอบ (Quick Selector)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleAdminSelect}
              className="h-10 rounded-2xl text-[11px] font-bold border-amber-500/40 hover:border-amber-500 hover:bg-amber-500/10 text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="เลือกบัญชี Admin เพื่อกรอกรหัสผ่าน"
            >
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Admin (ต้องใส่รหัส)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleUserQuickLogin}
              className="h-10 rounded-2xl text-[11px] font-semibold border-border hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="เข้าสู่ระบบบัญชี User ทันที"
            >
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span>User ทดสอบ</span>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/80 text-center leading-tight">
            * สิทธิ์ Admin เท่านั้นที่สามารถเพิ่ม ลบ แก้ไขคำศัพท์ได้ที่หน้า Admin
          </p>
        </div>

        <div className="text-center pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            ยังไม่มีบัญชีใช่หรือไม่?{" "}
            <Link
              href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>สมัครสมาชิกใหม่</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="h-96 w-full max-w-md bg-muted/40 rounded-3xl animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
