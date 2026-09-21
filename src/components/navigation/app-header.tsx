"use client";

import React, { useSyncExternalStore, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Flame, Moon, Sun, BookOpen, Shield, User as UserIcon, LogOut, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useStreak } from "@/hooks/use-streak";

const BASE_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/review", label: "Review" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, profile, isAdmin, isAuthenticated, isLoading, signOut } = useAuth();
  const { streak } = useStreak();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    ...BASE_NAV_LINKS,
    ...(isAdmin ? [{ href: "/admin/vocabulary", label: "Admin", isAdmin: true }] : []),
  ];

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "ผู้ใช้";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Vocab<span className="text-primary">Flow</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              ("isAdmin" in link && pathname.startsWith("/admin"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  "isAdmin" in link && "text-amber-600 dark:text-amber-400"
                )}
              >
                {"isAdmin" in link && <Shield className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions: Streak, Theme toggle, Auth */}
        <div className="flex items-center gap-2">
          {mounted && (
            <div
              className={cn(
                "hidden sm:flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                streak > 0
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted/70 text-muted-foreground"
              )}
              title={
                streak > 0
                  ? `Current study streak: ${streak} days`
                  : "Streak: 0 วัน (เริ่มนับเมื่อเรียนต่อเนื่องในวันถัดไป)"
              }
            >
              <Flame
                className={cn(
                  "h-4 w-4",
                  streak > 0 ? "fill-amber-500 text-amber-500" : "text-muted-foreground/60"
                )}
              />
              <span>{streak} {streak === 1 ? "Day" : "Days"}</span>
            </div>
          )}

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* User Auth state */}
          {isLoading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-muted/80 transition-colors border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {userInitials}
                </div>
                <span className="hidden sm:inline-block text-xs font-medium text-foreground max-w-[100px] truncate">
                  {displayName}
                </span>
                {isAdmin && (
                  <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Admin
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        isAdmin ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"
                      )}>
                        Role: {profile?.role || "user"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/account"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    ข้อมูลบัญชี (Account)
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin/vocabulary"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      จัดการคำศัพท์ (Admin)
                    </Link>
                  )}

                  <div className="my-1 border-t border-border/60" />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ (Sign Out)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs h-9 font-medium">
                <Link href="/login" className="flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl text-xs h-9 font-semibold bg-primary hover:bg-primary/90 hidden sm:inline-flex">
                <Link href="/register">
                  สมัครสมาชิก
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
