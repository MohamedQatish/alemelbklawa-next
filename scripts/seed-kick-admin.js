import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// SHA-256 hash with same salt as auth.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_kick_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  const passwordHash = await hashPassword("kick1245");
  console.log("Password hash generated for 'kick1245'");

  // Delete any old admin user that was seeded before
  await sql`DELETE FROM admin_sessions WHERE admin_user_id IN (SELECT id FROM admin_users WHERE username = 'admin')`;
  await sql`DELETE FROM admin_users WHERE username = 'admin'`;
  console.log("Cleaned up old 'admin' user if it existed");

  // Upsert the 'kick' super admin user
  const result = await sql`
    INSERT INTO admin_users (username, password_hash, display_name, role, permissions, is_active)
    VALUES ('kick', ${passwordHash}, 'مدير النظام', 'super_admin', '{full_access,view_dashboard,manage_products,manage_events,manage_gallery,manage_branches,manage_orders,manage_users,edit_content}', true)
    ON CONFLICT (username) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      is_active = EXCLUDED.is_active
    RETURNING id, username, role
  `;

  console.log("Super admin user created/updated:", result[0]);
}

main().catch(console.error);
