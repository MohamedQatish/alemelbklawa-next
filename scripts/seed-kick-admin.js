// استيراد sql من مكتبتنا الجديدة
import { sql } from "@/lib/db";

// SHA-256 hash with same salt as auth.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_kick_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  console.log("🚀 بدء عملية تنظيف وإضافة المستخدمين...");
  
  try {
    // 1️⃣ تفريغ جميع الجداول المتعلقة بالمستخدمين (بالتسلسل الصحيح)
    console.log("📥 جاري تفريغ الجداول...");
    
    // استخدام transaction لضمان تنفيذ جميع العمليات بنجاح
    await sql.begin(async () => {
      // أولاً: حذف الجلسات (تعتمد على admin_users)
      await sql`DELETE FROM admin_sessions`;
      console.log("   ✅ تم تفريغ admin_sessions");
      
      // ثانياً: حذف المستخدمين (بعد حذف الجلسات)
      await sql`DELETE FROM admin_users`;
      console.log("   ✅ تم تفريغ admin_users");
    });

    // 2️⃣ إنشاء كلمة المرور المشفرة
    const password = "kick1245";
    const passwordHash = await hashPassword(password);
    console.log(`🔐 تم إنشاء كلمة المرور المشفرة لـ '${password}'`);

    // 3️⃣ إضافة المستخدم الجديد
    console.log("📝 جاري إضافة المستخدم الجديد...");
    
    // ملاحظة: مع postgres، نستخدم ARRAY مباشرة
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
        ${['full_access', 'view_dashboard', 'manage_products', 'manage_events', 'manage_gallery', 'manage_branches', 'manage_orders', 'manage_users', 'edit_content']}, 
        ${true},
        ${new Date()}
      )
      RETURNING id, username, role, display_name
    `;

    console.log("\n✅ تمت العملية بنجاح!");
    console.log("📊 معلومات المستخدم الجديد:");
    console.log(`   • المعرف: ${result[0].id}`);
    console.log(`   • اسم المستخدم: ${result[0].username}`);
    console.log(`   • الصلاحية: ${result[0].role}`);
    console.log(`   • الاسم المعروض: ${result[0].display_name}`);
    console.log(`\n🔑 كلمة المرور: ${password}`);
    
  } catch (error) {
    console.error("❌ حدث خطأ:", error);
  }
}

main().catch(console.error);