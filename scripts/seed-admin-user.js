import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

// Hash password with SHA-256 (same as the auth system uses)
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  const username = "admin";
  const password = "admin123";
  const hash = hashPassword(password);

  // Check if admin already exists
  const existing = await sql`SELECT id FROM admin_users WHERE username = ${username}`;
  if (existing.length > 0) {
    console.log("Admin user already exists, updating password...");
    await sql`UPDATE admin_users SET password_hash = ${hash} WHERE username = ${username}`;
  } else {
    await sql`
      INSERT INTO admin_users (username, password_hash, display_name, role, permissions, is_active)
      VALUES (${username}, ${hash}, 'المدير العام', 'super_admin', ARRAY['all'], true)
    `;
  }
  console.log("Admin user seeded successfully! Username: admin, Password: admin123");
}

main().catch(console.error);
