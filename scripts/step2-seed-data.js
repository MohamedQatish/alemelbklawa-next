import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("=== STEP 2: SEED ALL DATA ===");

  // 1. Admin user "kick" with hashed password
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update("kick1234" + "_kick_salt_2024").digest("hex");
  await sql`INSERT INTO admin_users (username, password_hash, display_name, role, permissions)
    VALUES ('kick', ${hash}, 'مدير النظام', 'super_admin', '["all"]')
    ON CONFLICT (username) DO NOTHING`;
  console.log("Seeded: admin user kick");

  // 2. Categories
  await sql`INSERT INTO product_categories (name, label_ar, icon, sort_order) VALUES
    ('بقلاوة', 'بقلاوة', 'cookie', 1), ('معمول', 'معمول', 'cookie', 2), ('حلويات ليبية', 'حلويات ليبية', 'star', 3),
    ('حلويات شرقية', 'حلويات شرقية', 'cake', 4), ('حلويات غربية', 'حلويات غربية', 'dessert', 5)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: 5 categories");

  // 3. Products - بقلاوة
  await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_available, is_featured, sort_order) VALUES
    ('بقلاوة بالفستق', 'بقلاوة طازجة محشوة بالفستق الحلبي الفاخر', 45, 'بقلاوة', 1, '/placeholder.svg', true, true, 1),
    ('بقلاوة بالكاجو', 'بقلاوة مقرمشة محشوة بالكاجو المحمص', 40, 'بقلاوة', 1, '/placeholder.svg', true, false, 2),
    ('بقلاوة بالجوز', 'بقلاوة تقليدية محشوة بالجوز الطازج', 35, 'بقلاوة', 1, '/placeholder.svg', true, false, 3),
    ('بقلاوة باللوز', 'بقلاوة ذهبية محشوة باللوز المقشر', 38, 'بقلاوة', 1, '/placeholder.svg', true, false, 4),
    ('بقلاوة مشكلة', 'تشكيلة فاخرة من أجود أنواع البقلاوة', 50, 'بقلاوة', 1, '/placeholder.svg', true, true, 5),
    ('أصابع بقلاوة', 'أصابع بقلاوة مقرمشة بالقطر', 30, 'بقلاوة', 1, '/placeholder.svg', true, false, 6),
    ('بقلاوة بالقشطة', 'بقلاوة محشوة بالقشطة الطازجة', 42, 'بقلاوة', 1, '/placeholder.svg', true, false, 7)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: baklava products");

  // 4. Products - معمول
  await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_available, is_featured, sort_order) VALUES
    ('معمول بالتمر', 'معمول طازج محشو بالتمر الفاخر', 30, 'معمول', 2, '/placeholder.svg', true, true, 1),
    ('معمول بالفستق', 'معمول مخبوز محشو بالفستق الحلبي', 40, 'معمول', 2, '/placeholder.svg', true, false, 2),
    ('معمول بالجوز', 'معمول تقليدي محشو بالجوز المطحون', 35, 'معمول', 2, '/placeholder.svg', true, false, 3),
    ('معمول باللوز', 'معمول ناعم محشو باللوز المحمص', 38, 'معمول', 2, '/placeholder.svg', true, false, 4),
    ('معمول مشكل', 'تشكيلة معمول بحشوات متنوعة', 45, 'معمول', 2, '/placeholder.svg', true, true, 5),
    ('معمول بالقشطة', 'معمول طري محشو بالقشطة', 35, 'معمول', 2, '/placeholder.svg', true, false, 6)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: maamoul products");

  // 5. Products - حلويات ليبية
  await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_available, is_featured, sort_order) VALUES
    ('مقروض', 'مقروض ليبي أصيل بالتمر', 25, 'حلويات ليبية', 3, '/placeholder.svg', true, true, 1),
    ('غريبة', 'غريبة ليبية تقليدية بالسمن البلدي', 20, 'حلويات ليبية', 3, '/placeholder.svg', true, false, 2),
    ('خفيفات', 'خفيفات ليبية مقرمشة', 22, 'حلويات ليبية', 3, '/placeholder.svg', true, false, 3),
    ('كعك محشي', 'كعك ليبي محشي بالتمر واللوز', 28, 'حلويات ليبية', 3, '/placeholder.svg', true, false, 4),
    ('بسيسة', 'بسيسة ليبية بالسمسم والعسل', 18, 'حلويات ليبية', 3, '/placeholder.svg', true, false, 5),
    ('رشدة حلوة', 'رشدة حلوة ليبية تقليدية', 15, 'حلويات ليبية', 3, '/placeholder.svg', true, false, 6),
    ('عصيدة', 'عصيدة ليبية بالعسل والسمن', 20, 'حلويات ليبية', 3, '/placeholder.svg', true, false, 7)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: libyan products");

  // 6. Products - حلويات شرقية
  await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_available, is_featured, sort_order) VALUES
    ('كنافة نابلسية', 'كنافة بالجبنة على الطريقة النابلسية', 35, 'حلويات شرقية', 4, '/placeholder.svg', true, true, 1),
    ('بسبوسة', 'بسبوسة بالقطر والمكسرات', 20, 'حلويات شرقية', 4, '/placeholder.svg', true, false, 2),
    ('هريسة', 'هريسة بالسميد والقطر', 18, 'حلويات شرقية', 4, '/placeholder.svg', true, false, 3),
    ('قطايف', 'قطايف محشوة بالقشطة أو المكسرات', 30, 'حلويات شرقية', 4, '/placeholder.svg', true, false, 4),
    ('زنود الست', 'زنود الست المقرمشة بالقشطة', 25, 'حلويات شرقية', 4, '/placeholder.svg', true, false, 5),
    ('لقمة القاضي', 'لقمة القاضي الذهبية بالقطر', 15, 'حلويات شرقية', 4, '/placeholder.svg', true, false, 6),
    ('حلبة', 'حلبة بالمكسرات والقطر', 22, 'حلويات شرقية', 4, '/placeholder.svg', true, false, 7)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: oriental products");

  // 7. Products - حلويات غربية
  await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_available, is_featured, sort_order) VALUES
    ('تيراميسو', 'تيراميسو إيطالي كلاسيكي', 35, 'حلويات غربية', 5, '/placeholder.svg', true, true, 1),
    ('تشيز كيك', 'تشيز كيك كريمي بالفواكه', 30, 'حلويات غربية', 5, '/placeholder.svg', true, false, 2),
    ('كريم كراميل', 'كريم كراميل فرنسي ناعم', 20, 'حلويات غربية', 5, '/placeholder.svg', true, false, 3),
    ('بان كيك', 'بان كيك بالشوكولاتة والفواكه', 25, 'حلويات غربية', 5, '/placeholder.svg', true, false, 4),
    ('براونيز', 'براونيز بالشوكولاتة الداكنة', 22, 'حلويات غربية', 5, '/placeholder.svg', true, false, 5),
    ('إكلير', 'إكلير فرنسي بالشوكولاتة', 18, 'حلويات غربية', 5, '/placeholder.svg', true, false, 6),
    ('كيك ريد فيلفت', 'كيكة ريد فيلفت بالكريمة', 35, 'حلويات غربية', 5, '/placeholder.svg', true, false, 7)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: western products");

  // 8. Events
  await sql`INSERT INTO events (name, description, price, image_url, category, is_available, is_featured) VALUES
    ('علبة حلويات VIP', 'علبة فاخرة تحتوي على تشكيلة مميزة من أجود الحلويات', 120, '/placeholder.svg', 'علب هدايا', true, true),
    ('طقم ضيافة كامل', 'طقم ضيافة متكامل يشمل حلويات ومشروبات', 200, '/placeholder.svg', 'علب هدايا', true, true),
    ('صينية حلويات مشكلة', 'صينية كبيرة من الحلويات المشكلة الفاخرة', 150, '/placeholder.svg', 'صواني', true, true),
    ('علبة معمول فاخرة', 'علبة أنيقة من المعمول بحشوات متنوعة', 85, '/placeholder.svg', 'علب هدايا', true, false),
    ('صينية بقلاوة ملكية', 'صينية بقلاوة فاخرة بالفستق والكاجو', 180, '/placeholder.svg', 'صواني', true, true),
    ('باكج عيد الفطر', 'تشكيلة خاصة بمناسبة عيد الفطر المبارك', 250, '/placeholder.svg', 'مناسبات', true, true),
    ('باكج عيد الأضحى', 'تشكيلة خاصة بمناسبة عيد الأضحى المبارك', 250, '/placeholder.svg', 'مناسبات', true, false),
    ('حلويات أعراس ديلوكس', 'تجهيز حلويات أعراس بتشكيلات فاخرة', 500, '/placeholder.svg', 'أعراس', true, true),
    ('باكج خطوبة', 'تشكيلة حلويات مميزة للخطوبة', 350, '/placeholder.svg', 'أعراس', true, false)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: 9 events");

  // 9. Branches
  await sql`INSERT INTO branches (name, address, phone, secondary_phone, city, working_hours, google_maps_url, latitude, longitude, image_url, is_active, sort_order) VALUES
    ('الفرع الرئيسي - طرابلس', 'شارع الجمهورية، طرابلس', '0925006674', '0915006674', 'طرابلس', 'السبت - الخميس: 8 صباحاً - 11 مساءً | الجمعة: 2 ظهراً - 11 مساءً', 'https://maps.google.com/?q=32.8872,13.1803', 32.8872, 13.1803, '/placeholder.svg', true, 1),
    ('فرع بنغازي', 'شارع جمال عبدالناصر، بنغازي', '0925006675', NULL, 'بنغازي', 'السبت - الخميس: 9 صباحاً - 10 مساءً | الجمعة: 3 عصراً - 10 مساءً', 'https://maps.google.com/?q=32.1194,20.0868', 32.1194, 20.0868, '/placeholder.svg', true, 2),
    ('فرع مصراتة', 'شارع طرابلس، مصراتة', '0925006676', NULL, 'مصراتة', 'السبت - الخميس: 9 صباحاً - 10 مساءً | الجمعة: 3 عصراً - 10 مساءً', 'https://maps.google.com/?q=32.3754,15.0925', 32.3754, 15.0925, '/placeholder.svg', true, 3)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: 3 branches");

  // 10. Delivery pricing
  await sql`INSERT INTO delivery_pricing (city_name, price, is_active, sort_order) VALUES
    ('طرابلس', 10, true, 1), ('بنغازي', 25, true, 2), ('مصراتة', 20, true, 3),
    ('الزاوية', 15, true, 4), ('زليتن', 18, true, 5), ('الخمس', 15, true, 6),
    ('غريان', 20, true, 7)
    ON CONFLICT DO NOTHING`;
  console.log("Seeded: 7 delivery cities");

  // 11. Site settings
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_group, setting_type, label, label_ar, description, sort_order) VALUES
    ('site_name', 'عَالَمُ الْبَكْلَاوَة', 'general', 'text', 'Site Name', 'اسم الموقع', 'The website name', 1),
    ('site_description', 'أجود الحلويات الليبية والشرقية', 'general', 'text', 'Description', 'وصف الموقع', 'Site meta description', 2),
    ('contact_phone', '0925006674', 'contact', 'text', 'Phone', 'رقم الهاتف', 'Main contact phone', 3),
    ('whatsapp_number', '0925006674', 'contact', 'text', 'WhatsApp', 'واتساب', 'WhatsApp number', 4),
    ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'social', 'text', 'Facebook', 'فيسبوك', 'Facebook page URL', 5),
    ('instagram_url', '', 'social', 'text', 'Instagram', 'انستغرام', 'Instagram URL', 6),
    ('hero_title', 'عَالَمُ الْبَكْلَاوَة', 'hero', 'text', 'Hero Title', 'عنوان الهيرو', 'Hero section title', 7),
    ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة', 'hero', 'textarea', 'Hero Desc', 'وصف الهيرو', 'Hero description text', 8),
    ('about_text', 'نقدم لكم أجود أنواع الحلويات الليبية والشرقية المصنوعة بحب وعناية', 'about', 'textarea', 'About', 'من نحن', 'About section text', 9),
    ('footer_text', 'جميع الحقوق محفوظة', 'general', 'text', 'Footer', 'نص التذييل', 'Footer copyright text', 10),
    ('currency', 'د.ل', 'general', 'text', 'Currency', 'العملة', 'Currency symbol', 11),
    ('min_order', '20', 'general', 'text', 'Min Order', 'الحد الأدنى', 'Minimum order amount', 12),
    ('delivery_enabled', 'true', 'general', 'text', 'Delivery', 'التوصيل', 'Enable delivery', 13),
    ('working_hours', 'السبت - الخميس: 8 صباحاً - 11 مساءً', 'general', 'text', 'Hours', 'ساعات العمل', 'Working hours', 14)
    ON CONFLICT (setting_key) DO NOTHING`;
  console.log("Seeded: 14 settings");

  // 12. Site images
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, sort_order, is_active) VALUES
    ('hero_bg', '/images/hero-bg.jpg', 'Hero background', 1, true),
    ('logo', '/placeholder.svg', 'Logo', 2, true),
    ('about_image', '/placeholder.svg', 'About section image', 3, true),
    ('menu_bg', '/placeholder.svg', 'Menu background', 4, true),
    ('footer_bg', '/placeholder.svg', 'Footer background', 5, true)
    ON CONFLICT (image_key) DO NOTHING`;
  console.log("Seeded: 5 site images");

  // Verify counts
  const counts = await sql`
    SELECT 'products' as t, count(*)::int as c FROM products UNION ALL
    SELECT 'events', count(*)::int FROM events UNION ALL
    SELECT 'branches', count(*)::int FROM branches UNION ALL
    SELECT 'delivery_pricing', count(*)::int FROM delivery_pricing UNION ALL
    SELECT 'site_settings', count(*)::int FROM site_settings UNION ALL
    SELECT 'admin_users', count(*)::int FROM admin_users
  `;
  console.log("=== DATA COUNTS ===");
  counts.forEach(r => console.log(`  ${r.t}: ${r.c}`));
  console.log("=== SEEDING COMPLETE ===");
}

seed().catch(e => { console.error("SEED ERROR:", e.message); process.exit(1); });
