import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  // First check what tables exist
  const existing = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("[v0] Existing tables:", existing.map(r => r.table_name));

  // Create product_categories
  try {
    await sql`CREATE TABLE IF NOT EXISTS product_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      slug TEXT UNIQUE,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created product_categories");
  } catch(e) { console.log("[v0] product_categories:", e.message); }

  // Create products
  try {
    await sql`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      category TEXT,
      category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
      image_url TEXT DEFAULT '/placeholder.svg',
      is_featured BOOLEAN DEFAULT false,
      is_available BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created products");
  } catch(e) { console.log("[v0] products:", e.message); }

  // Create product_option_groups
  try {
    await sql`CREATE TABLE IF NOT EXISTS product_option_groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      is_required BOOLEAN DEFAULT false,
      allow_multiple BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created product_option_groups");
  } catch(e) { console.log("[v0] product_option_groups:", e.message); }

  // Create product_options
  try {
    await sql`CREATE TABLE IF NOT EXISTS product_options (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      name_ar TEXT,
      price_modifier NUMERIC(10,2) DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created product_options");
  } catch(e) { console.log("[v0] product_options:", e.message); }

  // Create product_option_assignments
  try {
    await sql`CREATE TABLE IF NOT EXISTS product_option_assignments (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
      UNIQUE(product_id, option_group_id)
    )`;
    console.log("[v0] Created product_option_assignments");
  } catch(e) { console.log("[v0] product_option_assignments:", e.message); }

  // Create orders
  try {
    await sql`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT,
      city TEXT,
      delivery_fee NUMERIC(10,2) DEFAULT 0,
      subtotal NUMERIC(10,2) DEFAULT 0,
      total NUMERIC(10,2) DEFAULT 0,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created orders");
  } catch(e) { console.log("[v0] orders:", e.message); }

  // Create order_items
  try {
    await sql`CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price NUMERIC(10,2) NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      options JSONB DEFAULT '[]',
      notes TEXT
    )`;
    console.log("[v0] Created order_items");
  } catch(e) { console.log("[v0] order_items:", e.message); }

  // Create reservations
  try {
    await sql`CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      event_date DATE NOT NULL,
      guest_count INTEGER DEFAULT 10,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created reservations");
  } catch(e) { console.log("[v0] reservations:", e.message); }

  // Create delivery_pricing
  try {
    await sql`CREATE TABLE IF NOT EXISTS delivery_pricing (
      id SERIAL PRIMARY KEY,
      city TEXT NOT NULL UNIQUE,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created delivery_pricing");
  } catch(e) { console.log("[v0] delivery_pricing:", e.message); }

  // Create site_settings
  try {
    await sql`CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT DEFAULT '',
      setting_group TEXT DEFAULT 'general',
      setting_type TEXT DEFAULT 'text',
      label TEXT DEFAULT '',
      label_ar TEXT DEFAULT '',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created site_settings");
  } catch(e) { console.log("[v0] site_settings:", e.message); }

  // Create site_images
  try {
    await sql`CREATE TABLE IF NOT EXISTS site_images (
      id SERIAL PRIMARY KEY,
      image_key TEXT NOT NULL UNIQUE,
      image_url TEXT DEFAULT '/placeholder.svg',
      alt_text TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created site_images");
  } catch(e) { console.log("[v0] site_images:", e.message); }

  // Also ensure admin_sessions exists
  try {
    await sql`CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )`;
    console.log("[v0] Created admin_sessions");
  } catch(e) { console.log("[v0] admin_sessions:", e.message); }

  // ==================== SEED DATA ====================
  console.log("[v0] Seeding data...");

  // Seed categories
  try {
    await sql`INSERT INTO product_categories (name, name_ar, slug, sort_order) VALUES
      ('بقلاوة', 'بقلاوة', 'baklava', 1),
      ('معمول', 'معمول', 'maamoul', 2),
      ('حلويات ليبية', 'حلويات ليبية', 'libyan', 3),
      ('حلويات شرقية', 'حلويات شرقية', 'oriental', 4),
      ('مشروبات', 'مشروبات', 'drinks', 5)
    ON CONFLICT (slug) DO NOTHING`;
    console.log("[v0] Seeded categories");
  } catch(e) { console.log("[v0] Seed categories:", e.message); }

  // Get category IDs
  const cats = await sql`SELECT id, slug FROM product_categories ORDER BY sort_order`;
  const catMap = {};
  cats.forEach(c => { catMap[c.slug] = c.id; });
  console.log("[v0] Category map:", catMap);

  // Seed products
  try {
    const count = await sql`SELECT count(*) as cnt FROM products`;
    if (parseInt(count[0].cnt) === 0) {
      await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_featured, sort_order) VALUES
        ('بقلاوة بالفستق', 'بقلاوة فاخرة محشوة بالفستق الحلبي الطازج', 45, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', true, 1),
        ('بقلاوة بالكاجو', 'بقلاوة مقرمشة بحشوة الكاجو الفاخر', 40, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', true, 2),
        ('بقلاوة بالجوز', 'بقلاوة تقليدية بالجوز المحمص', 35, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', false, 3),
        ('بقلاوة باللوز', 'بقلاوة كلاسيكية باللوز المقشر', 38, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', false, 4),
        ('بقلاوة مشكلة', 'تشكيلة فاخرة من أجود أنواع البقلاوة', 42, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', true, 5),
        ('بقلاوة بالقشطة', 'بقلاوة طرية محشوة بالقشطة الطازجة', 40, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', false, 6),
        ('أصابع بقلاوة', 'أصابع بقلاوة مقرمشة بالفستق', 35, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', false, 7),
        ('بقلاوة ملكية', 'بقلاوة فاخرة بمزيج المكسرات الملكي', 50, 'بقلاوة', ${catMap['baklava']}, '/placeholder.svg', true, 8),
        ('معمول بالتمر', 'معمول طازج محشو بأجود أنواع التمر', 30, 'معمول', ${catMap['maamoul']}, '/placeholder.svg', true, 1),
        ('معمول بالجوز', 'معمول هش بحشوة الجوز المحمص', 35, 'معمول', ${catMap['maamoul']}, '/placeholder.svg', false, 2),
        ('معمول بالفستق', 'معمول فاخر بالفستق الحلبي', 40, 'معمول', ${catMap['maamoul']}, '/placeholder.svg', true, 3),
        ('معمول باللوز', 'معمول كلاسيكي باللوز المطحون', 35, 'معمول', ${catMap['maamoul']}, '/placeholder.svg', false, 4),
        ('معمول مشكل', 'تشكيلة معمول بحشوات متنوعة', 38, 'معمول', ${catMap['maamoul']}, '/placeholder.svg', false, 5),
        ('مقروض', 'مقروض ليبي تقليدي بالتمر', 25, 'حلويات ليبية', ${catMap['libyan']}, '/placeholder.svg', true, 1),
        ('غريبة', 'غريبة ليبية تقليدية بالسمن البلدي', 20, 'حلويات ليبية', ${catMap['libyan']}, '/placeholder.svg', false, 2),
        ('مبسس', 'مبسس ليبي بالتمر والسميد', 22, 'حلويات ليبية', ${catMap['libyan']}, '/placeholder.svg', false, 3),
        ('خبز الحليب', 'خبز حليب ليبي طازج', 15, 'حلويات ليبية', ${catMap['libyan']}, '/placeholder.svg', false, 4),
        ('رشدة حلوة', 'رشدة حلوة ليبية تقليدية', 28, 'حلويات ليبية', ${catMap['libyan']}, '/placeholder.svg', false, 5),
        ('عصيدة', 'عصيدة ليبية بالدبس والسمن', 18, 'حلويات ليبية', ${catMap['libyan']}, '/placeholder.svg', true, 6),
        ('كنافة نابلسية', 'كنافة بالجبنة على الطريقة النابلسية', 35, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', true, 1),
        ('كنافة بالقشطة', 'كنافة ناعمة بالقشطة الطازجة', 32, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', false, 2),
        ('هريسة', 'هريسة حلوة بالسميد واللوز', 20, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', false, 3),
        ('بسبوسة', 'بسبوسة بالسميد والقطر', 18, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', false, 4),
        ('زلابية', 'زلابية مقرمشة بالقطر', 15, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', true, 5),
        ('قطايف', 'قطايف بالقشطة أو المكسرات', 25, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', false, 6),
        ('لقمة القاضي', 'لقمة القاضي المقرمشة بالقطر', 12, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', false, 7),
        ('عوامة', 'عوامة ذهبية مقرمشة', 10, 'حلويات شرقية', ${catMap['oriental']}, '/placeholder.svg', false, 8),
        ('شاي أخضر', 'شاي أخضر ليبي بالنعناع', 5, 'مشروبات', ${catMap['drinks']}, '/placeholder.svg', false, 1),
        ('قهوة عربية', 'قهوة عربية بالهيل', 8, 'مشروبات', ${catMap['drinks']}, '/placeholder.svg', true, 2),
        ('شاي أحمر', 'شاي أحمر بالنعناع', 5, 'مشروبات', ${catMap['drinks']}, '/placeholder.svg', false, 3),
        ('سحلب', 'سحلب ساخن بالمكسرات', 10, 'مشروبات', ${catMap['drinks']}, '/placeholder.svg', false, 4),
        ('عصير برتقال طازج', 'عصير برتقال طبيعي 100%', 8, 'مشروبات', ${catMap['drinks']}, '/placeholder.svg', false, 5)`;
      console.log("[v0] Seeded products");
    } else {
      console.log("[v0] Products already seeded:", count[0].cnt);
    }
  } catch(e) { console.log("[v0] Seed products error:", e.message); }

  // Seed delivery pricing
  try {
    await sql`INSERT INTO delivery_pricing (city, price) VALUES
      ('طرابلس - وسط المدينة', 5),
      ('طرابلس - تاجوراء', 10),
      ('طرابلس - جنزور', 10),
      ('طرابلس - عين زارة', 8),
      ('طرابلس - أبو سليم', 7),
      ('طرابلس - السراج', 8),
      ('طرابلس - سوق الجمعة', 6)
    ON CONFLICT (city) DO NOTHING`;
    console.log("[v0] Seeded delivery pricing");
  } catch(e) { console.log("[v0] Seed delivery:", e.message); }

  // Seed site settings
  try {
    await sql`INSERT INTO site_settings (setting_key, setting_value, setting_group, setting_type, label, label_ar, sort_order) VALUES
      ('site_name', 'عَالَمُ الْبَكْلَاوَة', 'general', 'text', 'Site Name', 'اسم الموقع', 1),
      ('site_description', 'أجود الحلويات الليبية والشرقية', 'general', 'textarea', 'Site Description', 'وصف الموقع', 2),
      ('currency', 'د.ل', 'general', 'text', 'Currency', 'العملة', 3),
      ('working_hours', '8:00 ص - 11:00 م', 'general', 'text', 'Working Hours', 'ساعات العمل', 4),
      ('footer_text', 'جميع الحقوق محفوظة', 'general', 'text', 'Footer Text', 'نص الفوتر', 5),
      ('delivery_enabled', 'true', 'general', 'text', 'Delivery Enabled', 'التوصيل مفعل', 6),
      ('hero_title', 'عَالَمُ الْبَكْلَاوَة', 'hero', 'text', 'Hero Title', 'عنوان الصفحة الرئيسية', 1),
      ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة تنقلك إلى عالمٍ من الأصالة والتميّز', 'hero', 'textarea', 'Hero Description', 'وصف الصفحة الرئيسية', 2),
      ('contact_phone', '0925006674', 'contact', 'text', 'Phone', 'رقم الهاتف', 1),
      ('whatsapp_number', '0925006674', 'contact', 'text', 'WhatsApp', 'رقم الواتساب', 2),
      ('contact_email', 'info@baklava-world.ly', 'contact', 'text', 'Email', 'البريد الإلكتروني', 3),
      ('about_text', 'نقدم أجود أنواع الحلويات الليبية والشرقية بمكونات طبيعية وخبرة أجيال', 'about', 'textarea', 'About Text', 'نص من نحن', 1),
      ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'social', 'text', 'Facebook URL', 'رابط فيسبوك', 1),
      ('instagram_url', '', 'social', 'text', 'Instagram URL', 'رابط انستقرام', 2)
    ON CONFLICT (setting_key) DO NOTHING`;
    console.log("[v0] Seeded settings");
  } catch(e) { console.log("[v0] Seed settings:", e.message); }

  // Seed site images
  try {
    await sql`INSERT INTO site_images (image_key, image_url, alt_text, sort_order) VALUES
      ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', 1),
      ('logo', '/placeholder.svg', 'شعار الموقع', 2),
      ('about_image', '/placeholder.svg', 'صورة قسم من نحن', 3),
      ('menu_bg', '/placeholder.svg', 'خلفية قسم القائمة', 4),
      ('contact_bg', '/placeholder.svg', 'خلفية قسم التواصل', 5)
    ON CONFLICT (image_key) DO NOTHING`;
    console.log("[v0] Seeded images");
  } catch(e) { console.log("[v0] Seed images:", e.message); }

  // Verify final state
  const finalTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("[v0] Final tables:", finalTables.map(r => r.table_name));

  const prodCount = await sql`SELECT count(*) as cnt FROM products`;
  const catCount = await sql`SELECT count(*) as cnt FROM product_categories`;
  const delCount = await sql`SELECT count(*) as cnt FROM delivery_pricing`;
  const setCount = await sql`SELECT count(*) as cnt FROM site_settings`;
  console.log("[v0] Data counts - products:", prodCount[0].cnt, "categories:", catCount[0].cnt, "delivery:", delCount[0].cnt, "settings:", setCount[0].cnt);
}

run().then(() => console.log("[v0] DONE")).catch(e => console.error("[v0] FATAL:", e));
