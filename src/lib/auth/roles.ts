import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { UserProfile, UserRole } from "@/types/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { parseSessionCookieValue } from "@/lib/auth/session-cookie";

export function isGuestModeAllowed(): boolean {
  // Defaults to true unless explicitly disabled in env
  return process.env.NEXT_PUBLIC_ALLOW_GUEST_MODE !== "false";
}

/**
 * Get current authenticated user profile from database.
 * Always resolves role directly from the server-side 'profiles' table.
 * Supports seamless Local Dev fallback when Supabase keys are not configured.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    if (!isSupabaseConfigured()) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("vocabflow_session");
      if (sessionCookie?.value) {
        const parsed = parseSessionCookieValue(sessionCookie.value);
        if (parsed) {
          return parsed.profile;
        }
      }
      return null;
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, role, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // Return a basic profile with default 'user' role if profile not yet provisioned
      return {
        id: user.id,
        email: user.email ?? null,
        display_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: "user",
        created_at: user.created_at,
        updated_at: user.created_at,
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      role: (profile.role as UserRole) || "user",
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Get current user role ('user' | 'admin' | null)
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const profile = await getCurrentUserProfile();
  return profile?.role ?? null;
}

/**
 * Server guard: Require authenticated user.
 * Redirects to /login?next=... if not authenticated.
 */
export async function requireAuth(nextUrl = "/") {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextUrl)}`);
  }
  return profile;
}

/**
 * Server guard: Require admin role.
 * Redirects to /login if unauthenticated, or /unauthorized if not admin.
 */
export async function requireAdmin(nextUrl = "/admin") {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextUrl)}`);
  }
  if (profile.role !== "admin") {
    redirect("/unauthorized");
  }
  return profile;
}
