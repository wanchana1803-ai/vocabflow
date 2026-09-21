"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile, UserRole } from "@/types/auth";
import { useRouter, usePathname } from "next/navigation";
import { parseSessionCookieValue } from "@/lib/auth/session-cookie";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

function getInitialLocalState(): { user: User | null; profile: UserProfile | null } {
  if (typeof document === "undefined" || isSupabaseConfigured()) {
    return { user: null, profile: null };
  }
  const match = document.cookie.match(/(?:^|;\s*)vocabflow_session=([^;]+)/);
  if (match) {
    const parsed = parseSessionCookieValue(match[1]);
    if (parsed) {
      return parsed;
    }
  }
  return { user: null, profile: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start with null for SSR safety (avoids hydration mismatch).
  // Cookie is read in useEffect (client-only) below.
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, role, created_at, updated_at")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfile({
          id: data.id,
          email: data.email,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          role: (data.role as UserRole) || "user",
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        // Fallback default profile
        setProfile({
          id: currentUser.id,
          email: currentUser.email ?? null,
          display_name:
            currentUser.user_metadata?.full_name ??
            currentUser.user_metadata?.display_name ??
            currentUser.email?.split("@")[0] ??
            "User",
          avatar_url: currentUser.user_metadata?.avatar_url ?? null,
          role: "user",
          created_at: currentUser.created_at,
          updated_at: currentUser.created_at,
        });
      }
    } catch {
      // safe fallback
      setProfile(null);
    }
  }, []);

  const readLocalSession = useCallback(() => {
    const { user: localUser, profile: localProfile } = getInitialLocalState();
    setUser(localUser);
    setProfile(localProfile);
    setIsLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      readLocalSession();
      return;
    }
    if (!user) {
      setProfile(null);
      return;
    }
    await fetchProfile(user);
  }, [user, fetchProfile, readLocalSession]);

  // ── Local Dev Mode (no Supabase): read cookie on client mount & event listeners ──────
  useEffect(() => {
    if (isSupabaseConfigured()) return;

    // Initial read after mount (avoids SSR hydration mismatch)
    const syncFromCookie = () => {
      readLocalSession();
    };

    syncFromCookie();

    // Listen for cross-component auth state changes, focus, and visibility
    window.addEventListener("vocabflow-auth-change", syncFromCookie);
    window.addEventListener("focus", syncFromCookie);
    document.addEventListener("visibilitychange", syncFromCookie);
    return () => {
      window.removeEventListener("vocabflow-auth-change", syncFromCookie);
      window.removeEventListener("focus", syncFromCookie);
      document.removeEventListener("visibilitychange", syncFromCookie);
    };
  }, [readLocalSession]);

  // ── Re-sync session state whenever navigation / route changes ──────────
  useEffect(() => {
    if (isSupabaseConfigured()) return;
    const timer = setTimeout(() => {
      readLocalSession();
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname, readLocalSession]);

  // ── Supabase Mode: session + auth state listener ─────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    } finally {
      if (typeof document !== "undefined") {
        document.cookie = "vocabflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
        window.dispatchEvent(new Event("vocabflow-auth-change"));
      }
      setUser(null);
      setProfile(null);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";
  const isAuthenticated = Boolean(user);

  const value = useMemo(
    () => ({
      user,
      profile,
      role,
      isAdmin,
      isAuthenticated,
      isLoading,
      refreshProfile,
      signOut,
    }),
    [user, profile, role, isAdmin, isAuthenticated, isLoading, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
