import React from "react";
import { requireAdmin } from "@/lib/auth/roles";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = {
  title: "Admin Portal",
  description: "VocabFlow Administrator Control Panel",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: Strict server-side verification of admin session & database role
  await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
