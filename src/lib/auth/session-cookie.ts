import type { User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "../../types/auth";

export interface SessionUserData {
  id: string;
  email: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole | string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Safely parses the vocabflow_session cookie value.
 * Handles raw JSON, single-encoded URI components, or double-encoded URI components.
 */
export function parseSessionCookieValue(cookieValue: string | undefined | null): {
  user: User;
  profile: UserProfile;
} | null {
  if (!cookieValue) return null;

  try {
    let decoded = cookieValue;
    // Decode percent-encoding safely (supports 0, 1, or 2 levels of URL encoding)
    if (decoded.includes("%")) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // ignore
      }
    }
    if (decoded.includes("%")) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // ignore
      }
    }

    const parsed = JSON.parse(decoded) as Partial<SessionUserData>;
    if (!parsed || !parsed.id) return null;

    const email = parsed.email ?? null;
    const role = (parsed.role as UserRole) || "user";
    const displayName =
      parsed.display_name || (email ? email.split("@")[0] : "User");

    const user = {
      id: parsed.id,
      email: email ?? undefined,
      user_metadata: {
        display_name: displayName,
        avatar_url: parsed.avatar_url ?? null,
      },
      created_at: parsed.created_at || new Date().toISOString(),
    } as unknown as User;

    const profile: UserProfile = {
      id: parsed.id,
      email,
      display_name: displayName,
      avatar_url: parsed.avatar_url ?? null,
      role,
      created_at: parsed.created_at || new Date().toISOString(),
      updated_at: parsed.updated_at || new Date().toISOString(),
    };

    return { user, profile };
  } catch {
    return null;
  }
}
