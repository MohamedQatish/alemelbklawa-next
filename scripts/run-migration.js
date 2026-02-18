import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const masked = dbUrl.substring(0, 30) + "..." + dbUrl.substring(dbUrl.length - 20);
console.log("[v0] Using DATABASE_URL:", masked);

const sql = neon(dbUrl);

async function run() {
  const info = await sql`SELECT current_database() as db, current_schema() as schema`;
  console.log("[v0] Connected to:", JSON.stringify(info));

  const existingTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("[v0] Existing public tables:", existingTables.map(t => t.table_name));

  // ==================== DROP OLD TABLES ====================
  console.log("[v0] Dropping old tables...");
  await sql`DROP TABLE IF EXISTS site_images CASCADE`;
  await sql`DROP TABLE IF EXISTS site_settings CASCADE`;
  await sql`DROP TABLE IF EXISTS reservations CASCADE`;
  await sql`DROP TABLE IF EXISTS order_items CASCADE`;
  await sql`DROP TABLE IF EXISTS orders CASCADE`;
  await sql`DROP TABLE IF EXISTS product_option_assignments CASCADE`;
  await sql`DROP TABLE IF EXISTS product_options CASCADE`;
  await sql`DROP TABLE IF EXISTS product_option_groups CASCADE`;
  await sql`DROP TABLE IF EXISTS products CASCADE`;
  await sql`DROP TABLE IF EXISTS product_categories CASCADE`;
  await sql`DROP TABLE IF EXISTS delivery_pricing CASCADE`;
  await sql`DROP TABLE IF EXISTS branches CASCADE`;
  await sql`DROP TABLE IF EXISTS events CASCADE`;
  await sql`DROP TABLE IF EXISTS admin_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS admin_users CASCADE`;
  await sql`DROP TABLE IF EXISTS user_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log("[v0] Dropped all old tables");

  // ==================== CREATE ALL TABLES ====================
  
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created users table");

  await sql`CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created user_sessions table");

  await sql`CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'editor',
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created admin_users table");

  await sql`CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created admin_sessions table");

  await sql`CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created product_categories table");

  await sql`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created products table");

  await sql`CREATE TABLE IF NOT EXISTS product_option_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created product_option_groups table");

  await sql`CREATE TABLE IF NOT EXISTS product_options (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
  )`;
  console.log("[v0] Created product_options table");

  await sql`CREATE TABLE IF NOT EXISTS product_option_assignments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
    UNIQUE(product_id, option_group_id)
  )`;
  console.log("[v0] Created product_option_assignments table");

  await sql`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    order_type VARCHAR(20) NOT NULL DEFAULT 'pickup',
    delivery_address TEXT,
    delivery_city VARCHAR(100),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created orders table");

  await sql`CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    selected_options JSONB DEFAULT '[]',
    total_price DECIMAL(10,2) NOT NULL
  )`;
  console.log("[v0] Created order_items table");

  await sql`CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created reservations table");

  await sql`CREATE TABLE IF NOT EXISTS delivery_pricing (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
  )`;
  console.log("[v0] Created delivery_pricing table");

  await sql`CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    hours VARCHAR(100),
    lat DECIMAL(10,7),
    lng DECIMAL(10,7),
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created branches table");

  await sql`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created events table");

  await sql`CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group VARCHAR(50) DEFAULT 'general',
    description VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created site_settings table");

  await sql`CREATE TABLE IF NOT EXISTS site_images (
    id SERIAL PRIMARY KEY,
    image_key VARCHAR(100) UNIQUE NOT NULL,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    section VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("[v0] Created site_images table");

  // ==================== SEED DATA ====================
  console.log("[v0] Seeding data...");

  // Categories
  await sql`INSERT INTO product_categories (name, slug, sort_order) VALUES
    ('بقلاوة', 'baklava', 1),
    ('معمول', 'maamoul', 2),
    ('حلويات ليبية', 'libyan-sweets', 3),
    ('حلويات شرقية', 'eastern-sweets', 4),
    ('مشروبات', 'drinks', 5)
  ON CONFLICT (slug) DO NOTHING`;
  console.log("[v0] Seeded categories");

  // Products - Baklava
  await sql`INSERT INTO products (name, price, category, category_id, image_url, is_available, sort_order) VALUES
    ('بقلاوة بالفستق', 25, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 1),
    ('بقلاوة بالكاجو', 30, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 2),
    ('بقلاوة بالجوز', 22, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 3),
    ('بقلاوة ملكية', 35, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 4),
    ('بقلاوة بالقشطة', 28, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 5),
    ('بقلاوة تركية', 32, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 6),
    ('أصابع بقلاوة', 20, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 7),
    ('بقلاوة محشوة', 27, 'بقلاوة', (SELECT id FROM product_categories WHERE slug='baklava'), '/placeholder.svg', true, 8)
  ON CONFLICT DO NOTHING`;

  // Products - Maamoul
  await sql`INSERT INTO products (name, price, category, category_id, image_url, is_available, sort_order) VALUES
    ('معمول بالتمر', 18, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 1),
    ('معمول بالفستق', 25, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 2),
    ('معمول بالجوز', 22, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 3),
    ('معمول مد بالقشطة', 20, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 4),
    ('معمول ملكي', 28, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 5),
    ('كعك معمول', 15, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 6),
    ('معمول بالتين', 20, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 7),
    ('معمول محشو لوز', 24, 'معمول', (SELECT id FROM product_categories WHERE slug='maamoul'), '/placeholder.svg', true, 8)
  ON CONFLICT DO NOTHING`;

  // Products - Libyan sweets
  await sql`INSERT INTO products (name, price, category, category_id, image_url, is_available, sort_order) VALUES
    ('مقروض', 15, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 1),
    ('غريبة', 12, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 2),
    ('كعك بالتمر', 18, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 3),
    ('بسيسة', 10, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 4),
    ('عصيدة', 14, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 5),
    ('رشدة حلوة', 16, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 6),
    ('خفيفي', 13, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 7),
    ('مبسس', 11, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 8),
    ('زلابية ليبية', 12, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 9),
    ('حلوة تركية ليبية', 17, 'حلويات ليبية', (SELECT id FROM product_categories WHERE slug='libyan-sweets'), '/placeholder.svg', true, 10)
  ON CONFLICT DO NOTHING`;

  // Products - Eastern sweets
  await sql`INSERT INTO products (name, price, category, category_id, image_url, is_available, sort_order) VALUES
    ('كنافة نابلسية', 20, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 1),
    ('هريسة', 12, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 2),
    ('بسبوسة', 14, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 3),
    ('نمورة', 13, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 4),
    ('قطايف', 18, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 5),
    ('حلاوة الجبن', 22, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 6),
    ('عوامة', 10, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 7),
    ('زنود الست', 16, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 8),
    ('ليالي لبنان', 19, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 9),
    ('مفروكة', 21, 'حلويات شرقية', (SELECT id FROM product_categories WHERE slug='eastern-sweets'), '/placeholder.svg', true, 10)
  ON CONFLICT DO NOTHING`;

  // Products - Drinks
  await sql`INSERT INTO products (name, price, category, category_id, image_url, is_available, sort_order) VALUES
    ('شاي ليبي', 5, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 1),
    ('قهوة عربية', 7, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 2),
    ('عصير طبيعي', 8, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 3),
    ('سحلب', 10, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 4),
    ('شاي أخضر بالنعناع', 6, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 5),
    ('قمر الدين', 8, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 6),
    ('جلاب', 9, 'مشروبات', (SELECT id FROM product_categories WHERE slug='drinks'), '/placeholder.svg', true, 7)
  ON CONFLICT DO NOTHING`;
  console.log("[v0] Seeded products");

  // Branches
  await sql`INSERT INTO branches (name, address, phone, hours, lat, lng, location, sort_order) VALUES
    ('الفرع الرئيسي - طرابلس', 'شارع الجمهورية، طرابلس', '091-1234567', '8:00 ص - 11:00 م', 32.9022, 13.1800, 'طرابلس', 1),
    ('فرع بنغازي', 'شارع جمال عبدالناصر، بنغازي', '091-7654321', '9:00 ص - 10:00 م', 32.1194, 20.0868, 'بنغازي', 2),
    ('فرع مصراتة', 'المنطقة المركزية، مصراتة', '091-5555555', '8:30 ص - 10:30 م', 32.3754, 15.0925, 'مصراتة', 3)
  ON CONFLICT DO NOTHING`;
  console.log("[v0] Seeded branches");

  // Events
  await sql`INSERT INTO events (name, price, category, sort_order) VALUES
    ('كيكة عيد ميلاد كلاسيك', 80, 'كيكات أعياد الميلاد', 1),
    ('كيكة عيد ميلاد فاخرة', 150, 'كيكات أعياد الميلاد', 2),
    ('كيكة ��يد ميلاد 3D', 200, 'كيكات أعياد الميلاد', 3),
    ('تشكيلة حلويات زفاف فضية', 300, 'حلويات الأعراس', 4),
    ('تشكيلة حلويات زفاف ذهبية', 500, 'حلويات الأعراس', 5),
    ('تشكيلة حلويات زفاف ملكية', 800, 'حلويات الأعراس', 6),
    ('صينية تقديم صغيرة', 50, 'هدايا ومناسبات', 7),
    ('صينية تقديم متوسطة', 100, 'هدايا ومناسبات', 8),
    ('صينية تقديم كبيرة VIP', 180, 'هدايا ومناسبات', 9)
  ON CONFLICT DO NOTHING`;
  console.log("[v0] Seeded events");

  // Delivery pricing
  await sql`INSERT INTO delivery_pricing (city_name, price, sort_order) VALUES
    ('طرابلس', 10, 1),
    ('بنغازي', 25, 2),
    ('مصراتة', 20, 3),
    ('الزاوية', 15, 4),
    ('زليتن', 18, 5),
    ('الخمس', 16, 6),
    ('غريان', 22, 7)
  ON CONFLICT DO NOTHING`;
  console.log("[v0] Seeded delivery pricing");

  // Site settings
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_group, description) VALUES
    ('site_name', 'عَالَمُ الْبَكْلَاوَة', 'general', 'اسم الموقع'),
    ('site_description', 'أجود الحلويات الليبية والشرقية', 'general', 'وصف الموقع'),
    ('hero_title', 'عَالَمُ الْبَكْلَاوَة', 'hero', 'عنوان الصفحة الرئيسية'),
    ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة تنقلك إلى عالمٍ من الأصالة والتميّز', 'hero', 'وصف الصفحة الرئيسية'),
    ('contact_phone', '0925006674', 'contact', 'رقم الهاتف'),
    ('whatsapp_number', '0925006674', 'contact', 'رقم الواتساب'),
    ('contact_email', 'info@baklava-world.ly', 'contact', 'البريد الإلكتروني'),
    ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'social', 'رابط فيسبوك'),
    ('instagram_url', '', 'social', 'رابط انستغرام'),
    ('working_hours', '8:00 ص - 11:00 م', 'general', 'ساعات العمل'),
    ('footer_text', 'جميع الحقوق محفوظة', 'general', 'نص التذييل'),
    ('about_text', 'نقدم أجود أنواع الحلويات الليبية والشرقية بمكونات طبيعية وخبرة أجيال', 'about', 'نص عن المتجر'),
    ('currency', 'د.ل', 'general', 'العملة'),
    ('delivery_enabled', 'true', 'general', 'تفعيل خدمة التوصيل')
  ON CONFLICT (setting_key) DO NOTHING`;
  console.log("[v0] Seeded site settings");

  // Site images
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, section) VALUES
    ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', 'hero'),
    ('logo', '/placeholder.svg', 'شعار الموقع', 'general'),
    ('about_image', '/placeholder.svg', 'صورة قسم من نحن', 'about'),
    ('menu_bg', '/placeholder.svg', 'خلفية قسم القائمة', 'menu'),
    ('contact_bg', '/placeholder.svg', 'خلفية قسم التواصل', 'contact')
  ON CONFLICT (image_key) DO NOTHING`;
  console.log("[v0] Seeded site images");

  // Default admin user (password: admin123)
  await sql`INSERT INTO admin_users (username, password_hash, display_name, role, permissions) VALUES
    ('admin', '$2b$10$YourHashHere', 'المدير', 'super_admin', '["manage_products","manage_orders","manage_events","manage_branches","manage_users","edit_content","manage_delivery","manage_categories"]')
  ON CONFLICT (username) DO NOTHING`;
  console.log("[v0] Seeded admin user");

  // Option groups
  await sql`INSERT INTO product_option_groups (name, display_name, is_required, min_selections, max_selections, sort_order) VALUES
    ('weight', 'الوزن', true, 1, 1, 1),
    ('extras', 'إضافات', false, 0, 5, 2),
    ('packaging', 'التغليف', false, 0, 1, 3)
  ON CONFLICT DO NOTHING`;

  await sql`INSERT INTO product_options (group_id, name, price_modifier, sort_order) VALUES
    ((SELECT id FROM product_option_groups WHERE name='weight' LIMIT 1), 'نص كيلو', 0, 1),
    ((SELECT id FROM product_option_groups WHERE name='weight' LIMIT 1), 'كيلو', 0, 2),
    ((SELECT id FROM product_option_groups WHERE name='weight' LIMIT 1), 'كيلو ونص', 0, 3),
    ((SELECT id FROM product_option_groups WHERE name='weight' LIMIT 1), '2 كيلو', 0, 4),
    ((SELECT id FROM product_option_groups WHERE name='extras' LIMIT 1), 'فستق إضافي', 5, 1),
    ((SELECT id FROM product_option_groups WHERE name='extras' LIMIT 1), 'قشطة إضافية', 3, 2),
    ((SELECT id FROM product_option_groups WHERE name='extras' LIMIT 1), 'عسل طبيعي', 4, 3),
    ((SELECT id FROM product_option_groups WHERE name='packaging' LIMIT 1), 'علبة هدايا فاخرة', 10, 1),
    ((SELECT id FROM product_option_groups WHERE name='packaging' LIMIT 1), 'تغليف عادي', 0, 2)
  ON CONFLICT DO NOTHING`;
  console.log("[v0] Seeded option groups");

  // Final verification
  const finalTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("[v0] Final public tables:", finalTables.map(t => t.table_name));

  const counts = await sql`
    SELECT 'products' as tbl, count(*)::int as cnt FROM products
    UNION ALL SELECT 'categories', count(*)::int FROM product_categories
    UNION ALL SELECT 'branches', count(*)::int FROM branches
    UNION ALL SELECT 'events', count(*)::int FROM events
    UNION ALL SELECT 'delivery', count(*)::int FROM delivery_pricing
    UNION ALL SELECT 'settings', count(*)::int FROM site_settings
    UNION ALL SELECT 'images', count(*)::int FROM site_images
  `;
  console.log("[v0] Final data counts:", JSON.stringify(counts));
}

run().catch(e => {
  console.error("[v0] Migration failed:", e.message);
  process.exit(1);
});
