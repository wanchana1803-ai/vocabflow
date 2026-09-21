export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      vocabularies: {
        Row: {
          id: string;
          word: string;
          normalized_word: string;
          part_of_speech: string;
          cefr_level: "A1" | "A2" | "B1" | "B2" | string;
          definition_en: string;
          definition_th: string | null;
          example_sentence: string;
          example_translation_th: string | null;
          phonetic_uk: string | null;
          phonetic_us: string | null;
          audio_uk_url: string | null;
          audio_us_url: string | null;
          image_url: string;
          image_alt: string;
          topic: string | null;
          tags: string[];
          source_name: string | null;
          source_license: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          normalized_word: string;
          part_of_speech: string;
          cefr_level: "A1" | "A2" | "B1" | "B2" | string;
          definition_en: string;
          definition_th?: string | null;
          example_sentence: string;
          example_translation_th?: string | null;
          phonetic_uk?: string | null;
          phonetic_us?: string | null;
          audio_uk_url?: string | null;
          audio_us_url?: string | null;
          image_url: string;
          image_alt: string;
          topic?: string | null;
          tags?: string[];
          source_name?: string | null;
          source_license?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          normalized_word?: string;
          part_of_speech?: string;
          cefr_level?: "A1" | "A2" | "B1" | "B2" | string;
          definition_en?: string;
          definition_th?: string | null;
          example_sentence?: string;
          example_translation_th?: string | null;
          phonetic_uk?: string | null;
          phonetic_us?: string | null;
          audio_uk_url?: string | null;
          audio_us_url?: string | null;
          image_url?: string;
          image_alt?: string;
          topic?: string | null;
          tags?: string[];
          source_name?: string | null;
          source_license?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          preferred_accent: "US" | "UK" | string;
          daily_goal: number;
          theme: "system" | "light" | "dark" | string;
          sound_effects_enabled: boolean;
          auto_play_audio: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferred_accent?: "US" | "UK" | string;
          daily_goal?: number;
          theme?: "system" | "light" | "dark" | string;
          sound_effects_enabled?: boolean;
          auto_play_audio?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferred_accent?: "US" | "UK" | string;
          daily_goal?: number;
          theme?: "system" | "light" | "dark" | string;
          sound_effects_enabled?: boolean;
          auto_play_audio?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_vocabulary_progress: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          status: "learning" | "reviewing" | "mastered" | string;
          is_learned: boolean;
          repetitions: number;
          interval: number;
          ease_factor: number;
          lapses: number;
          last_reviewed_at: string | null;
          next_review_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_id: string;
          status?: "learning" | "reviewing" | "mastered" | string;
          is_learned?: boolean;
          repetitions?: number;
          interval?: number;
          ease_factor?: number;
          lapses?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_id?: string;
          status?: "learning" | "reviewing" | "mastered" | string;
          is_learned?: boolean;
          repetitions?: number;
          interval?: number;
          ease_factor?: number;
          lapses?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_history: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          rating: "again" | "hard" | "good" | "easy" | string;
          interval_before: number;
          interval_after: number;
          ease_factor_before: number;
          ease_factor_after: number;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_id: string;
          rating: "again" | "hard" | "good" | "easy" | string;
          interval_before?: number;
          interval_after?: number;
          ease_factor_before?: number;
          ease_factor_after?: number;
          reviewed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_id?: string;
          rating?: "again" | "hard" | "good" | "easy" | string;
          interval_before?: number;
          interval_after?: number;
          ease_factor_before?: number;
          ease_factor_after?: number;
          reviewed_at?: string;
        };
        Relationships: [];
      };
      learning_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: "learn" | "review" | string;
          words_studied_count: number;
          duration_seconds: number | null;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: "learn" | "review" | string;
          words_studied_count?: number;
          duration_seconds?: number | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: "learn" | "review" | string;
          words_studied_count?: number;
          duration_seconds?: number | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
