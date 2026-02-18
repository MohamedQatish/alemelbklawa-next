import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(DATABASE_URL);

async function run() {
  console.log("=== DEFINITIVE MIGRATION START ===");

  // ===================== DROP ALL TABLES =====================
  console.log("Dropping all tables...");
  await sql`DROP TABLE IF EXISTS site_images CASCADE`;
  await sql`DROP TABLE IF EXISTS site_settings CASCADE`;
  await sql`DROP TABLE IF EXISTS reservations CASCADE`;
  await sql`DROP TABLE IF EXISTS product_option_assignments CASCADE`;
  await sql`DROP TABLE IF EXISTS product_options CASCADE`;
  await sql`DROP TABLE IF EXISTS product_option_groups CASCADE`;
  await sql`DROP TABLE IF EXISTS order_items CASCADE`;
  await sql`DROP TABLE IF EXISTS orders CASCADE`;
  await sql`DROP TABLE IF EXISTS products CASCADE`;
  await sql`DROP TABLE IF EXISTS product_categories CASCADE`;
  await sql`DROP TABLE IF EXISTS delivery_pricing CASCADE`;
  await sql`DROP TABLE IF EXISTS branches CASCADE`;
  await sql`DROP TABLE IF EXISTS events CASCADE`;
  await sql`DROP TABLE IF EXISTS admin_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS admin_users CASCADE`;
  await sql`DROP TABLE IF EXISTS user_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log("All tables dropped.");

  // ===================== CREATE TABLES =====================

  await sql`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    password_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: users");

  await sql`CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: user_sessions");

  await sql`CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: admin_users");

  await sql`CREATE TABLE admin_sessions (
    id SERIAL PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: admin_sessions");

  await sql`CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label_ar VARCHAR(255),
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: product_categories");

  await sql`CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category VARCHAR(255),
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: products");

  await sql`CREATE TABLE product_option_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label_ar VARCHAR(255),
    is_required BOOLEAN DEFAULT false,
    allow_multiple BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: product_option_groups");

  await sql`CREATE TABLE product_options (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    label_ar VARCHAR(255),
    price_modifier DECIMAL(10,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: product_options");

  await sql`CREATE TABLE product_option_assignments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
    UNIQUE(product_id, option_group_id)
  )`;
  console.log("Created: product_option_assignments");

  await sql`CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category VARCHAR(255),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: events");

  await sql`CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    secondary_phone VARCHAR(50),
    city VARCHAR(100),
    google_maps_url TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    working_hours TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: branches");

  await sql`CREATE TABLE delivery_pricing (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: delivery_pricing");

  await sql`CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    notes TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    order_type VARCHAR(50) DEFAULT 'delivery',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: orders");

  await sql`CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER,
    product_name VARCHAR(255),
    category VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    addons JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: order_items");

  await sql`CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    phone VARCHAR(50),
    event_type VARCHAR(100),
    date DATE,
    time VARCHAR(50),
    guests INTEGER,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: reservations");

  await sql`CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT DEFAULT '',
    setting_type VARCHAR(50) DEFAULT 'text',
    setting_group VARCHAR(100) DEFAULT 'general',
    label VARCHAR(255) DEFAULT '',
    label_ar VARCHAR(255) DEFAULT '',
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: site_settings");

  await sql`CREATE TABLE site_images (
    id SERIAL PRIMARY KEY,
    image_key VARCHAR(255) UNIQUE NOT NULL,
    image_url TEXT DEFAULT '',
    alt_text VARCHAR(255) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log("Created: site_images");

  console.log("=== ALL 17 TABLES CREATED ===");

  // ===================== SEED DATA =====================

  // Admin user: kick / kick1234
  const encoder = new TextEncoder();
  const data = encoder.encode("kick1234" + "_kick_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  const perms = JSON.stringify(["full_access"]);

  await sql`INSERT INTO admin_users (username, password_hash, display_name, role, permissions, is_active) VALUES (${("kick")}, ${passwordHash}, ${"مدير النظام"}, ${"super_admin"}, ${perms}::jsonb, ${true})`;
  console.log("Seeded admin user: kick");

  // Product categories
  await sql`INSERT INTO product_categories (id, name, label_ar, icon, sort_order) VALUES
    (1, 'juices', 'عصائر', 'GlassWater', 1),
    (2, 'libyan-sweets', 'حلويات ليبية', 'Cookie', 2),
    (3, 'oriental-sweets', 'حلويات شرقية', 'Cake', 3),
    (4, 'ice-cream', 'مثلجات', 'IceCreamCone', 4),
    (5, 'drinks', 'مشروبات', 'Coffee', 5)`;
  await sql`SELECT setval('product_categories_id_seq', 5)`;
  console.log("Seeded 5 product categories");

  // Products - using individual inserts with tagged templates
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('عصير برتقال طبيعي', 'عصير برتقال طازج 100%', 8, 'عصائر', 1, true, true, 1)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('عصير مانجو', 'عصير مانجو طبيعي', 10, 'عصائر', 1, true, false, 2)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('عصير فراولة', 'عصير فراولة طازج', 9, 'عصائر', 1, true, false, 3)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('عصير ليمون بالنعناع', 'عصير ليمون طازج مع نعناع', 7, 'عصائر', 1, true, false, 4)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('كوكتيل فواكه', 'مزيج من الفواكه الطازجة', 12, 'عصائر', 1, true, false, 5)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('عصير رمان', 'عصير رمان طبيعي', 10, 'عصائر', 1, true, false, 6)`;

  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('بسبوسة ليبية', 'بسبوسة تقليدية بالسميد والقطر', 15, 'حلويات ليبية', 2, true, true, 1)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('مقروض', 'مقروض ليبي بالتمر', 20, 'حلويات ليبية', 2, true, true, 2)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('غريبة', 'غريبة ليبية تقليدية', 18, 'حلويات ليبية', 2, true, false, 3)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('عصيدة', 'عصيدة ليبية بالعسل والسمن', 12, 'حلويات ليبية', 2, true, false, 4)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('رشدة حلوة', 'رشدة بالحليب والمكسرات', 14, 'حلويات ليبية', 2, true, false, 5)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('كعك ليبي', 'كعك محشو بالتمر', 22, 'حلويات ليبية', 2, true, false, 6)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('مبّكرة', 'حلوى ليبية تقليدية', 16, 'حلويات ليبية', 2, true, false, 7)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('خبز محشي بالتمر', 'خبز تقليدي محشو بالتمر الفاخر', 13, 'حلويات ليبية', 2, true, false, 8)`;

  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('بقلاوة', 'بقلاوة بالفستق الحلبي', 25, 'حلويات شرقية', 3, true, true, 1)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('كنافة نابلسية', 'كنافة بالجبنة والقطر', 22, 'حلويات شرقية', 3, true, true, 2)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('هريسة', 'هريسة بالسميد والمكسرات', 18, 'حلويات شرقية', 3, true, false, 3)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('برمة', 'برمة بالفستق', 28, 'حلويات شرقية', 3, true, false, 4)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('زنود الست', 'زنود الست بالقشطة', 20, 'حلويات شرقية', 3, true, false, 5)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('قطايف بالجبنة', 'قطايف محشوة بالجبنة والقطر', 18, 'حلويات شرقية', 3, true, false, 6)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('بلورية', 'بلورية بالقشطة والفستق', 24, 'حلويات شرقية', 3, true, false, 7)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('مبرومة', 'مبرومة بالفستق الحلبي', 30, 'حلويات شرقية', 3, true, false, 8)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('وربات بالقشطة', 'وربات مقرمشة بالقشطة', 16, 'حلويات شرقية', 3, true, false, 9)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('لقمة القاضي', 'لقمة القاضي بالقطر', 15, 'حلويات شرقية', 3, true, false, 10)`;

  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('آيس كريم فانيليا', 'آيس كريم فانيليا طبيعي', 8, 'مثلجات', 4, true, true, 1)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('آيس كريم شوكولاتة', 'آيس كريم شوكولاتة فاخر', 8, 'مثلجات', 4, true, false, 2)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('آيس كريم فراولة', 'آيس كريم فراولة طبيعي', 8, 'مثلجات', 4, true, false, 3)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('آيس كريم فستق', 'آيس كريم فستق حلبي', 10, 'مثلجات', 4, true, false, 4)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('سندويش آيس كريم', 'سندويش آيس كريم بالبسكويت', 12, 'مثلجات', 4, true, false, 5)`;

  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('قهوة تركية', 'قهوة تركية أصلية', 5, 'مشروبات', 5, true, true, 1)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('شاي أخضر', 'شاي أخضر بالنعناع', 4, 'مشروبات', 5, true, false, 2)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('شاي أحمر', 'شاي أحمر تقليدي', 3, 'مشروبات', 5, true, false, 3)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('قهوة عربية', 'قهوة عربية بالهيل', 6, 'مشروبات', 5, true, false, 4)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('سحلب', 'سحلب ساخن بالمكسرات', 8, 'مشروبات', 5, true, false, 5)`;
  await sql`INSERT INTO products (name, description, price, category, category_id, is_available, is_featured, sort_order) VALUES ('حليب بالتمر', 'حليب طازج بالتمر', 7, 'مشروبات', 5, true, false, 6)`;
  console.log("Seeded 35 products");

  // Events
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('تورتة عيد ميلاد كلاسيك', 'تورتة بالكريمة والفواكه الطازجة', 45, 'أعياد ميلاد', true, true, 1)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('تورتة شوكولاتة فاخرة', 'تورتة شوكولاتة بطبقات غنية', 55, 'أعياد ميلاد', true, true, 2)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('حلويات أفراح - طقم صغير', 'طقم حلويات للأفراح 50 قطعة', 120, 'أفراح', true, true, 3)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('حلويات أفراح - طقم كبير', 'طقم حلويات للأفراح 100 قطعة', 200, 'أفراح', true, false, 4)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('بوفيه حلويات شرقية', 'بوفيه متنوع للمناسبات', 350, 'بوفيهات', true, true, 5)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('بوفيه حلويات مشكل', 'بوفيه حلويات ليبية وشرقية', 400, 'بوفيهات', true, false, 6)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('صينية قطايف رمضان', 'صينية قطايف محشوة 30 قطعة', 35, 'رمضان', true, true, 7)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('طقم حلويات رمضان', 'تشكيلة حلويات رمضانية', 80, 'رمضان', true, false, 8)`;
  await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES ('علبة هدايا فاخرة', 'علبة حلويات فاخرة للإهداء', 65, 'هدايا', true, true, 9)`;
  console.log("Seeded 9 events");

  // Branches
  await sql`INSERT INTO branches (name, address, phone, city, working_hours, latitude, longitude, is_active, sort_order) VALUES ('الفرع الرئيسي - طرابلس', 'شارع الجمهورية، طرابلس', '091-1234567', 'طرابلس', '8:00 ص - 12:00 م', 32.9022, 13.1800, true, 1)`;
  await sql`INSERT INTO branches (name, address, phone, city, working_hours, latitude, longitude, is_active, sort_order) VALUES ('فرع بنغازي', 'شارع جمال عبدالناصر، بنغازي', '091-7654321', 'بنغازي', '9:00 ص - 11:00 م', 32.1194, 20.0868, true, 2)`;
  await sql`INSERT INTO branches (name, address, phone, city, working_hours, latitude, longitude, is_active, sort_order) VALUES ('فرع مصراتة', 'المنطقة المركزية، مصراتة', '091-5551234', 'مصراتة', '9:00 ص - 11:00 م', 32.3754, 15.0925, true, 3)`;
  console.log("Seeded 3 branches");

  // Delivery pricing
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('طرابلس', 'طرابلس', 5, true, 1)`;
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('بنغازي', 'بنغازي', 15, true, 2)`;
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('مصراتة', 'مصراتة', 10, true, 3)`;
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('الخمس', 'الخمس', 12, true, 4)`;
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('زليتن', 'زليتن', 12, true, 5)`;
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('الزاوية', 'الزاوية', 8, true, 6)`;
  await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES ('صبراتة', 'صبراتة', 10, true, 7)`;
  console.log("Seeded 7 delivery cities");

  // Site settings
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('site_name', 'عالم البكلاوة', 'text', 'general', 'Site Name', 'اسم الموقع', 1)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('site_description', 'أجود الحلويات الليبية والشرقية', 'text', 'general', 'Site Description', 'وصف الموقع', 2)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('hero_title', 'عالَمُ البَكْلَاوَة', 'text', 'hero', 'Hero Title', 'عنوان الهيرو', 3)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة تنقلك إلى عالمٍ من الأصالة والتميّز', 'textarea', 'hero', 'Hero Description', 'وصف الهيرو', 4)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('contact_phone', '0925006674', 'text', 'contact', 'Phone', 'رقم الهاتف', 5)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('whatsapp_number', '0925006674', 'text', 'contact', 'WhatsApp', 'رقم الواتساب', 6)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'text', 'social', 'Facebook URL', 'رابط فيسبوك', 7)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('instagram_url', '', 'text', 'social', 'Instagram URL', 'رابط انستغرام', 8)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('about_text', 'نحن متخصصون في صناعة أجود أنواع الحلويات الليبية والشرقية', 'textarea', 'about', 'About Text', 'نص من نحن', 9)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('footer_text', 'جميع الحقوق محفوظة', 'text', 'general', 'Footer Text', 'نص الفوتر', 10)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('delivery_note', 'التوصيل متاح داخل ليبيا', 'text', 'general', 'Delivery Note', 'ملاحظة التوصيل', 11)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('working_hours', '8:00 ص - 12:00 م', 'text', 'contact', 'Working Hours', 'ساعات العمل', 12)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('currency', 'د.ل', 'text', 'general', 'Currency', 'العملة', 13)`;
  await sql`INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES ('min_order_amount', '10', 'text', 'general', 'Min Order', 'الحد الأدنى للطلب', 14)`;
  console.log("Seeded 14 site settings");

  // Site images
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, is_active, sort_order) VALUES ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', true, 1)`;
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, is_active, sort_order) VALUES ('logo', '/images/logo.png', 'شعار عالم البكلاوة', true, 2)`;
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, is_active, sort_order) VALUES ('about_image', '', 'صورة من نحن', true, 3)`;
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, is_active, sort_order) VALUES ('menu_bg', '', 'خلفية القائمة', true, 4)`;
  await sql`INSERT INTO site_images (image_key, image_url, alt_text, is_active, sort_order) VALUES ('contact_bg', '', 'خلفية التواصل', true, 5)`;
  console.log("Seeded 5 site images");

  // Verify
  const counts = await sql`
    SELECT 'products' as tbl, count(*)::int as cnt FROM products
    UNION ALL SELECT 'product_categories', count(*)::int FROM product_categories
    UNION ALL SELECT 'events', count(*)::int FROM events
    UNION ALL SELECT 'branches', count(*)::int FROM branches
    UNION ALL SELECT 'delivery_pricing', count(*)::int FROM delivery_pricing
    UNION ALL SELECT 'site_settings', count(*)::int FROM site_settings
    UNION ALL SELECT 'site_images', count(*)::int FROM site_images
    UNION ALL SELECT 'admin_users', count(*)::int FROM admin_users
  `;
  console.log("=== FINAL COUNTS ===");
  for (const row of counts) {
    console.log("  " + row.tbl + ": " + row.cnt);
  }
  console.log("=== DEFINITIVE MIGRATION COMPLETE ===");
}

run().catch(e => { console.error("MIGRATION FAILED:", e); process.exit(1); });
