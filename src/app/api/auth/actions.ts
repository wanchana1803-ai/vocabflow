"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/lib/validation/auth-schema";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { parseSessionCookieValue } from "@/lib/auth/session-cookie";

export interface AuthActionResult {
  success: boolean;
  error?: string | null;
  message?: string | null;
  requiresEmailConfirmation?: boolean;
}

/**
 * Log In Server Action
 */
export async function loginAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return { success: false, error: errorMsg };
  }

  // Local Dev Fallback when Supabase keys are not configured
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@vocabflow.local").toLowerCase();
    const inputEmail = parsed.data.email.toLowerCase();
    const isAdminUser = inputEmail.includes("admin") || inputEmail === adminEmail;

    // Enforce Admin password verification
    if (isAdminUser) {
      const requiredAdminPassword = process.env.ADMIN_PASSWORD || "admin123456";
      if (parsed.data.password !== requiredAdminPassword) {
        return {
          success: false,
          error: "รหัสผ่านสำหรับ Admin ไม่ถูกต้อง กรุณากรอกรหัสผ่านที่ถูกต้อง (ตั้งค่ารหัสได้ที่ ADMIN_PASSWORD ในไฟล์ .env.local)",
        };
      }
    }

    const mockUser = {
      id: isAdminUser ? "00000000-0000-0000-0000-000000000001" : `user-${parsed.data.email.replace(/[^a-zA-Z0-9]/g, "-")}`,
      email: parsed.data.email,
      display_name: isAdminUser ? "Administrator (Dev)" : parsed.data.email.split("@")[0],
      role: isAdminUser ? "admin" : "user",
      created_at: new Date().toISOString(),
    };
    cookieStore.set("vocabflow_session", JSON.stringify(mockUser), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return {
      success: true,
      message: isAdminUser ? "เข้าสู่ระบบในฐานะ Admin สำเร็จ" : "เข้าสู่ระบบสำเร็จ (Local Dev Mode)",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ",
          requiresEmailConfirmation: true,
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    return { success: false, error: message };
  }
}

/**
 * Register Server Action
 */
export async function registerAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return { success: false, error: errorMsg };
  }

  // Local Dev Fallback when Supabase keys are not configured
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const mockUser = {
      id: `user-${parsed.data.email.replace(/[^a-zA-Z0-9]/g, "-")}`,
      email: parsed.data.email,
      display_name: parsed.data.displayName || parsed.data.email.split("@")[0],
      role: "user", // CRITICAL: Registrant ALWAYS gets role = 'user'
      created_at: new Date().toISOString(),
    };
    cookieStore.set("vocabflow_session", JSON.stringify(mockUser), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return {
      success: true,
      requiresEmailConfirmation: false,
      message: "สมัครสมาชิกและเข้าสู่ระบบสำเร็จ (Local Dev Mode)",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const headerStore = await headers();
    const origin = headerStore.get("origin") || "";

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          display_name: parsed.data.displayName,
          full_name: parsed.data.displayName,
          // CRITICAL: NEVER pass role here. Role is always enforced as 'user' by Postgres trigger.
        },
        emailRedirectTo: `${origin}/auth/callback?next=/account`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { success: false, error: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ" };
      }
      return { success: false, error: error.message };
    }

    const requiresEmailConfirmation = !data.session;
    return {
      success: true,
      requiresEmailConfirmation,
      message: requiresEmailConfirmation
        ? "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน"
        : "สมัครสมาชิกและเข้าสู่ระบบสำเร็จ",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก";
    return { success: false, error: message };
  }
}

/**
 * Forgot Password Server Action
 * Does not disclose whether email exists in the system for security.
 */
export async function forgotPasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
  };

  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "กรุณากรอกอีเมลที่ถูกต้อง" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const headerStore = await headers();
    const origin = headerStore.get("origin") || "";

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    // Always return success message to prevent user enumeration
    return {
      success: true,
      message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปยังกล่องข้อความของคุณแล้ว",
    };
  } catch {
    // Return friendly generic response even on error
    return {
      success: true,
      message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปยังกล่องข้อความของคุณแล้ว",
    };
  }
}

/**
 * Reset Password Server Action (when user has valid reset session)
 */
export async function resetPasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน";
    return { success: false, error: message };
  }
}

/**
 * Update Profile Server Action
 */
export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    displayName: formData.get("displayName"),
    avatarUrl: formData.get("avatarUrl") || "",
  };

  const parsed = updateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  // Local Dev Fallback when Supabase keys are not configured
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("vocabflow_session");
    if (sessionCookie?.value) {
      const sessionData = parseSessionCookieValue(sessionCookie.value);
      if (sessionData) {
        const updatedUser = {
          id: sessionData.profile.id,
          email: sessionData.profile.email,
          display_name: parsed.data.displayName,
          avatar_url: parsed.data.avatarUrl !== undefined ? parsed.data.avatarUrl : sessionData.profile.avatar_url,
          role: sessionData.profile.role,
          created_at: sessionData.profile.created_at,
          updated_at: new Date().toISOString(),
        };
        cookieStore.set("vocabflow_session", JSON.stringify(updatedUser), {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
        return { success: true, message: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว" };
      }
    }
    return { success: false, error: "กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูล" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูล" };
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        avatar_url: parsed.data.avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileErr) {
      return { success: false, error: profileErr.message };
    }

    return { success: true, message: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return { success: false, error: message };
  }
}

/**
 * Sign Out Server Action
 */
export async function signOutAction(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    }
  } catch {
    // ignore
  }
  const cookieStore = await cookies();
  cookieStore.delete("vocabflow_session");
  redirect("/login");
}
