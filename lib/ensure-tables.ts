import { sql } from "./neon"

let _migrationDone = false
let _migrationPromise: Promise<void> | null = null

/**
 * Ensures all required tables exist.
 * NON-DESTRUCTIVE: only creates tables that are missing, never drops existing data.
 * Safe to call multiple times - only runs once per server lifecycle.
 */
export async function ensureTables() {
  if (_migrationDone) return
  if (_migrationPromise) return _migrationPromise

  _migrationPromise = _doMigration()
  await _migrationPromise
  _migrationDone = true
}

async function _doMigration() {
  try {
    // Quick check: if product_categories exists and has rows, schema is ready
    const check = await sql`
      SELECT count(*) as c FROM information_schema.tables
      WHERE table_schema='public' AND table_name='product_categories'
    `
    if (Number(check[0]?.c) > 0) {
      try {
        const catRows = await sql`SELECT count(*) as c FROM product_categories`
        if (Number(catRows[0]?.c) > 0) {
          _migrationDone = true
          return
        }
      } catch { /* table exists but query failed - continue to create */ }
    }

    console.log("[v0] Creating missing tables (non-destructive)...")

    // 1. users
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE,
      phone VARCHAR(50), city VARCHAR(100), address TEXT,
      password_hash TEXT, is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 2. user_sessions
    await sql`CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 3. admin_users
    await sql`CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, display_name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin', permissions JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true, last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 4. admin_sessions
    await sql`CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY, session_token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 5. product_categories
    await sql`CREATE TABLE IF NOT EXISTS product_categories (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
      label_ar VARCHAR(255), icon VARCHAR(100),
      sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW()
    )`

    // 6. products
    await sql`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
      description TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0,
      category VARCHAR(255), category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
      image_url TEXT, is_available BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 7. product_option_groups
    await sql`CREATE TABLE IF NOT EXISTS product_option_groups (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
      label_ar VARCHAR(255), is_required BOOLEAN DEFAULT false,
      allow_multiple BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 8. product_options
    await sql`CREATE TABLE IF NOT EXISTS product_options (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL, label_ar VARCHAR(255),
      price DECIMAL(10,2) DEFAULT 0,
      price_modifier DECIMAL(10,2) DEFAULT 0, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 9. product_option_assignments
    await sql`CREATE TABLE IF NOT EXISTS product_option_assignments (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
      UNIQUE(product_id, option_group_id)
    )`

    // 10. events
    await sql`CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
      description TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0,
      category VARCHAR(255), image_url TEXT,
      is_available BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 11. branches
    await sql`CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
      address TEXT, phone VARCHAR(50), secondary_phone VARCHAR(50),
      city VARCHAR(100), google_maps_url TEXT,
      latitude DECIMAL(10,7), longitude DECIMAL(10,7),
      working_hours TEXT, image_url TEXT,
      is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 12. delivery_pricing
    await sql`CREATE TABLE IF NOT EXISTS delivery_pricing (
      id SERIAL PRIMARY KEY, city_name VARCHAR(255) NOT NULL,
      city VARCHAR(255), price DECIMAL(10,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 13. orders
    await sql`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(255), phone VARCHAR(50),
      city VARCHAR(100), address TEXT, notes TEXT,
      total_amount DECIMAL(10,2) DEFAULT 0,
      delivery_fee DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      order_type VARCHAR(50) DEFAULT 'delivery',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 14. order_items
    await sql`CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER, product_name VARCHAR(255),
      category VARCHAR(255), quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2) DEFAULT 0,
      addons JSONB, notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 15. reservations
    await sql`CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(255), phone VARCHAR(50),
      event_type VARCHAR(100), date DATE, time VARCHAR(50),
      guests INTEGER, notes TEXT, status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )`

    // 16. site_settings
    await sql`CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY, setting_key VARCHAR(255) UNIQUE NOT NULL,
      setting_value TEXT DEFAULT '', setting_type VARCHAR(50) DEFAULT 'text',
      setting_group VARCHAR(100) DEFAULT 'general',
      label VARCHAR(255) DEFAULT '', label_ar VARCHAR(255) DEFAULT '',
      description TEXT, sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    )`

    // 17. site_images
    await sql`CREATE TABLE IF NOT EXISTS site_images (
      id SERIAL PRIMARY KEY, image_key VARCHAR(255) UNIQUE NOT NULL,
      image_url TEXT DEFAULT '', alt_text VARCHAR(255) DEFAULT '',
      is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`

    console.log("[v0] All 17 tables ensured. Seeding missing data...")

    // --- SEED only if tables are empty (never overwrite existing data) ---

    // Admin user
    const adminCount = await sql`SELECT count(*) as c FROM admin_users`
    if (Number(adminCount[0]?.c) === 0) {
      const encoder = new TextEncoder()
      const data = encoder.encode("kick1234" + "_kick_salt_2024")
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
      await sql`INSERT INTO admin_users (username, password_hash, display_name, role, permissions)
        VALUES ('kick', ${passHash}, 'مدير النظام', 'super_admin', '["all"]')
        ON CONFLICT (username) DO NOTHING`
    }

    // Categories - only seed if empty
    const catCount = await sql`SELECT count(*) as c FROM product_categories`
    if (Number(catCount[0]?.c) === 0) {
      await sql`INSERT INTO product_categories (name, label_ar, icon, sort_order) VALUES
        ('حلويات ليبية', 'حلويات ليبية', 'star', 1),
        ('حلويات شرقية', 'حلويات شرقية', 'cake', 2),
        ('عصائر طبيعية', 'عصائر طبيعية', 'cup-soda', 3)`
    }

    // Products - only seed if empty
    const prodCount = await sql`SELECT count(*) as c FROM products`
    if (Number(prodCount[0]?.c) === 0) {
      await sql`INSERT INTO products (name, price, category, category_id, is_available, is_featured, sort_order)
        SELECT v.name, v.price, v.category, c.id, v.is_available, v.is_featured, v.sort_order
        FROM (VALUES
          ('مقروض', 30::numeric, 'حلويات ليبية', true, true, 1),
          ('غريبة', 25::numeric, 'حلويات ليبية', true, false, 2),
          ('مبسس', 28::numeric, 'حلويات ليبية', true, false, 3),
          ('قطايف', 32::numeric, 'حلويات ليبية', true, true, 4),
          ('بسبوسة', 20::numeric, 'حلويات ليبية', true, false, 5),
          ('زلابية', 22::numeric, 'حلويات ليبية', true, false, 6),
          ('كنافة نابلسية', 35::numeric, 'حلويات شرقية', true, true, 7),
          ('هريسة', 18::numeric, 'حلويات شرقية', true, false, 8),
          ('بسبوسة بالقشطة', 25::numeric, 'حلويات شرقية', true, false, 9),
          ('أم علي', 22::numeric, 'حلويات شرقية', true, true, 10),
          ('كنافة بالجبن', 38::numeric, 'حلويات شرقية', true, false, 11),
          ('قطايف بالقشطة', 30::numeric, 'حلويات شرقية', true, false, 12)
        ) AS v(name, price, category, is_available, is_featured, sort_order)
        JOIN product_categories c ON c.name = v.category`
    }

    // Events - only seed if empty
    const evCount = await sql`SELECT count(*) as c FROM events`
    if (Number(evCount[0]?.c) === 0) {
      await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES
        ('صينية حلويات ليبية صغيرة', 'صينية صغيرة من أشهى الحلويات الليبية التقليدية', 80, 'حلويات ليبية', true, true, 1),
        ('صينية حلويات ليبية وسط', 'صينية متوسطة بتشكيلة غنية من الحلويات الليبية', 150, 'حلويات ليبية', true, false, 2),
        ('صينية حلويات ليبية كبيرة', 'صينية كبيرة فاخرة من أجود الحلويات الليبية', 250, 'حلويات ليبية', true, true, 3),
        ('صينية حلويات شرقية صغيرة', 'تشكيلة صغيرة من الحلويات الشرقية الفاخرة', 80, 'حلويات شرقية', true, true, 4),
        ('صينية حلويات شرقية وسط', 'صينية متوسطة من الحلويات الشرقية المتنوعة', 150, 'حلويات شرقية', true, false, 5),
        ('صينية حلويات شرقية كبيرة', 'صينية كبيرة فاخرة من أجود الحلويات الشرقية', 250, 'حلويات شرقية', true, true, 6)`
    }

    // Branches - only seed if empty
    const brCount = await sql`SELECT count(*) as c FROM branches`
    if (Number(brCount[0]?.c) === 0) {
      await sql`INSERT INTO branches (name, address, phone, secondary_phone, city, working_hours, latitude, longitude, is_active, sort_order) VALUES
        ('الفرع الرئيسي', 'شارع الجمهورية، وسط المدينة', '0925006674', '0912345678', 'طرابلس', 'يومياً من 8 صباحاً - 11 مساءً', 32.8872, 13.1803, true, 1),
        ('فرع تاجوراء', 'طريق المطار، بجانب مسجد النور', '0918765432', '', 'تاجوراء', 'يومياً من 9 صباحاً - 10 مساءً', 32.8819, 13.3515, true, 2),
        ('فرع جنزور', 'شارع الشط، مقابل سوق جنزور', '0925111222', '', 'جنزور', 'يومياً من 9 صباحاً - 10 مساءً', 32.8234, 13.0194, true, 3)`
    }

    // Delivery pricing - only seed if empty
    const delCount = await sql`SELECT count(*) as c FROM delivery_pricing`
    if (Number(delCount[0]?.c) === 0) {
      await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES
        ('طرابلس', 'طرابلس', 5, true, 1), ('تاجوراء', 'تاجوراء', 8, true, 2),
        ('جنزور', 'جنزور', 8, true, 3), ('عين زارة', 'عين زارة', 10, true, 4),
        ('السواني', 'السواني', 12, true, 5), ('القره بوللي', 'القره بوللي', 15, true, 6),
        ('الخمس', 'الخمس', 20, true, 7)`
    }

    // Site settings - only seed if empty
    const setCount = await sql`SELECT count(*) as c FROM site_settings`
    if (Number(setCount[0]?.c) === 0) {
      await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES
        ('site_name', 'عالم البكلاوة', 'text', 'general', 'Site Name', 'اسم الموقع', 1),
        ('site_description', 'أجود الحلويات الليبية والشرقية', 'text', 'general', 'Description', 'وصف الموقع', 2),
        ('contact_phone', '0925006674', 'text', 'contact', 'Phone', 'رقم الهاتف', 3),
        ('whatsapp_number', '0925006674', 'text', 'contact', 'WhatsApp', 'واتساب', 4),
        ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'text', 'social', 'Facebook', 'فيسبوك', 5),
        ('instagram_url', '', 'text', 'social', 'Instagram', 'انستغرام', 6),
        ('hero_title', 'عالَمُ البَكْلَاوَة', 'text', 'hero', 'Hero Title', 'عنوان البطل', 7),
        ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة', 'textarea', 'hero', 'Hero Description', 'وصف البطل', 8),
        ('footer_text', 'جميع الحقوق محفوظة', 'text', 'general', 'Footer', 'نص التذييل', 9),
        ('delivery_note', 'التوصيل متاح داخل طرابلس والمناطق المجاورة', 'text', 'general', 'Delivery Note', 'ملاحظة التوصيل', 10),
        ('min_order', '20', 'text', 'general', 'Min Order', 'الحد الأدنى للطلب', 11),
        ('currency', 'د.ل', 'text', 'general', 'Currency', 'العملة', 12),
        ('working_hours', 'يومياً من 8 صباحاً - 11 مساءً', 'text', 'general', 'Working Hours', 'ساعات العمل', 13),
        ('about_text', 'نقدم أجود أنواع الحلويات الليبية والشرقية بأيدٍ ماهرة', 'textarea', 'about', 'About', 'نبذة عنا', 14)
      ON CONFLICT (setting_key) DO NOTHING`
    }

    // Site images - only seed if empty
    const imgCount = await sql`SELECT count(*) as c FROM site_images`
    if (Number(imgCount[0]?.c) === 0) {
      await sql`INSERT INTO site_images (image_key, image_url, alt_text, sort_order, is_active) VALUES
        ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', 1, true),
        ('logo', '/images/logo.png', 'شعار عالم البكلاوة', 2, true),
        ('about_image', '/placeholder.svg', 'صورة نبذة عنا', 3, true),
        ('footer_bg', '/placeholder.svg', 'خلفية التذييل', 4, true),
        ('og_image', '/placeholder.svg', 'صورة المشاركة', 5, true)
      ON CONFLICT (image_key) DO NOTHING`
    }

    console.log("[v0] Auto-migration complete.")
  } catch (error) {
    console.error("[v0] Auto-migration error:", error)
    _migrationPromise = null
  }
}
