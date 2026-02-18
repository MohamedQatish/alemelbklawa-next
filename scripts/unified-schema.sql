-- =====================================================
-- UNIFIED SCHEMA: Baklava World
-- Single migration that creates all tables + seeds data
-- =====================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  address TEXT,
  location VARCHAR(255),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  password_hash TEXT,
  password_plain TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- 3. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(200),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 4. ADMIN SESSIONS
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  admin_user_id INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- 5. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(150) NOT NULL,
  label_ar VARCHAR(150),
  icon_key VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL DEFAULT '',
  category_id INT REFERENCES product_categories(id),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- 7. PRODUCT OPTION GROUPS
CREATE TABLE IF NOT EXISTS product_option_groups (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES product_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  label_ar VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRODUCT OPTIONS
CREATE TABLE IF NOT EXISTS product_options (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES product_option_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255),
  label_ar VARCHAR(255),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_modifier NUMERIC DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRODUCT OPTION ASSIGNMENTS
CREATE TABLE IF NOT EXISTS product_option_assignments (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  option_group_id INT REFERENCES product_option_groups(id) ON DELETE CASCADE,
  UNIQUE(product_id, option_group_id)
);

-- 10. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- 11. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  addons TEXT,
  notes TEXT
);

-- 12. RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. DELIVERY PRICING
CREATE TABLE IF NOT EXISTS delivery_pricing (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- 14. BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  secondary_phone VARCHAR(50),
  city VARCHAR(100) DEFAULT '',
  hours VARCHAR(100),
  working_hours VARCHAR(100),
  google_maps_url TEXT,
  image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_sort ON events(sort_order);
CREATE INDEX IF NOT EXISTS idx_events_available ON events(is_available);

-- 16. SITE SETTINGS (new - for dynamic content)
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL DEFAULT '',
  setting_type VARCHAR(20) NOT NULL DEFAULT 'text',
  setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
  label VARCHAR(200),
  label_ar VARCHAR(200),
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_group ON site_settings(setting_group);

-- 17. SITE IMAGES (new - for hero/gallery/about images)
CREATE TABLE IF NOT EXISTS site_images (
  id SERIAL PRIMARY KEY,
  image_key VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_images_key ON site_images(image_key);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed Categories
INSERT INTO product_categories (name, label, label_ar, icon_key, sort_order) VALUES
  ('عصائر', 'عصائر طبيعية', 'عصائر طبيعية', 'juices', 1),
  ('حلويات ليبية', 'حلويات ليبية', 'حلويات ليبية', 'libyan', 2),
  ('حلويات شرقية', 'حلويات شرقية', 'حلويات شرقية', 'oriental', 3),
  ('كيك', 'كيك وتورتات', 'كيك وتورتات', 'cakes', 4),
  ('تورتة مخصصة', 'تورتات مخصصة', 'تورتات مخصصة', 'torta', 5)
ON CONFLICT (name) DO NOTHING;

-- Seed Products
INSERT INTO products (name, price, category, description, image_url, is_available, is_featured, sort_order) VALUES
  ('عصير فراولة', 8, 'عصائر', NULL, NULL, true, false, 1),
  ('عصير مانجو', 8, 'عصائر', NULL, NULL, true, false, 2),
  ('كركديه', 5, 'عصائر', NULL, NULL, true, false, 3),
  ('سلطة فواكه', 10, 'عصائر', NULL, NULL, true, false, 4),
  ('عصير برتقال', 7, 'عصائر', NULL, NULL, true, false, 5),
  ('كوكتيل', 12, 'عصائر', NULL, NULL, true, false, 6),
  ('كعك حلو', 15, 'حلويات ليبية', NULL, NULL, true, false, 7),
  ('كعك مالح', 15, 'حلويات ليبية', NULL, NULL, true, false, 8),
  ('كعك تمر', 18, 'حلويات ليبية', NULL, NULL, true, false, 9),
  ('بسكويت تمر', 12, 'حلويات ليبية', NULL, NULL, true, false, 10),
  ('معمول تمر', 20, 'حلويات ليبية', NULL, NULL, true, false, 11),
  ('لويزة مكسرات', 25, 'حلويات ليبية', NULL, NULL, true, false, 12),
  ('لويزة شوكولاتة', 25, 'حلويات ليبية', NULL, NULL, true, false, 13),
  ('غريبة', 18, 'حلويات ليبية', NULL, NULL, true, false, 14),
  ('مقروض طرابلسي', 22, 'حلويات ليبية', NULL, NULL, true, true, 15),
  ('بقلاوة طرابلسية', 30, 'حلويات ليبية', NULL, NULL, true, true, 16),
  ('عنبمبر', 20, 'حلويات ليبية', NULL, NULL, true, false, 17),
  ('زلابية', 15, 'حلويات ليبية', NULL, NULL, true, false, 18),
  ('لقيمات', 12, 'حلويات ليبية', NULL, NULL, true, false, 19),
  ('بقلاوة حشي', 28, 'حلويات ليبية', NULL, NULL, true, false, 20),
  ('أصابع زينب', 15, 'حلويات شرقية', NULL, NULL, true, false, 21),
  ('كنافة جبن', 25, 'حلويات شرقية', NULL, NULL, true, true, 22),
  ('كنافة نوتيلا', 28, 'حلويات شرقية', NULL, NULL, true, true, 23),
  ('كنافة نابلسية', 25, 'حلويات شرقية', NULL, NULL, true, false, 24),
  ('جولاش بالكاسترد', 18, 'حلويات شرقية', NULL, NULL, true, false, 25),
  ('مشلتت كلاسيك', 20, 'حلويات شرقية', NULL, NULL, true, false, 26),
  ('مشلتت شوكولاتة', 22, 'حلويات شرقية', NULL, NULL, true, false, 27),
  ('مشلتت كريمة', 22, 'حلويات شرقية', NULL, NULL, true, false, 28),
  ('بسبوسة كلاسيك', 15, 'حلويات شرقية', NULL, NULL, true, false, 29),
  ('بسبوسة شوكولاتة', 18, 'حلويات شرقية', NULL, NULL, true, false, 30),
  ('بسبوسة كريمة', 18, 'حلويات شرقية', NULL, NULL, true, false, 31),
  ('بلح الشام', 15, 'حلويات شرقية', NULL, NULL, true, false, 32),
  ('أم علي', 20, 'حلويات شرقية', NULL, NULL, true, false, 33),
  ('قطايف', 18, 'حلويات شرقية', NULL, NULL, true, false, 34),
  ('سان سيباستيان', 45, 'كيك', NULL, NULL, true, true, 35),
  ('تشيز كيك فراولة', 40, 'كيك', NULL, NULL, true, false, 36),
  ('تشيز كيك مانجو', 40, 'كيك', NULL, NULL, true, false, 37),
  ('كيكة برتقال', 35, 'كيك', NULL, NULL, true, false, 38),
  ('كيكة جزر', 35, 'كيك', NULL, NULL, true, false, 39),
  ('تورتة فستق', 55, 'تورتة مخصصة', 'حشوة فستق فاخرة', NULL, true, true, 40),
  ('تورتة أوريو', 50, 'تورتة مخصصة', 'حشوة أوريو كريمية', NULL, true, false, 41),
  ('تورتة شوكولاتة', 50, 'تورتة مخصصة', 'حشوة شوكولاتة غنية', NULL, true, false, 42),
  ('تورتة شوكولاتة وكراميل', 55, 'تورتة مخصصة', 'حشوة شوكولاتة وكراميل', NULL, true, false, 43)
ON CONFLICT DO NOTHING;

-- Link products to categories
UPDATE products SET category_id = pc.id
FROM product_categories pc
WHERE products.category = pc.name AND products.category_id IS NULL;

-- Seed Option Groups
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'juice-size', 'الحجم', id, 1 FROM product_categories WHERE name = 'عصائر';

INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'libyan-sweets-weight', 'الكمية', id, 1 FROM product_categories WHERE name = 'حلويات ليبية';

INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'oriental-sweets-weight', 'الكمية', id, 1 FROM product_categories WHERE name = 'حلويات شرقية';

-- Seed Options: Juice sizes
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '250ml', '250ml', '250 مل', 0, 0, 1 FROM product_option_groups WHERE name = 'juice-size';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '750ml', '750ml', '750 مل', 0, 0, 2 FROM product_option_groups WHERE name = 'juice-size';

-- Seed Options: Libyan sweets weights
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, 'piece', 'Piece', 'قطعة', 0, 0, 1 FROM product_option_groups WHERE name = 'libyan-sweets-weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '1kg', '1kg', '1 كيلو', 0, 0, 2 FROM product_option_groups WHERE name = 'libyan-sweets-weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '500g', '500g', 'نصف كيلو', 0, 0, 3 FROM product_option_groups WHERE name = 'libyan-sweets-weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '250g', '250g', 'ربع كيلو', 0, 0, 4 FROM product_option_groups WHERE name = 'libyan-sweets-weight';

-- Seed Options: Oriental sweets weights
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, 'piece', 'Piece', 'قطعة', 0, 0, 1 FROM product_option_groups WHERE name = 'oriental-sweets-weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '1kg', '1kg', '1 كيلو', 0, 0, 2 FROM product_option_groups WHERE name = 'oriental-sweets-weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '500g', '500g', 'نصف كيلو', 0, 0, 3 FROM product_option_groups WHERE name = 'oriental-sweets-weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '250g', '250g', 'ربع كيلو', 0, 0, 4 FROM product_option_groups WHERE name = 'oriental-sweets-weight';

-- Auto-assign option groups to products
INSERT INTO product_option_assignments (product_id, option_group_id)
SELECT p.id, g.id
FROM products p
JOIN product_categories c ON p.category_id = c.id
JOIN product_option_groups g ON g.category_id = c.id
ON CONFLICT DO NOTHING;

-- Seed Delivery Pricing
INSERT INTO delivery_pricing (city, price) VALUES
  ('طرابلس', 10),
  ('مصراتة', 25),
  ('الخمس', 20),
  ('درنة', 40),
  ('صبراتة', 15),
  ('الزاوية', 15),
  ('بنغازي', 35)
ON CONFLICT (city) DO NOTHING;

-- Seed Branches
INSERT INTO branches (name, address, phone, hours, working_hours, latitude, longitude, city, sort_order) VALUES
  ('فرع النوفليين', 'النوفليين - شارع صحنة الحسناء', '0920001171', '10:00 ص - 12:00 م', '10:00 ص - 12:00 م', 32.8872, 13.1803, 'فرع النوفليين', 1),
  ('فرع سوق الجمعة', 'سوق الجمعة - مركز الشرطة', '0925006674', '10:00 ص - 12:00 م', '10:00 ص - 12:00 م', 32.9017, 13.1569, 'فرع سوق الجمعة', 2),
  ('فرع السراج', 'السراج - بجانب مماش', '0922777878', '10:00 ص - 12:00 م', '10:00 ص - 12:00 م', 32.8534, 13.0357, 'فرع السراج', 3)
ON CONFLICT DO NOTHING;

-- Seed Events
INSERT INTO events (name, price, category, sort_order) VALUES
  ('بقلاوة', 30, 'حلويات', 1),
  ('عنبمبر', 20, 'حلويات', 2),
  ('مقروض', 22, 'حلويات', 3),
  ('كنافة جبن', 25, 'حلويات شرقية', 1),
  ('كنافة نوتيلا', 28, 'حلويات شرقية', 2),
  ('كنافة نابلسية', 25, 'حلويات شرقية', 3),
  ('عصير فراولة', 8, 'عصائر', 1),
  ('عصير مانجو', 8, 'عصائر', 2),
  ('روزاتا', 10, 'عصائر', 3)
ON CONFLICT DO NOTHING;

-- Seed Site Settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, setting_group, label, label_ar, sort_order) VALUES
  ('site_name', 'عالم البقلاوة', 'text', 'general', 'Site Name', 'اسم الموقع', 1),
  ('site_description', 'أجود الحلويات الليبية والشرقية', 'text', 'general', 'Site Description', 'وصف الموقع', 2),
  ('hero_title', 'عالم البقلاوة', 'text', 'hero', 'Hero Title', 'عنوان الصفحة الرئيسية', 3),
  ('hero_subtitle', 'أجود الحلويات الليبية والشرقية', 'text', 'hero', 'Hero Subtitle', 'العنوان الفرعي', 4),
  ('hero_description', 'نقدم لكم أشهى الحلويات التقليدية والعصرية بأيدي أمهر الحلوانيين. اطلب الآن واستمتع بتجربة حلويات لا تُنسى.', 'textarea', 'hero', 'Hero Description', 'وصف الصفحة الرئيسية', 5),
  ('contact_phone', '0920001171', 'text', 'contact', 'Phone', 'رقم الهاتف', 6),
  ('contact_phone_2', '0925006674', 'text', 'contact', 'Phone 2', 'رقم الهاتف 2', 7),
  ('contact_email', 'info@baklavaworld.ly', 'text', 'contact', 'Email', 'البريد الإلكتروني', 8),
  ('contact_address', 'طرابلس، ليبيا', 'text', 'contact', 'Address', 'العنوان', 9),
  ('whatsapp_number', '0920001171', 'text', 'contact', 'WhatsApp', 'واتساب', 10),
  ('instagram_url', '', 'text', 'social', 'Instagram URL', 'رابط انستقرام', 11),
  ('facebook_url', '', 'text', 'social', 'Facebook URL', 'رابط فيسبوك', 12),
  ('about_text', 'عالم البقلاوة هو وجهتك الأولى للحلويات الليبية الأصيلة والشرقية الفاخرة. نحرص على تقديم أجود المكونات وأشهى النكهات التي تجمع بين الأصالة والإبداع.', 'textarea', 'about', 'About Text', 'نص عن الموقع', 13),
  ('footer_text', 'جميع الحقوق محفوظة لعالم البقلاوة', 'text', 'general', 'Footer Text', 'نص التذييل', 14)
ON CONFLICT (setting_key) DO NOTHING;

-- Seed Site Images
INSERT INTO site_images (image_key, image_url, alt_text, sort_order) VALUES
  ('hero_bg', '/placeholder.svg', 'خلفية الصفحة الرئيسية', 1),
  ('hero_slide_1', '/placeholder.svg', 'صورة العرض 1', 2),
  ('hero_slide_2', '/placeholder.svg', 'صورة العرض 2', 3),
  ('about_image', '/placeholder.svg', 'صورة عن الموقع', 4),
  ('logo', '/placeholder.svg', 'شعار عالم البقلاوة', 5)
ON CONFLICT DO NOTHING;
