import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface UserSettings {
  preferredAccent: "US" | "UK";
  dailyGoal: number;
  theme: "system" | "light" | "dark";
  soundEffectsEnabled: boolean;
  autoPlayAudio: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  preferredAccent: "US",
  dailyGoal: 10,
  theme: "system",
  soundEffectsEnabled: true,
  autoPlayAudio: false,
};

/**
 * Fetch settings for a user
 */
export async function getUserSettings(
  userId: string
): Promise<{ data: UserSettings; error: string | null }> {
  if (!isSupabaseConfigured() || !userId) {
    return { data: DEFAULT_USER_SETTINGS, error: null };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    if (!data) return { data: DEFAULT_USER_SETTINGS, error: null };

    return {
      data: {
        preferredAccent: (data.preferred_accent as "US" | "UK") || "US",
        dailyGoal: data.daily_goal,
        theme: (data.theme as "system" | "light" | "dark") || "system",
        soundEffectsEnabled: data.sound_effects_enabled,
        autoPlayAudio: data.auto_play_audio,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: DEFAULT_USER_SETTINGS,
      error: err instanceof Error ? err.message : "Failed to load settings",
    };
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !userId) {
    return { success: true, error: null };
  }

  try {
    const supabase = createClient();
    const updatePayload: {
      preferred_accent?: string;
      daily_goal?: number;
      theme?: string;
      sound_effects_enabled?: boolean;
      auto_play_audio?: boolean;
    } = {};

    if (settings.preferredAccent !== undefined) updatePayload.preferred_accent = settings.preferredAccent;
    if (settings.dailyGoal !== undefined) updatePayload.daily_goal = settings.dailyGoal;
    if (settings.theme !== undefined) updatePayload.theme = settings.theme;
    if (settings.soundEffectsEnabled !== undefined) updatePayload.sound_effects_enabled = settings.soundEffectsEnabled;
    if (settings.autoPlayAudio !== undefined) updatePayload.auto_play_audio = settings.autoPlayAudio;

    const { error } = await supabase
      .from("user_settings")
      .update(updatePayload)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update settings",
    };
  }
}
