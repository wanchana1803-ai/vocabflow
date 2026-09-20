"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, BookOpen, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin/import",
      label: "นำเข้าคำศัพท์ (Import)",
      icon: Upload,
      active: pathname.startsWith("/admin/import"),
    },
    {
      href: "/vocabulary",
      label: "จัดการคลังคำศัพท์ (Vocab)",
      icon: BookOpen,
      active: pathname.startsWith("/vocabulary"),
    },
  ];

  return (
    <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Admin Portal
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold py-0.5">
              <ShieldCheck className="h-3 w-3" />
              <span>Authorized</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            เครื่องมือบริหารจัดการคลังคำศัพท์และการนำเข้าข้อมูลคำศัพท์
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 self-start sm:self-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  item.active
                    ? "bg-background text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", item.active ? "text-primary" : "")} />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
