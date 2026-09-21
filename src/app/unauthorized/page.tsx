"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function UnauthorizedPage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-3xl border-destructive/30 bg-card shadow-xl text-center">
        <CardHeader className="p-6 pb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mx-auto mb-3 shadow-inner">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            ไม่มีสิทธิ์เข้าถึง (403 Forbidden)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณไม่มีสิทธิ์ในการจัดการข้อมูลส่วนนี้
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-2 space-y-4">
          {user && (
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3.5 text-xs text-left space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>บัญชีปัจจุบัน:</span>
                <span className="font-semibold text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>ระดับสิทธิ์ (Role):</span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-primary font-bold text-[10px] uppercase">
                  {profile?.role ?? "user"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link href="/" className="flex-1">
              <Button variant="default" className="w-full h-11 rounded-2xl text-xs font-bold gap-2">
                <Home className="h-4 w-4" />
                <span>กลับหน้าหลัก</span>
              </Button>
            </Link>
            <Link href="/vocabulary" className="flex-1">
              <Button variant="outline" className="w-full h-11 rounded-2xl text-xs font-semibold gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>คลังคำศัพท์</span>
              </Button>
            </Link>
          </div>

          {user && (
            <div className="pt-2 border-t border-border/60 text-center">
              <button
                type="button"
                onClick={() => signOut()}
                className="text-xs text-destructive hover:underline font-medium cursor-pointer"
              >
                สลับบัญชีผู้ใช้ (ออกจากระบบ)
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
