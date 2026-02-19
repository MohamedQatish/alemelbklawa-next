import postgres from 'postgres';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// إعداد المسار لملف .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// اتصال بقاعدة البيانات
const sql = postgres(process.env.DATABASE_URL, {
  ssl: false,
  max: 5,
  idle_timeout: 15,
  connect_timeout: 10,
  prepare: false
});

async function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  hash.update(password + "_kick_salt_2024");
  return hash.digest('hex');
}

async function main() {
  console.log("🚀 بدء عملية تنظيف وإضافة المستخدمين...");
  
  try {
    // تفريغ الجداول في transaction
    await sql.begin(async () => {
      await sql`DELETE FROM admin_sessions`;
      console.log("✅ تم تفريغ admin_sessions");
      
      await sql`DELETE FROM admin_users`;
      console.log("✅ تم تفريغ admin_users");
    });

    // إضافة المستخدم الجديد
    const password = "kick1245";
    const passwordHash = await hashPassword(password);
    
    const permissions = [
      'full_access', 
      'view_dashboard', 
      'manage_products', 
      'manage_events', 
      'manage_gallery', 
      'manage_branches', 
      'manage_orders', 
      'manage_users', 
      'edit_content'
    ];

    const result = await sql`
      INSERT INTO admin_users (
        username, 
        password_hash, 
        display_name, 
        role, 
        permissions, 
        is_active,
        created_at
      ) VALUES (
        ${'kick'}, 
        ${passwordHash}, 
        ${'مدير النظام'}, 
        ${'super_admin'}, 
        ${permissions}, 
        ${true},
        NOW()
      )
      RETURNING id, username, role, display_name
    `;

    console.log("\n✅ تمت العملية بنجاح!");
    console.log("👤 المستخدم الجديد:", result[0]);
    console.log("🔑 كلمة المرور:", password);
    
  } catch (error) {
    console.error("❌ خطأ:", error);
  } finally {
    await sql.end();
  }
}

main();