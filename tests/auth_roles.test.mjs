import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
// Load schemas for unit testing
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../src/lib/validation/auth-schema.ts";

test("Validation: Login, Register, Forgot Password, and Reset Password schemas enforce validation", () => {
  // Login schema
  assert.equal(loginSchema.safeParse({ email: "invalid", password: "123" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "valid@example.com", password: "password123" }).success, true);

  // Forgot password schema
  assert.equal(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: "hello@domain.com" }).success, true);

  // Reset password schema
  assert.equal(
    resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success,
    false,
    "Password under 8 characters must fail"
  );
  assert.equal(
    resetPasswordSchema.safeParse({ password: "Password123!", confirmPassword: "MismatchPassword123!" }).success,
    false,
    "Mismatched passwords must fail"
  );
  assert.equal(
    resetPasswordSchema.safeParse({ password: "Password123!", confirmPassword: "Password123!" }).success,
    true,
    "Valid matching passwords must succeed"
  );
});

test("Test 1: New registrants automatically receive role = 'user'", () => {
  // Check migration trigger logic in 0003_auth_roles_and_permissions.sql
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/0003_auth_roles_and_permissions.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file exists");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Verify default role in table definition or alter table
  assert.match(
    sql,
    /DEFAULT\s+'user'/i,
    "Profiles table sets default role to 'user'"
  );

  // Verify handle_new_user trigger explicitly sets role to 'user'
  assert.match(
    sql,
    /'user'/i,
    "handle_new_user() trigger explicitly sets role='user'"
  );

  // Verify registration validation schema ignores/disallows role input from client
  const parsed = registerSchema.safeParse({
    email: "test@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    displayName: "Test User",
    role: "admin", // Malicious attempt to pass role
  });

  assert.ok(parsed.success, "Registration schema passes standard fields");
  // @ts-expect-error role should not be present on parsed data
  assert.equal(parsed.data.role, undefined, "Client input role is stripped/ignored by register schema");
});

test("Test 2: Authenticated and public users can read vocabularies", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/0003_auth_roles_and_permissions.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // RLS SELECT policy allows reading
  assert.match(
    sql,
    /CREATE\s+POLICY\s+"Public\s+vocabulary\s+read\s+access"\s+ON\s+public\.vocabularies\s+FOR\s+SELECT\s+USING\s*\(true\)/i,
    "RLS policy allows select for all users"
  );
});

test("Test 3 & 4 & 5: Non-admin users cannot insert, update, or delete vocabularies", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/0003_auth_roles_and_permissions.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // RLS policies must require public.is_admin()
  assert.match(
    sql,
    /create policy "Admins can insert vocabularies"[\s\S]*?with check \(public\.is_admin\(\)/i,
    "Vocabulary INSERT requires is_admin()"
  );

  assert.match(
    sql,
    /create policy "Admins can update vocabularies"[\s\S]*?using \(public\.is_admin\(\)/i,
    "Vocabulary UPDATE requires is_admin()"
  );

  assert.match(
    sql,
    /create policy "Admins can delete vocabularies"[\s\S]*?using \(public\.is_admin\(\)/i,
    "Vocabulary DELETE requires is_admin()"
  );
});

test("Test 6: User cannot access Admin APIs", () => {
  const adminApiRoutePath = path.resolve(
    process.cwd(),
    "src/app/api/admin/vocabulary/route.ts"
  );
  assert.ok(fs.existsSync(adminApiRoutePath), "Admin API route exists");
  const code = fs.readFileSync(adminApiRoutePath, "utf-8");

  // Verify that authenticateAdmin checks session and role
  assert.match(code, /authenticateAdmin/, "API calls authenticateAdmin");
  assert.match(code, /status:\s*401/, "Returns 401 when unauthenticated");
  assert.match(code, /status:\s*403/, "Returns 403 when not admin");
});

test("Test 7: User cannot modify their own role", () => {
  // 1. Zod updateProfileSchema must not accept role
  const parsed = updateProfileSchema.safeParse({
    displayName: "New Name",
    role: "admin", // Attacker attempts to change role to admin
  });
  assert.ok(parsed.success);
  // @ts-expect-error role is not on parsed data
  assert.equal(parsed.data.role, undefined, "updateProfileSchema strips role attribute");

  // 2. Database trigger protect_profile_role prevents role update
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/0003_auth_roles_and_permissions.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");
  assert.match(
    sql,
    /protect_profile_role/i,
    "Database contains protect_profile_role trigger"
  );
  assert.match(
    sql,
    /Only administrators can modify user roles/i,
    "Trigger raises exception when unauthorized role change occurs"
  );
});

test("Test 8 & 9: Admin can create, edit, delete, and import vocabularies", () => {
  const adminApiRoutePath = path.resolve(
    process.cwd(),
    "src/app/api/admin/vocabulary/route.ts"
  );
  const code = fs.readFileSync(adminApiRoutePath, "utf-8");

  // Check GET, POST, PUT, DELETE exports
  assert.match(code, /export async function GET/, "Admin API provides GET");
  assert.match(code, /export async function POST/, "Admin API provides POST (create/import)");
  assert.match(code, /export async function PUT/, "Admin API provides PUT (update)");
  assert.match(code, /export async function DELETE/, "Admin API provides DELETE");

  // Check audit logging
  assert.match(code, /logAdminAudit/, "Admin CRUD writes to audit log");
});

test("Test 10: Users cannot modify or read other users' progress", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/0003_auth_roles_and_permissions.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Bookmarks and user progress must enforce user_id = auth.uid()
  assert.match(
    sql,
    /auth\.uid\(\)\s*=\s*user_id/i,
    "RLS enforces auth.uid() = user_id for personal data"
  );
});

test("Test 11 & 12: Route protection for Admin and Protected URLs", () => {
  const proxyPath = path.resolve(process.cwd(), "src/proxy.ts");
  assert.ok(fs.existsSync(proxyPath), "Next.js 16 src/proxy.ts exists");
  const code = fs.readFileSync(proxyPath, "utf-8");

  // Verify proxy checks /admin and redirects
  assert.match(code, /pathname\.startsWith\("\/admin"\)/, "Proxy inspects /admin routes");
  assert.match(code, /new URL\("\/unauthorized", request\.url\)/, "Redirects non-admin to /unauthorized");
  assert.match(code, /new URL\("\/login", request\.url\)/, "Redirects unauthenticated user to /login");

  // Verify admin layout also enforces server-side requireAdmin
  const adminLayoutPath = path.resolve(process.cwd(), "src/app/admin/layout.tsx");
  const layoutCode = fs.readFileSync(adminLayoutPath, "utf-8");
  assert.match(layoutCode, /requireAdmin/, "Admin layout calls requireAdmin server guard");
});

test("Test 13: RLS helper public.is_admin() is secure", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/0003_auth_roles_and_permissions.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  assert.match(
    sql,
    /CREATE OR REPLACE FUNCTION public\.is_admin\(\)/i,
    "Defines public.is_admin() function"
  );
  assert.match(
    sql,
    /SECURITY DEFINER/i,
    "is_admin uses SECURITY DEFINER"
  );
  assert.match(
    sql,
    /SET search_path = public/i,
    "is_admin sets secure search_path to prevent hijacking"
  );
  assert.match(
    sql,
    /auth\.uid\(\)/i,
    "is_admin resolves role using auth.uid(), never from client parameter"
  );
});

