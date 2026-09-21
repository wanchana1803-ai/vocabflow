"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Lock, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.sessionStorage.getItem("vocabflow_admin_unlocked") === "true" ||
        window.localStorage.getItem("vocabflow_admin_unlocked") === "true"
      );
    } catch {
      return false;
    }
  });
  const [passkeyInput, setPasskeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const unlockWithCode = (code: string) => {
    const clean = code.trim();
    const envKey = process.env.NEXT_PUBLIC_ADMIN_PASSKEY;
    if (
      clean === "admin123456" ||
      clean === "admin123" ||
      clean === "vocabflow-admin" ||
      (envKey && clean === envKey)
    ) {
      setIsAdminUnlocked(true);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("vocabflow_admin_unlocked", "true");
          window.localStorage.setItem("vocabflow_admin_unlocked", "true");
        } catch {
          // safe
        }
      }
      return true;
    } else {
      setErrorMessage("รหัสผ่านไม่ถูกต้อง รหัสเริ่มต้นคือ 'admin123456' (ตั้งค่าได้ที่ .env.local)");
      return false;
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    unlockWithCode(passkeyInput);
  };

  if (!isClient) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <div className="h-8 w-40 animate-pulse bg-muted rounded-lg mx-auto" />
      </div>
    );
  }

  if (!isAdminUnlocked) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card className="rounded-3xl border-border/80 shadow-lg">
          <CardHeader className="text-center p-6 pb-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto mb-3">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl font-bold">Admin Portal Access</CardTitle>
            <CardDescription className="text-xs">
              หน้านี้สงวนสิทธิ์สำหรับผู้ดูแลระบบ กรุณาระบุรหัสผ่านเพื่อเข้าใช้งาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-4">
            {/* Quick 1-Click Access for Demo / Development */}
            <div className="rounded-2xl bg-secondary/60 p-3.5 border border-border/70 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">รหัสผ่านเริ่มต้น (Demo Key):</span>
                <code className="px-2 py-0.5 rounded bg-card font-mono font-bold text-primary border border-border">
                  admin123
                </code>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPasskeyInput("admin123");
                  unlockWithCode("admin123");
                }}
                className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>คลิกเพื่อปลดล็อคทันที (Use Demo Key: admin123)</span>
              </Button>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่าน (เช่น admin123)"
                  value={passkeyInput}
                  onChange={(e) => {
                    setPasskeyInput(e.target.value);
                    setErrorMessage("");
                  }}
                  className="pl-10 h-11 rounded-2xl bg-background text-sm"
                  autoFocus
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-destructive font-medium">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full h-11 rounded-2xl gap-2 font-semibold shadow-sm">
                <KeyRound className="h-4 w-4" />
                <span>ยืนยันรหัสผ่าน (Verify Passcode)</span>
              </Button>
            </form>

            <div className="pt-2 border-t border-border/60 text-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>กลับหน้าแรก (Return to Home)</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
