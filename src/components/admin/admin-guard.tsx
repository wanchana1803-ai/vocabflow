"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Lock, ArrowLeft, KeyRound } from "lucide-react";

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
      return window.sessionStorage.getItem("vocabflow_admin_unlocked") === "true";
    } catch {
      return false;
    }
  });
  const [passkeyInput, setPasskeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Standard dev/demo admin passkey
    if (passkeyInput.trim() === "admin123" || passkeyInput.trim() === "vocabflow-admin") {
      setIsAdminUnlocked(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("vocabflow_admin_unlocked", "true");
      }
    } else {
      setErrorMessage("Invalid admin passcode. Try 'admin123' for demo access.");
    }
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
              This area is restricted to administrators. Enter the admin passkey to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4 space-y-4">
            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter admin passcode (e.g. admin123)"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="pl-10 h-11 rounded-2xl bg-background text-sm"
                  autoFocus
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-destructive font-medium">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full h-11 rounded-2xl gap-2 font-semibold shadow-sm">
                <KeyRound className="h-4 w-4" />
                <span>Verify Passcode</span>
              </Button>
            </form>

            <div className="pt-2 border-t border-border/60 text-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Home</span>
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