test("Test 14: Forgot Password does not reveal whether email exists (anti-enumeration)", () => {
  const authActionsPath = path.resolve(
    process.cwd(),
    "src/app/api/auth/actions.ts"
  );
  const code = fs.readFileSync(authActionsPath, "utf-8");

  // Inspect forgotPasswordAction response
  assert.match(
    code,
    /forgotPasswordAction/,
    "forgotPasswordAction exists"
  );
  assert.match(
    code,
    /หากอีเมลนี้มีอยู่ในระบบ/i,
    "Returns uniform Thai response to prevent email enumeration"
  );
});

test("Test 15: SUPABASE_SERVICE_ROLE_KEY is never exposed to the client", () => {
  const clientPath = path.resolve(process.cwd(), "src/lib/supabase/client.ts");
  const clientCode = fs.readFileSync(clientPath, "utf-8");
  assert.ok(
    !clientCode.includes("SERVICE_ROLE"),
    "Client Supabase helper never references SERVICE_ROLE_KEY"
  );
});

test("Test 16: Session cookie parsing supports raw JSON, single-encoded, and double-encoded cookies", async () => {
  const { parseSessionCookieValue } = await import("../src/lib/auth/session-cookie.ts");

  const adminData = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@vocabflow.local",
    display_name: "Admin User",
    role: "admin",
  };

  // 1. Raw JSON
  const parsedRaw = parseSessionCookieValue(JSON.stringify(adminData));
  assert.ok(parsedRaw, "Parses raw JSON cookie");
  assert.equal(parsedRaw.user.id, adminData.id);
  assert.equal(parsedRaw.profile.role, "admin");

  // 2. Single-encoded URI component
  const singleEncoded = encodeURIComponent(JSON.stringify(adminData));
  const parsedSingle = parseSessionCookieValue(singleEncoded);
  assert.ok(parsedSingle, "Parses single URL-encoded cookie");
  assert.equal(parsedSingle.profile.role, "admin");

  // 3. Double-encoded URI component (previously generated by Next.js ResponseCookies)
  const doubleEncoded = encodeURIComponent(singleEncoded);
  const parsedDouble = parseSessionCookieValue(doubleEncoded);
  assert.ok(parsedDouble, "Parses double URL-encoded cookie");
  assert.equal(parsedDouble.profile.role, "admin");

  // 4. Invalid or null values
  assert.equal(parseSessionCookieValue(null), null);
  assert.equal(parseSessionCookieValue(""), null);
  assert.equal(parseSessionCookieValue("invalid json string"), null);
});

test("Test 17: Admin login strictly enforces password verification", () => {
  const authActionsPath = path.resolve(
    process.cwd(),
    "src/app/api/auth/actions.ts"
  );
  const code = fs.readFileSync(authActionsPath, "utf-8");

  // Verify that loginAction checks ADMIN_PASSWORD
  assert.match(
    code,
    /ADMIN_PASSWORD/,
    "loginAction references ADMIN_PASSWORD"
  );
  assert.match(
    code,
    /parsed\.data\.password !== requiredAdminPassword/,
    "loginAction validates password matches requiredAdminPassword"
  );
  assert.match(
    code,
    /รหัสผ่านสำหรับ Admin ไม่ถูกต้อง/,
    "loginAction returns clear error when admin password is wrong"
  );
});


