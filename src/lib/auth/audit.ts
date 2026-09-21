import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditActionType } from "@/types/auth";

interface LogAuditEventOptions {
  adminUserId?: string | null;
  action: AuditActionType;
  entityType: string;
  entityId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
}

/**
 * Sanitize data to strip sensitive fields (passwords, tokens, keys)
 */
function sanitizeAuditData(data?: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return null;
  const sensitiveKeys = ["password", "token", "secret", "apiKey", "access_token", "refresh_token", "key"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Record an action to the public.admin_audit_logs table.
 */
export async function logAdminAudit(options: LogAuditEventOptions): Promise<void> {
  try {
    const cleanBefore = sanitizeAuditData(options.beforeData);
    const cleanAfter = sanitizeAuditData(options.afterData);

    // Prefer service role client if available to ensure log writes succeed regardless of RLS edge cases
    let client;
    try {
      client = createAdminClient();
    } catch {
      client = await createServerSupabaseClient();
    }

    await client.from("admin_audit_logs").insert({
      admin_user_id: options.adminUserId ?? null,
      action: options.action,
      entity_type: options.entityType,
      entity_id: options.entityId ?? null,
      before_data: cleanBefore as never,
      after_data: cleanAfter as never,
    });
  } catch (error) {
    console.error("Failed to write to admin_audit_logs:", error);
    // Non-blocking for caller
  }
}
