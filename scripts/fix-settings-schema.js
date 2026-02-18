import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  // Add missing columns to site_settings
  try {
    await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS setting_type VARCHAR(30) DEFAULT 'text'`;
    console.log("[v0] Added setting_type column");
  } catch (e) { console.log("[v0] setting_type already exists or error:", e.message); }

  try {
    await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS label VARCHAR(200) DEFAULT ''`;
    console.log("[v0] Added label column");
  } catch (e) { console.log("[v0] label already exists or error:", e.message); }

  try {
    await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS label_ar VARCHAR(200) DEFAULT ''`;
    console.log("[v0] Added label_ar column");
  } catch (e) { console.log("[v0] label_ar already exists or error:", e.message); }

  try {
    await sql`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
    console.log("[v0] Added sort_order column");
  } catch (e) { console.log("[v0] sort_order already exists or error:", e.message); }

  // Add missing columns to site_images
  try {
    await sql`ALTER TABLE site_images ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`;
    console.log("[v0] Added sort_order to site_images");
  } catch (e) { console.log("[v0] sort_order already exists on site_images:", e.message); }

  try {
    await sql`ALTER TABLE site_images ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
    console.log("[v0] Added is_active to site_images");
  } catch (e) { console.log("[v0] is_active already exists on site_images:", e.message); }

  // Now update site_settings with proper labels and types
  const updates = [
    { key: 'site_name', label_ar: 'اسم الموقع', type: 'text', group: 'general', order: 1 },
    { key: 'site_description', label_ar: 'وصف الموقع', type: 'textarea', group: 'general', order: 2 },
    { key: 'currency', label_ar: 'العملة', type: 'text', group: 'general', order: 3 },
    { key: 'currency_symbol', label_ar: 'رمز العملة', type: 'text', group: 'general', order: 4 },
    { key: 'hero_title', label_ar: 'عنوان الصفحة الرئيسية', type: 'text', group: 'hero', order: 1 },
    { key: 'hero_description', label_ar: 'وصف الصفحة الرئيسية', type: 'textarea', group: 'hero', order: 2 },
    { key: 'hero_cta_text', label_ar: 'نص زر الصفحة الرئيسية', type: 'text', group: 'hero', order: 3 },
    { key: 'contact_phone', label_ar: 'رقم الهاتف', type: 'text', group: 'contact', order: 1 },
    { key: 'whatsapp_number', label_ar: 'رقم الواتساب', type: 'text', group: 'contact', order: 2 },
    { key: 'contact_email', label_ar: 'البريد الإلكتروني', type: 'text', group: 'contact', order: 3 },
    { key: 'facebook_url', label_ar: 'رابط فيسبوك', type: 'text', group: 'social', order: 1 },
    { key: 'instagram_url', label_ar: 'رابط انستقرام', type: 'text', group: 'social', order: 2 },
    { key: 'about_text', label_ar: 'نص من نحن', type: 'textarea', group: 'about', order: 1 },
    { key: 'footer_text', label_ar: 'نص الفوتر', type: 'text', group: 'general', order: 5 },
  ];

  for (const u of updates) {
    await sql`
      UPDATE site_settings 
      SET label_ar = ${u.label_ar}, 
          setting_type = ${u.type}, 
          setting_group = ${u.group}, 
          sort_order = ${u.order}
      WHERE setting_key = ${u.key}
    `;
  }
  console.log("[v0] Updated all settings with labels and types");

  // Verify
  const settings = await sql`SELECT setting_key, setting_value, setting_type, setting_group, label_ar, sort_order FROM site_settings ORDER BY setting_group, sort_order`;
  console.log("[v0] Final settings:", JSON.stringify(settings, null, 2));
  
  const images = await sql`SELECT image_key, image_url, alt_text, is_active FROM site_images ORDER BY sort_order`;
  console.log("[v0] Final images:", JSON.stringify(images, null, 2));
}

run().catch(e => console.error("[v0] Error:", e));
