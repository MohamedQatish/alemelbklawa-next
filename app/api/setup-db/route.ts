import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function POST() {
  const log: string[] = []
  try {
    // Check current state
    const before = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    log.push(`Before: ${before.length} tables: ${before.map((t: any) => t.table_name).join(", ")}`)

    // Drop all tables
    await sql`DROP TABLE IF EXISTS site_images CASCADE`
    await sql`DROP TABLE IF EXISTS site_settings CASCADE`
    await sql`DROP TABLE IF EXISTS reservations CASCADE`
    await sql`DROP TABLE IF EXISTS product_option_assignments CASCADE`
    await sql`DROP TABLE IF EXISTS product_options CASCADE`
    await sql`DROP TABLE IF EXISTS product_option_groups CASCADE`
    await sql`DROP TABLE IF EXISTS order_items CASCADE`
    await sql`DROP TABLE IF EXISTS orders CASCADE`
    await sql`DROP TABLE IF EXISTS products CASCADE`
    await sql`DROP TABLE IF EXISTS product_categories CASCADE`
    await sql`DROP TABLE IF EXISTS delivery_pricing CASCADE`
    await sql`DROP TABLE IF EXISTS branches CASCADE`
    await sql`DROP TABLE IF EXISTS events CASCADE`
    await sql`DROP TABLE IF EXISTS admin_sessions CASCADE`
    await sql`DROP TABLE IF EXISTS admin_users CASCADE`
    await sql`DROP TABLE IF EXISTS user_sessions CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`
    log.push("Dropped all tables")

    // Create all tables
    await sql`CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE, phone VARCHAR(50), city VARCHAR(100), address TEXT, password_hash TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: users")

    await sql`CREATE TABLE user_sessions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, session_token TEXT UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: user_sessions")

    await sql`CREATE TABLE admin_users (id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name VARCHAR(255), role VARCHAR(50) DEFAULT 'admin', permissions JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT true, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: admin_users")

    await sql`CREATE TABLE admin_sessions (id SERIAL PRIMARY KEY, session_token TEXT UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL, admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: admin_sessions")

    await sql`CREATE TABLE product_categories (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, label_ar VARCHAR(255), icon VARCHAR(100), sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: product_categories")

    await sql`CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0, category VARCHAR(255), category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL, image_url TEXT, is_available BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: products")

    await sql`CREATE TABLE product_option_groups (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, label_ar VARCHAR(255), is_required BOOLEAN DEFAULT false, allow_multiple BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: product_option_groups")

    await sql`CREATE TABLE product_options (id SERIAL PRIMARY KEY, group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, label_ar VARCHAR(255), price DECIMAL(10,2) DEFAULT 0, price_modifier DECIMAL(10,2) DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: product_options")

    await sql`CREATE TABLE product_option_assignments (id SERIAL PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE, UNIQUE(product_id, option_group_id))`
    log.push("Created: product_option_assignments")

    await sql`CREATE TABLE events (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0, category VARCHAR(255), image_url TEXT, is_available BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: events")

    await sql`CREATE TABLE branches (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, address TEXT, phone VARCHAR(50), secondary_phone VARCHAR(50), city VARCHAR(100), google_maps_url TEXT, latitude DECIMAL(10,7), longitude DECIMAL(10,7), working_hours TEXT, image_url TEXT, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: branches")

    await sql`CREATE TABLE delivery_pricing (id SERIAL PRIMARY KEY, city_name VARCHAR(255) NOT NULL, city VARCHAR(255), price DECIMAL(10,2) DEFAULT 0, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: delivery_pricing")

    await sql`CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, customer_name VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, notes TEXT, total_amount DECIMAL(10,2) DEFAULT 0, delivery_fee DECIMAL(10,2) DEFAULT 0, status VARCHAR(50) DEFAULT 'pending', order_type VARCHAR(50) DEFAULT 'delivery', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: orders")

    await sql`CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER, product_name VARCHAR(255), category VARCHAR(255), quantity INTEGER DEFAULT 1, unit_price DECIMAL(10,2) DEFAULT 0, addons JSONB, notes TEXT, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: order_items")

    await sql`CREATE TABLE reservations (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, customer_name VARCHAR(255), phone VARCHAR(50), event_type VARCHAR(100), date DATE, time VARCHAR(50), guests INTEGER, notes TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: reservations")

    await sql`CREATE TABLE site_settings (id SERIAL PRIMARY KEY, setting_key VARCHAR(255) UNIQUE NOT NULL, setting_value TEXT DEFAULT '', setting_type VARCHAR(50) DEFAULT 'text', setting_group VARCHAR(100) DEFAULT 'general', label VARCHAR(255) DEFAULT '', label_ar VARCHAR(255) DEFAULT '', description TEXT, sort_order INTEGER DEFAULT 0, updated_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: site_settings")

    await sql`CREATE TABLE site_images (id SERIAL PRIMARY KEY, image_key VARCHAR(255) UNIQUE NOT NULL, image_url TEXT DEFAULT '', alt_text VARCHAR(255) DEFAULT '', is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`
    log.push("Created: site_images")

    // Verify
    const after = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    log.push(`After: ${after.length} tables: ${after.map((t: any) => t.table_name).join(", ")}`)

    // SEED: Admin user kick
    const encoder = new TextEncoder()
    const data = encoder.encode("kick1234" + "_kick_salt_2024")
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
    await sql`INSERT INTO admin_users (username, password_hash, display_name, role, permissions) VALUES ('kick', ${passHash}, 'مدير النظام', 'super_admin', '["all"]') ON CONFLICT (username) DO NOTHING`
    log.push("Admin user 'kick' created")

    // SEED: Categories
    await sql`INSERT INTO product_categories (name, label_ar, icon, sort_order) VALUES
      ('حلويات ليبية', 'حلويات ليبية', 'star', 1), ('حلويات شرقية', 'حلويات شرقية', 'cake', 2),
      ('عصائر', 'عصائر', 'cup-soda', 3), ('كيك', 'كيك', 'cake-slice', 4),
      ('تورتة مخصصة', 'تورتة مخصصة', 'palette', 5) ON CONFLICT DO NOTHING`
    log.push("Categories seeded")

    // SEED: Products
    await sql`INSERT INTO products (name, price, category, category_id, is_available, is_featured, sort_order) VALUES
      ('مقروض', 30, 'حلويات ليبية', 1, true, true, 1), ('غريبة', 25, 'حلويات ليبية', 1, true, false, 2),
      ('مبسس', 28, 'حلويات ليبية', 1, true, false, 3), ('قطايف', 32, 'حلويات ليبية', 1, true, true, 4),
      ('بسبوسة', 20, 'حلويات ليبية', 1, true, false, 5), ('زلابية', 22, 'حلويات ليبية', 1, true, false, 6),
      ('كنافة نابلسية', 35, 'حلويات شرقية', 2, true, true, 7), ('هريسة', 18, 'حلويات شرقية', 2, true, false, 8),
      ('بسبوسة بالقشطة', 25, 'حلويات شرقية', 2, true, false, 9), ('أم علي', 22, 'حلويات شرقية', 2, true, true, 10),
      ('كنافة بالجبن', 38, 'حلويات شرقية', 2, true, false, 11), ('قطايف بالقشطة', 30, 'حلويات شرقية', 2, true, false, 12),
      ('عصير فراولة', 8, 'عصائر', 3, true, true, 13), ('عصير مانجو', 8, 'عصائر', 3, true, false, 14),
      ('كركديه', 5, 'عصائر', 3, true, false, 15), ('سلطة فواكه', 10, 'عصائر', 3, true, true, 16),
      ('عصير برتقال', 7, 'عصائر', 3, true, false, 17), ('كوكتيل', 12, 'عصائر', 3, true, false, 18),
      ('سان سيباستيان', 45, 'كيك', 4, true, true, 19), ('تشيز كيك فراولة', 40, 'كيك', 4, true, false, 20),
      ('تشيز كيك مانجو', 40, 'كيك', 4, true, false, 21), ('كيكة برتقال', 35, 'كيك', 4, true, false, 22),
      ('كيكة جزر', 35, 'كيك', 4, true, false, 23),
      ('تورتة فستق', 55, 'تورتة مخصصة', 5, true, true, 24), ('تورتة أوريو', 50, 'تورتة مخصصة', 5, true, false, 25),
      ('تورتة شوكولاتة', 50, 'تورتة مخصصة', 5, true, false, 26), ('تورتة شوكولاتة وكراميل', 55, 'تورتة مخصصة', 5, true, false, 27)
    ON CONFLICT DO NOTHING`
    log.push("Products seeded")

    // SEED: Events
    await sql`INSERT INTO events (name, description, price, category, is_available, is_featured, sort_order) VALUES
      ('صينية حلويات ليبية صغيرة', 'صينية صغيرة من أشهى الحلويات الليبية التقليدية', 80, 'حلويات ليبية', true, true, 1),
      ('صينية حلويات ليبية وسط', 'صينية متوسطة بتشكيلة غنية من الحلويات الليبية', 150, 'حلويات ليبية', true, false, 2),
      ('صينية حلويات ليبية كبيرة', 'صينية كبيرة فاخرة من أجود الحلويات الليبية', 250, 'حلويات ليبية', true, true, 3),
      ('صينية حلويات شرقية صغيرة', 'تشكيلة صغيرة من الحلويات الشرقية الفاخرة', 80, 'حلويات شرقية', true, true, 4),
      ('صينية حلويات شرقية وسط', 'صينية متوسطة من الحلويات الشرقية المتنوعة', 150, 'حلويات شرقية', true, false, 5),
      ('صينية حلويات شرقية كبيرة', 'صينية كبيرة فاخرة من أجود الحلويات الشرقية', 250, 'حلويات شرقية', true, true, 6),
      ('باكج عصائر صغير', 'تشكيلة عصائر طازجة للمناسبات الصغيرة', 60, 'عصائر', true, true, 7),
      ('باكج عصائر وسط', 'تشكيلة عصائر متنوعة للمناسبات المتوسطة', 120, 'عصائر', true, false, 8),
      ('باكج عصائر كبير', 'تشكيلة عصائر فاخرة للمناسبات الكبيرة', 200, 'عصائر', true, true, 9)
    ON CONFLICT DO NOTHING`
    log.push("Events seeded")

    // SEED: Branches
    await sql`INSERT INTO branches (name, address, phone, secondary_phone, city, working_hours, latitude, longitude, is_active, sort_order) VALUES
      ('الفرع الرئيسي', 'شارع الجمهورية، وسط المدينة', '0925006674', '0912345678', 'طرابلس', 'يومياً من 8 صباحاً - 11 مساءً', 32.8872, 13.1803, true, 1),
      ('فرع تاجوراء', 'طريق المطار، بجانب مسجد النور', '0918765432', '', 'تاجوراء', 'يومياً من 9 صباحاً - 10 مساءً', 32.8819, 13.3515, true, 2),
      ('فرع جنزور', 'شارع الشط، مقابل سوق جنزور', '0925111222', '', 'جنزور', 'يومياً من 9 صباحاً - 10 مساءً', 32.8234, 13.0194, true, 3)
    ON CONFLICT DO NOTHING`
    log.push("Branches seeded")

    // SEED: Delivery pricing
    await sql`INSERT INTO delivery_pricing (city_name, city, price, is_active, sort_order) VALUES
      ('طرابلس', 'طرابلس', 5, true, 1), ('تاجوراء', 'تاجوراء', 8, true, 2),
      ('جنزور', 'جنزور', 8, true, 3), ('عين زارة', 'عين زارة', 10, true, 4),
      ('السواني', 'السواني', 12, true, 5), ('القره بوللي', 'القره بوللي', 15, true, 6),
      ('الخمس', 'الخمس', 20, true, 7)
    ON CONFLICT DO NOTHING`
    log.push("Delivery pricing seeded")

    // SEED: Site settings
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
      ('currency', 'د.ل', 'text', 'general', 'Currency', '��لعملة', 12),
      ('working_hours', 'يومياً من 8 صباحاً - 11 مساءً', 'text', 'general', 'Working Hours', 'ساعات العمل', 13),
      ('about_text', 'نقدم أجود أنواع الحلويات الليبية والشرقية بأيدٍ ماهرة', 'textarea', 'about', 'About', 'نبذة عنا', 14)
    ON CONFLICT (setting_key) DO NOTHING`
    log.push("Settings seeded")

    // SEED: Site images
    await sql`INSERT INTO site_images (image_key, image_url, alt_text, sort_order, is_active) VALUES
      ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', 1, true),
      ('logo', '/images/logo.png', 'شعار عالم البكلاوة', 2, true),
      ('about_image', '/placeholder.svg', 'صورة نبذة عنا', 3, true),
      ('footer_bg', '/placeholder.svg', 'خلفية التذييل', 4, true),
      ('og_image', '/placeholder.svg', 'صورة المشاركة', 5, true)
    ON CONFLICT (image_key) DO NOTHING`
    log.push("Images seeded")

    return NextResponse.json({ success: true, log })
  } catch (e: any) {
    log.push(`ERROR: ${e.message}`)
    console.error("[v0] setup-db error:", e)
    return NextResponse.json({ success: false, log, error: e.message }, { status: 500 })
  }
}
