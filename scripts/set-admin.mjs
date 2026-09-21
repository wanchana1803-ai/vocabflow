#!/usr/bin/env node
/**
 * scripts/set-admin.mjs
 * Secure script to elevate an existing user to Admin via Supabase service role key.
 * 
 * Usage:
 *   node scripts/set-admin.mjs user@example.com
 *   node scripts/set-admin.mjs --user-id 12345678-1234-1234-1234-123456789abc
 */

import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  console.error("Please ensure SUPABASE_SERVICE_ROLE_KEY is set in your server environment before running this script.");
  process.exit(1);
}

const targetArg = process.argv[2];
if (!targetArg || targetArg === "--help" || targetArg === "-h") {
  console.log("Usage: node scripts/set-admin.mjs <user_email_or_user_id>");
  process.exit(0);
}

const isUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetArg);
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("🔍 Looking up target user...");

  let targetUserId = null;
  let targetEmail = null;

  if (isUserId) {
    targetUserId = targetArg;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, role, display_name")
      .eq("id", targetUserId)
      .maybeSingle();

    if (error || !profile) {
      console.error(`❌ Profile not found for User ID: ${targetUserId}`);
      process.exit(1);
    }
    targetEmail = profile.email;
  } else {
    targetEmail = targetArg.toLowerCase().trim();
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("❌ Failed to query users from auth.admin:", error.message);
      process.exit(1);
    }

    const matchedUsers = users.users.filter(
      (u) => u.email && u.email.toLowerCase() === targetEmail
    );

    if (matchedUsers.length === 0) {
      console.error(`❌ No user found matching email: ${targetEmail}`);
      process.exit(1);
    }
    if (matchedUsers.length > 1) {
      console.error(`❌ Multiple users matched email ${targetEmail}. Please specify User ID.`);
      process.exit(1);
    }

    targetUserId = matchedUsers[0].id;
  }

  // Fetch current role
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, role, display_name")
    .eq("id", targetUserId)
    .single();

  if (profileErr || !profile) {
    console.error("❌ Failed to fetch user profile:", profileErr?.message);
    process.exit(1);
  }

  if (profile.role === "admin") {
    console.log(`ℹ️ User ${targetEmail} (${targetUserId}) is ALREADY an Admin.`);
    process.exit(0);
  }

  console.log("\n⚠️  WARNING: You are about to grant FULL ADMINISTRATOR PRIVILEGES to:");
  console.log(`   User ID:      ${targetUserId}`);
  console.log(`   Email:        ${targetEmail}`);
  console.log(`   Display Name: ${profile.display_name || "N/A"}`);
  console.log(`   Current Role: ${profile.role}`);
  console.log(`   New Role:     admin\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Are you sure you want to proceed? Type 'CONFIRM': ", async (answer) => {
    rl.close();

    if (answer.trim() !== "CONFIRM") {
      console.log("❌ Operation aborted by user.");
      process.exit(0);
    }

    // Update role
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ role: "admin", updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (updateErr) {
      console.error("❌ Failed to update user role:", updateErr.message);
      process.exit(1);
    }

    // Insert audit log
    await supabase.from("admin_audit_logs").insert({
      admin_user_id: targetUserId,
      action: "role_changed",
      entity_type: "profile",
      entity_id: targetUserId,
      before_data: { email: targetEmail, previous_role: profile.role },
      after_data: { email: targetEmail, new_role: "admin", promoted_via: "set-admin.mjs" },
    });

    console.log(`✅ SUCCESS: User ${targetEmail} has been promoted to Admin!`);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
