"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Mail,
  Shield,
  ShieldCheck,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { updateProfileSchema } from "@/lib/validation/auth-schema";
import { updateProfileAction } from "@/app/api/auth/actions";
import type { User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/types/auth";

export default function AccountPage() {
  const { user, profile, role, isAdmin, isLoading, signOut, refreshProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="h-64 rounded-3xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-xs text-muted-foreground">เข้าสู่ระบบเพื่อจัดการข้อมูลบัญชีของคุณ</p>
        <Link href="/login">
          <Button className="rounded-2xl font-semibold">เข้าสู่ระบบ</Button>
        </Link>
      </div>
    );
  }

  return (
    <AccountContent
      key={profile?.id || user.id}
      user={user}
      profile={profile}
      role={role}
      isAdmin={isAdmin}
      signOut={signOut}
      refreshProfile={refreshProfile}
    />
  );
}

function AccountContent({
  user,
  profile,
  role,
  isAdmin,
  signOut,
  refreshProfile,
}: {
  user: User;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const validation = updateProfileSchema.safeParse({ displayName, avatarUrl });
    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("displayName", displayName);
      formData.set("avatarUrl", avatarUrl);

      const result = await updateProfileAction(null, formData);

      if (!result.success) {
        setErrorMsg(result.error ?? "ไม่สามารถบันทึกข้อมูลได้");
      } else {
        setSuccessMsg("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
        await refreshProfile();
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "เมื่อเร็วๆ นี้";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">บัญชีผู้ใช้ (Account)</h1>
          <p className="text-xs text-muted-foreground">
            จัดการข้อมูลส่วนตัว บทบาท และความปลอดภัยของบัญชีคุณ
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          className="rounded-2xl gap-2 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 self-start sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>ออกจากระบบ</span>
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card className="rounded-3xl border-border/80 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-teal-400/20" />
        <CardContent className="p-6 pt-0 relative space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-3.5">
              <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card shadow-md flex items-center justify-center text-primary font-bold text-2xl overflow-hidden">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={displayName || "Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-primary to-teal-400 flex items-center justify-center text-primary-foreground font-extrabold text-2xl">
                    {(displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-0.5 pb-1">
                <h2 className="text-lg font-bold text-foreground">
                  {displayName || "ผู้ใช้งาน VocabFlow"}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="pb-1 self-start sm:self-auto">
              {isAdmin ? (
                <Badge
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-xl gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Administrator</span>
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold px-3 py-1 rounded-xl gap-1.5"
                >
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Standard User</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>เป็นสมาชิกตั้งแต่: {memberSince}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>สิทธิ์การใช้งาน: {role === "admin" ? "ผู้ดูแลระบบเต็มรูปแบบ" : "ผู้ใช้ทั่วไป"}</span>
            </div>
          </div>

          {/* Admin Fast Link */}
          {isAdmin && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>คุณมีสิทธิ์ผู้ดูแลระบบ (Admin)</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  เข้าถึงระบบจัดการคำศัพท์ส่วนกลาง ตรวจสอบ Audit Log และนำเข้าชุดข้อมูลคำศัพท์
                </p>
              </div>
              <Link href="/admin/vocabulary">
                <Button size="sm" className="rounded-xl gap-1.5 text-xs font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <span>ไปยังหน้า Admin</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="rounded-3xl border-border/80 shadow-sm">
        <CardHeader className="p-6 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <span>แก้ไขข้อมูลส่วนตัว (Profile Settings)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            ปรับปรุงชื่อที่แสดงและลิงก์รูปภาพโปรไฟล์ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {successMsg && (
            <div
              role="status"
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="acc-name">
                ชื่อที่แสดง (Display Name)
              </label>
              <Input
                id="acc-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSubmitting}
                className="h-11 rounded-2xl text-xs"
                placeholder="ชื่อของคุณ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="acc-avatar">
                URL รูปโปรไฟล์ (Avatar Image URL)
              </label>
              <Input
                id="acc-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                disabled={isSubmitting}
                className="h-11 rounded-2xl text-xs font-mono"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                ระดับสิทธิ์ในระบบ (Role)
              </label>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs">
                <span className="font-mono font-semibold uppercase">{role ?? "user"}</span>
                <span className="text-[11px] text-muted-foreground">
                  * ไม่สามารถเปลี่ยนสิทธิ์เองได้ (ติดต่อผู้ดูแลระบบ)
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-2xl text-xs font-bold gap-2 px-6 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกการเปลี่ยนแปลง</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
