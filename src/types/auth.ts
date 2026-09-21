export type UserRole = "user" | "admin";

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type AuditActionType =
  | "vocabulary_created"
  | "vocabulary_updated"
  | "vocabulary_deleted"
  | "vocabulary_imported"
  | "image_uploaded"
  | "image_replaced"
  | "role_changed";

export interface AdminAuditLog {
  id: string;
  admin_user_id: string | null;
  action: AuditActionType;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

export interface BookmarkItem {
  id: string;
  user_id: string;
  vocabulary_id: string;
  created_at: string;
}
