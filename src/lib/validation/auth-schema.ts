import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "กรุณากรอกอีเมล" })
    .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: z
    .string()
    .min(1, { message: "กรุณากรอกรหัสผ่าน" })
    .min(6, { message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, { message: "กรุณากรอกชื่อที่ต้องการแสดง" })
      .min(2, { message: "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร" })
      .max(50, { message: "ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร" }),
    email: z
      .string()
      .trim()
      .min(1, { message: "กรุณากรอกอีเมล" })
      .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
    password: z
      .string()
      .min(1, { message: "กรุณากรอกรหัสผ่าน" })
      .min(8, { message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }),
    confirmPassword: z
      .string()
      .min(1, { message: "กรุณายืนยันรหัสผ่าน" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "กรุณากรอกอีเมล" })
    .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: "กรุณากรอกรหัสผ่านใหม่" })
      .min(8, { message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }),
    confirmPassword: z
      .string()
      .min(1, { message: "กรุณายืนยันรหัสผ่านใหม่" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { message: "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร" })
    .max(50, { message: "ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร" }),
  avatarUrl: z.string().url({ message: "รูปแบบ URL รูปโปรไฟล์ไม่ถูกต้อง" }).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
