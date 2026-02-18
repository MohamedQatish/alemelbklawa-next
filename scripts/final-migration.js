import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(DATABASE_URL);

async function run() {
  console.log("=== FINAL MIGRATION: Drop all, recreate with correct columns, seed data ===");

  // ========== DROP ALL ==========
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
  console.log("Dropped all tables");

  // ========== USERS ==========
  await sql`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    city VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== ADMIN ==========
  await sql`CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("Created users + admin tables");

  // ========== PRODUCT CATEGORIES ==========
  await sql`CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== PRODUCTS ==========
  await sql`CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(255),
    category_id INTEGER REFERENCES product_categories(id),
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== OPTION GROUPS ==========
  await sql`CREATE TABLE product_option_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    is_required BOOLEAN DEFAULT false,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE product_options (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_modifier NUMERIC(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
  )`;

  await sql`CREATE TABLE product_option_assignments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE
  )`;
  console.log("Created products + options tables");

  // ========== ORDERS ==========
  await sql`CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    order_type VARCHAR(50) DEFAULT 'delivery',
    delivery_city VARCHAR(100),
    delivery_address TEXT,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    subtotal NUMERIC(10,2),
    total NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2),
    selected_options JSONB DEFAULT '[]'
  )`;

  // ========== BRANCHES (columns match API: secondary_phone, city, google_maps_url, latitude, longitude, working_hours, image_url) ==========
  await sql`CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    secondary_phone VARCHAR(50),
    city VARCHAR(100),
    google_maps_url TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    working_hours VARCHAR(255),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== EVENTS (columns match API: is_available, is_featured) ==========
  await sql`CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    category VARCHAR(255),
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== DELIVERY ==========
  await sql`CREATE TABLE delivery_pricing (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
  )`;

  // ========== RESERVATIONS ==========
  await sql`CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== SITE SETTINGS ==========
  await sql`CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT DEFAULT '',
    setting_type VARCHAR(50) DEFAULT 'text',
    setting_group VARCHAR(100) DEFAULT 'general',
    label VARCHAR(255),
    label_ar VARCHAR(255),
    description VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  // ========== SITE IMAGES ==========
  await sql`CREATE TABLE site_images (
    id SERIAL PRIMARY KEY,
    image_key VARCHAR(255) UNIQUE NOT NULL,
    image_url TEXT,
    alt_text VARCHAR(500),
    section VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("Created all remaining tables");

  // ========== SEED DATA ==========

  // Admin user "kick" with SHA-256 hashed password
  const encoder = new TextEncoder();
  const data = encoder.encode("kick1234" + "_kick_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  await sql`INSERT INTO admin_users (username, password_hash, display_name, role, permissions, is_active)
    VALUES ('kick', ${passwordHash}, 'مدير النظام', 'super_admin', '["full_access"]', true)`;
  console.log("Admin user 'kick' created");

  // Categories
  await sql`INSERT INTO product_categories (name, slug, sort_order) VALUES
    ('بقلاوة', 'baklava', 1), ('حلويات ليبية', 'libyan', 2), ('معمول', 'maamoul', 3),
    ('حلويات شرقية', 'oriental', 4), ('عصائر ومشروبات', 'drinks', 5)`;

  // Products
  await sql`INSERT INTO products (name, description, price, category, category_id, is_featured, sort_order) VALUES
    ('بقلاوة بالفستق', 'بقلاوة طازجة محشوة بالفستق الحلبي', 45, 'بقلاوة', 1, true, 1),
    ('بقلاوة بالكاجو', 'بقلاوة مقرمشة بالكاجو الفاخر', 50, 'بقلاوة', 1, false, 2),
    ('بقلاوة بالجوز', 'بقلاوة تقليدية بالجوز الطبيعي', 40, 'بقلاوة', 1, false, 3),
    ('بقلاوة تركية', 'بقلاوة على الطريقة التركية', 55, 'بقلاوة', 1, true, 4),
    ('بقلاوة ملكية', 'بقلاوة فاخرة بمزيج المكسرات', 60, 'بقلاوة', 1, false, 5),
    ('بقلاوة بالعسل', 'بقلاوة بالعسل الطبيعي', 42, 'بقلاوة', 1, false, 6),
    ('بقلاوة باللوز', 'بقلاوة مقرمشة باللوز', 48, 'بقلاوة', 1, false, 7),
    ('بقلاوة بالقشطة', 'بقلاوة كريمية بالقشطة', 52, 'بقلاوة', 1, false, 8),
    ('مقروض', 'مقروض ليبي تقليدي بالتمر', 30, 'حلويات ليبية', 2, true, 1),
    ('غريبة', 'غريبة ليبية هشة ولذيذة', 25, 'حلويات ليبية', 2, false, 2),
    ('كعك بالتمر', 'كعك ليبي محشو بالتمر', 28, 'حلويات ليبية', 2, false, 3),
    ('بسيسة', 'بسيسة ليبية تقليدية', 20, 'حلويات ليبية', 2, false, 4),
    ('مبسس', 'مبسس ليبي بالسمن البلدي', 22, 'حلويات ليبية', 2, false, 5),
    ('رشدة حلوة', 'رشدة حلوة ليبية', 18, 'حلويات ليبية', 2, false, 6),
    ('عصيدة', 'عصيدة ليبية تقليدية', 15, 'حلويات ليبية', 2, true, 7),
    ('زلابية', 'زلابية مقرمشة بالعسل', 12, 'حلويات ليبية', 2, false, 8),
    ('معمول بالتمر', 'معمول طازج محشو بالتمر', 35, 'معمول', 3, true, 1),
    ('معمول بالجوز', 'معمول بالجوز الطبيعي', 40, 'معمول', 3, false, 2),
    ('معمول بالفستق', 'معمول بالفستق الحلبي', 45, 'معمول', 3, false, 3),
    ('معمول مشكل', 'معمول مشكل بأنواع مختلفة', 38, 'معمول', 3, true, 4),
    ('كنافة نابلسية', 'كنافة بالجبنة على الطريقة النابلسية', 35, 'حلويات شرقية', 4, true, 1),
    ('كنافة بالقشطة', 'كنافة كريمية بالقشطة', 30, 'حلويات شرقية', 4, false, 2),
    ('بسبوسة', 'بسبوسة بالقطر والمكسرات', 20, 'حلويات شرقية', 4, false, 3),
    ('هريسة', 'هريسة بجوز الهند', 18, 'حلويات شرقية', 4, false, 4),
    ('قطايف', 'قطايف بالقشطة والمكسرات', 25, 'حلويات شرقية', 4, true, 5),
    ('لقمة القاضي', 'لقمة القاضي المقرمشة', 15, 'حلويات شرقية', 4, false, 6),
    ('مدلوقة', 'مدلوقة بالقشطة', 22, 'حلويات شرقية', 4, false, 7),
    ('زنود الست', 'زنود الست المقرمشة', 28, 'حلويات شرقية', 4, false, 8),
    ('نمورة', 'نمورة طرية بالقطر', 16, 'حلويات شرقية', 4, false, 9),
    ('حلاوة الجبن', 'حلاوة الجبن الشامية', 32, 'حلويات شرقية', 4, false, 10),
    ('عصير برتقال طازج', 'عصير برتقال طبيعي 100%', 8, 'عصائر ومشروبات', 5, false, 1),
    ('عصير مانجو', 'عصير مانجو طبيعي', 10, 'عصائر ومشروبات', 5, true, 2),
    ('عصير فراولة', 'عصير فراولة طازج', 10, 'عصائر ومشروبات', 5, false, 3),
    ('كوكتيل فواكه', 'مزيج الفواكه الطازجة', 12, 'عصائر ومشروبات', 5, false, 4),
    ('عصير جوافة', 'عصير جوافة طبيعي', 8, 'عصائر ومشروبات', 5, false, 5),
    ('عصير رمان', 'عصير رمان طبيعي', 12, 'عصائر ومشروبات', 5, false, 6),
    ('سحلب', 'سحلب ساخن بالمكسرات', 10, 'عصائر ومشروبات', 5, true, 7),
    ('شاي أخضر', 'شاي أخضر بالنعناع', 5, 'عصائر ومشروبات', 5, false, 8),
    ('قهوة عربية', 'قهوة عربية أصيلة', 5, 'عصائر ومشروبات', 5, false, 9),
    ('قهوة تركية', 'قهوة تركية تقليدية', 7, 'عصائر ومشروبات', 5, false, 10),
    ('ميلك شيك فانيلا', 'ميلك شيك فانيلا كريمي', 15, 'عصائر ومشروبات', 5, false, 11),
    ('سموذي توت', 'سموذي التوت المشكل', 14, 'عصائر ومشروبات', 5, false, 12),
    ('ليموناضة', 'ليموناضة منعشة بالنعناع', 7, 'عصائر ومشروبات', 5, false, 13)`;
  console.log("Seeded 43 products");

  // Events
  await sql`INSERT INTO events (name, description, price, category, is_featured, is_available, sort_order) VALUES
    ('صينية بقلاوة مشكلة فاخرة', 'صينية بقلاوة مشكلة تحتوي على أجود أنواع البقلاوة', 120, 'حلويات المناسبات', true, true, 1),
    ('صينية حلويات ليبية مشكلة', 'تشكيلة من أفضل الحلويات الليبية التقليدية', 100, 'حلويات المناسبات', false, true, 2),
    ('صينية معمول فاخر', 'صينية معمول بأنواعه المختلفة', 90, 'حلويات المناسبات', false, true, 3),
    ('صينية كنافة كبيرة', 'كنافة نابلسية كبيرة للمناسبات', 80, 'حلويات شرقية للمناسبات', true, true, 1),
    ('صينية قطايف بالقشطة', 'قطايف بالقشطة والمكسرات', 70, 'حلويات شرقية للمناسبات', false, true, 2),
    ('صينية حلويات شرقية مشكلة', 'تشكيلة من الحلويات الشرقية الفاخرة', 110, 'حلويات شرقية للمناسبات', false, true, 3),
    ('جالون عصير برتقال', 'عصير برتقال طازج للمناسبات (5 لتر)', 50, 'عصائر المناسبات', false, true, 1),
    ('جالون كوكتيل فواكه', 'كوكتيل فواكه طازج (5 لتر)', 60, 'عصائر المناسبات', true, true, 2),
    ('جالون ليموناضة', 'ليموناضة منعشة بالنعناع (5 لتر)', 40, 'عصائر المناسبات', false, true, 3)`;
  console.log("Seeded 9 events");

  // Branches
  await sql`INSERT INTO branches (name, address, phone, city, working_hours, latitude, longitude, sort_order) VALUES
    ('الفرع الرئيسي - طرابلس', 'شارع الجمهورية، طرابلس', '0925006674', 'طرابلس', '9:00 ص - 11:00 م', 32.9022, 13.1800, 1),
    ('فرع بنغازي', 'شارع جمال عبدالناصر، بنغازي', '0925006675', 'بنغازي', '9:00 ص - 11:00 م', 32.1167, 20.0667, 2),
    ('فرع مصراتة', 'المنطقة المركزية، مصراتة', '0925006676', 'مصراتة', '9:00 ص - 10:00 م', 32.3754, 15.0925, 3)`;
  console.log("Seeded 3 branches");

  // Delivery
  await sql`INSERT INTO delivery_pricing (city_name, price, sort_order) VALUES
    ('طرابلس', 10, 1), ('بنغازي', 25, 2), ('مصراتة', 20, 3),
    ('الزاوية', 15, 4), ('زليتن', 18, 5), ('الخمس', 17, 6), ('غ��يان', 22, 7)`;
  console.log("Seeded 7 delivery cities");

  // Site settings
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES
    ('site_name', 'عالم البكلاوة', 'text', 'general', 'Site Name', 'اسم الموقع', 1),
    ('site_description', 'أجود الحلويات الليبية والشرقية', 'text', 'general', 'Description', 'وصف الموقع', 2),
    ('contact_phone', '0925006674', 'text', 'contact', 'Phone', 'رقم الهاتف', 3),
    ('whatsapp_number', '0925006674', 'text', 'contact', 'WhatsApp', 'رقم الواتساب', 4),
    ('contact_email', 'info@baklava-world.com', 'text', 'contact', 'Email', 'البريد الإلكتروني', 5),
    ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'text', 'social', 'Facebook', 'فيسبوك', 6),
    ('instagram_url', '', 'text', 'social', 'Instagram', 'انستغرام', 7),
    ('hero_title', 'عالم البكلاوة', 'text', 'hero', 'Hero Title', 'عنوان البطل', 8),
    ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة تنقلك إلى عالمٍ من الأصالة والتميّز', 'textarea', 'hero', 'Hero Description', 'وصف البطل', 9),
    ('about_text', 'نقدم أجود أنواع الحلويات الشرقية والليبية المصنوعة بحب وعناية', 'textarea', 'about', 'About', 'نبذة عنا', 10),
    ('footer_text', 'جميع الحقوق محفوظة', 'text', 'general', 'Footer', 'نص التذييل', 11),
    ('currency', 'د.ل', 'text', 'general', 'Currency', 'العملة', 12),
    ('min_order', '20', 'text', 'general', 'Min Order', 'الحد الأدنى للطلب', 13),
    ('delivery_enabled', 'true', 'text', 'general', 'Delivery', 'التوصيل', 14)`;
  console.log("Seeded 14 settings");

  // Site images
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, section, sort_order) VALUES
    ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', 'hero', 1),
    ('logo', '/images/logo.png', 'شعار عالم البكلاوة', 'general', 2),
    ('about_image', '/images/about.jpg', 'صورة من نحن', 'about', 3),
    ('menu_bg', '/images/menu-bg.jpg', 'خلفية القائمة', 'menu', 4),
    ('events_bg', '/images/events-bg.jpg', 'خلفية المناسبات', 'events', 5)`;
  console.log("Seeded 5 site images");

  // Option Groups
  await sql`INSERT INTO product_option_groups (name, display_name, is_required, min_selections, max_selections, sort_order) VALUES
    ('size', 'الحجم', true, 1, 1, 1),
    ('extras', 'إضافات', false, 0, 3, 2),
    ('packaging', 'التغليف', false, 0, 1, 3)`;

  await sql`INSERT INTO product_options (group_id, name, price_modifier, sort_order) VALUES
    (1, 'صغير (250 جم)', 0, 1), (1, 'وسط (500 جم)', 15, 2),
    (1, 'كبير (1 كجم)', 35, 3), (1, 'عائلي (2 كجم)', 70, 4),
    (2, 'فستق إضافي', 5, 1), (2, 'عسل إضافي', 3, 2), (2, 'مكسرات مشكلة', 7, 3),
    (3, 'علبة هدايا فاخرة', 10, 1), (3, 'تغليف عادي', 0, 2)`;
  console.log("Seeded option groups");

  // Verify
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM products) as products,
      (SELECT count(*) FROM events) as events,
      (SELECT count(*) FROM branches) as branches,
      (SELECT count(*) FROM delivery_pricing) as delivery,
      (SELECT count(*) FROM admin_users) as admins,
      (SELECT count(*) FROM site_settings) as settings,
      (SELECT count(*) FROM site_images) as images
  `;
  console.log("=== VERIFICATION ===", JSON.stringify(counts[0]));

  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log("All public tables:", tables.map(t => t.table_name).join(", "));
  console.log("=== MIGRATION COMPLETE ===");
}

run().catch(e => { console.error("MIGRATION FAILED:", e); process.exit(1); });
