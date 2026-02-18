import { sql } from "@/lib/neon"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const results: string[] = []
  try {
    // ===== product_categories =====
    await sql`CREATE TABLE IF NOT EXISTS product_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("product_categories created")

    // ===== products =====
    await sql`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
      image_url TEXT DEFAULT '/placeholder.svg',
      is_available BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("products created")

    // ===== product_option_groups =====
    await sql`CREATE TABLE IF NOT EXISTS product_option_groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_ar VARCHAR(255),
      is_required BOOLEAN DEFAULT false,
      allow_multiple BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("product_option_groups created")

    // ===== product_options =====
    await sql`CREATE TABLE IF NOT EXISTS product_options (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      name_ar VARCHAR(255),
      price DECIMAL(10,2) DEFAULT 0,
      price_modifier DECIMAL(10,2) DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    )`
    results.push("product_options created")

    // ===== product_option_assignments =====
    await sql`CREATE TABLE IF NOT EXISTS product_option_assignments (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE,
      UNIQUE(product_id, option_group_id)
    )`
    results.push("product_option_assignments created")

    // ===== orders =====
    await sql`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      delivery_city VARCHAR(255),
      delivery_address TEXT,
      delivery_fee DECIMAL(10,2) DEFAULT 0,
      subtotal DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("orders created")

    // ===== order_items =====
    await sql`CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      options JSONB DEFAULT '[]'
    )`
    results.push("order_items created")

    // ===== delivery_pricing =====
    await sql`CREATE TABLE IF NOT EXISTS delivery_pricing (
      id SERIAL PRIMARY KEY,
      city_name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0
    )`
    results.push("delivery_pricing created")

    // ===== reservations =====
    await sql`CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      event_date DATE,
      guest_count INTEGER,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("reservations created")

    // ===== site_settings =====
    await sql`CREATE TABLE IF NOT EXISTS site_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(255) UNIQUE NOT NULL,
      setting_value TEXT,
      setting_group VARCHAR(100) DEFAULT 'general',
      setting_type VARCHAR(50) DEFAULT 'text',
      label VARCHAR(255),
      label_ar VARCHAR(255),
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("site_settings created")

    // ===== site_images =====
    await sql`CREATE TABLE IF NOT EXISTS site_images (
      id SERIAL PRIMARY KEY,
      image_key VARCHAR(255) UNIQUE NOT NULL,
      image_url TEXT NOT NULL,
      alt_text VARCHAR(500),
      section VARCHAR(100),
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      updated_at TIMESTAMP DEFAULT NOW()
    )`
    results.push("site_images created")

    // ===== SEED DATA =====
    // Categories
    const catCount = await sql`SELECT count(*) as c FROM product_categories`
    if (Number(catCount[0].c) === 0) {
      await sql`INSERT INTO product_categories (name, slug, sort_order) VALUES
        ('حلويات ليبية', 'libyan-sweets', 1),
        ('حلويات شرقية', 'eastern-sweets', 2),
        ('عصائر', 'juices', 3),
        ('كيك', 'cakes', 4),
        ('تورتة مخصصة', 'custom-torta', 5)
      `
      results.push("categories seeded")
    }

    // Products
    const prodCount = await sql`SELECT count(*) as c FROM products`
    if (Number(prodCount[0].c) === 0) {
      await sql`INSERT INTO products (name, description, price, category, category_id, image_url, is_featured, sort_order) VALUES
        ('غريبة', 'حلوى ليبية تقليدية هشة وذائبة', 15.00, 'حلويات ليبية', 1, '/placeholder.svg', true, 1),
        ('مقروض', 'مقروض ليبي أصيل بالتمر', 16.00, 'حلويات ليبية', 1, '/placeholder.svg', true, 2),
        ('خفيفة', 'حلوى ليبية خفيفة ولذيذة', 14.00, 'حلويات ليبية', 1, '/placeholder.svg', false, 3),
        ('رشدة حلوة', 'رشدة حلوة على الطريقة الليبية', 17.00, 'حلويات ليبية', 1, '/placeholder.svg', false, 4),
        ('عصيدة', 'عصيدة ليبية تقليدية', 12.00, 'حلويات ليبية', 1, '/placeholder.svg', false, 5),
        ('بسيسة', 'بسيسة ليبية بالتمر والسمن', 13.00, 'حلويات ليبية', 1, '/placeholder.svg', false, 6),
        ('مبسس', 'حلوى ليبية من السميد والتمر', 14.00, 'حلويات ليبية', 1, '/placeholder.svg', false, 7),
        ('زلابية', 'زلابية مقرمشة بالعسل', 10.00, 'حلويات ليبية', 1, '/placeholder.svg', false, 8),
        ('كنافة', 'كنافة بالجبن أو القشطة', 20.00, 'حلويات شرقية', 2, '/placeholder.svg', true, 9),
        ('بسبوسة', 'بسبوسة بالسميد والقطر', 15.00, 'حلويات شرقية', 2, '/placeholder.svg', true, 10),
        ('هريسة', 'هريسة حلوة بالسميد واللوز', 16.00, 'حلويات شرقية', 2, '/placeholder.svg', false, 11),
        ('قطايف', 'قطايف محشوة بالجوز أو القشطة', 18.00, 'حلويات شرقية', 2, '/placeholder.svg', false, 12),
        ('لقمة القاضي', 'كرات مقلية ذهبية بالقطر', 12.00, 'حلويات شرقية', 2, '/placeholder.svg', false, 13),
        ('مهلبية', 'مهلبية كريمية بالحليب والنشا', 10.00, 'حلويات شرقية', 2, '/placeholder.svg', false, 14),
        ('ام علي', 'حلوى ام علي بالمكسرات والحليب', 15.00, 'حلويات شرقية', 2, '/placeholder.svg', false, 15),
        ('عوامة', 'كرات عوامة مقرمشة بالقطر', 11.00, 'حلويات شرقية', 2, '/placeholder.svg', false, 16),
        ('عصير فراولة', 'عصير فراولة طازج', 8.00, 'عصائر', 3, '/placeholder.svg', true, 17),
        ('عصير مانجو', 'عصير مانجو طبيعي', 8.00, 'عصائر', 3, '/placeholder.svg', false, 18),
        ('كركديه', 'كركديه منعش', 5.00, 'عصائر', 3, '/placeholder.svg', false, 19),
        ('سلطة فواكه', 'سلطة فواكه طازجة مشكلة', 10.00, 'عصائر', 3, '/placeholder.svg', true, 20),
        ('عصير برتقال', 'عصير برتقال طازج', 7.00, 'عصائر', 3, '/placeholder.svg', false, 21),
        ('كوكتيل', 'كوكتيل فواكه منعش', 12.00, 'عصائر', 3, '/placeholder.svg', false, 22),
        ('سان سيباستيان', 'كيكة سان سيباستيان الفاخرة', 45.00, 'كيك', 4, '/placeholder.svg', true, 23),
        ('تشيز كيك فراولة', 'تشيز كيك بالفراولة الطازجة', 40.00, 'كيك', 4, '/placeholder.svg', false, 24),
        ('تشيز كيك مانجو', 'تشيز كيك بالمانجو', 40.00, 'كيك', 4, '/placeholder.svg', false, 25),
        ('كيكة برتقال', 'كيكة البرتقال الطازجة', 35.00, 'كيك', 4, '/placeholder.svg', false, 26),
        ('كيكة جزر', 'كيكة الجزر مع الكريمة', 35.00, 'كيك', 4, '/placeholder.svg', false, 27),
        ('تورتة فستق', 'تورتة بحشوة فستق فاخرة', 55.00, 'تورتة مخصصة', 5, '/placeholder.svg', true, 28),
        ('تورتة أوريو', 'تورتة بحشوة أوريو كريمية', 50.00, 'تورتة مخصصة', 5, '/placeholder.svg', false, 29),
        ('تورتة شوكولاتة', 'تورتة بحشوة شوكولاتة غنية', 50.00, 'تورتة مخصصة', 5, '/placeholder.svg', false, 30),
        ('تورتة شوكولاتة وكراميل', 'تورتة بحشوة شوكولاتة وكراميل', 55.00, 'تورتة مخصصة', 5, '/placeholder.svg', false, 31)
      `
      results.push("products seeded: 31")
    }

    // Delivery pricing
    const delCount = await sql`SELECT count(*) as c FROM delivery_pricing`
    if (Number(delCount[0].c) === 0) {
      await sql`INSERT INTO delivery_pricing (city_name, price, sort_order) VALUES
        ('طرابلس', 5.00, 1),
        ('بنغازي', 15.00, 2),
        ('مصراتة', 10.00, 3),
        ('زليتن', 8.00, 4),
        ('الخمس', 7.00, 5),
        ('سرت', 12.00, 6),
        ('الزاوية', 6.00, 7)
      `
      results.push("delivery_pricing seeded: 7")
    }

    // Site settings
    const setCount = await sql`SELECT count(*) as c FROM site_settings`
    if (Number(setCount[0].c) === 0) {
      await sql`INSERT INTO site_settings (setting_key, setting_value, setting_group, setting_type, label, label_ar, sort_order) VALUES
        ('site_name', 'عالم البكلاوة', 'general', 'text', 'Site Name', 'اسم الموقع', 1),
        ('site_name_en', 'Baklava World', 'general', 'text', 'Site Name (English)', 'اسم الموقع (إنجليزي)', 2),
        ('site_description', 'أجود الحلويات الليبية والشرقية', 'general', 'textarea', 'Site Description', 'وصف الموقع', 3),
        ('hero_title', 'عالَمُ البَكْلَاوَة', 'hero', 'text', 'Hero Title', 'عنوان الهيرو', 4),
        ('hero_description', 'حيث يلتقي التراث بالفخامة... أجود الحلويات الليبية والشرقية بأيدٍ ماهرة وخبرة عريقة تنقلك إلى عالمٍ من الأصالة والتميّز', 'hero', 'textarea', 'Hero Description', 'وصف الهيرو', 5),
        ('hero_cta_text', 'اكتشف منتجاتنا', 'hero', 'text', 'Hero Button Text', 'نص زر الهيرو', 6),
        ('contact_phone', '0925006674', 'contact', 'text', 'Phone Number', 'رقم الهاتف', 7),
        ('whatsapp_number', '0925006674', 'contact', 'text', 'WhatsApp Number', 'رقم الواتساب', 8),
        ('contact_email', 'info@baklava-world.com', 'contact', 'text', 'Email', 'البريد الإلكتروني', 9),
        ('facebook_url', 'https://www.facebook.com/share/1DZGnJfuwq/', 'social', 'text', 'Facebook URL', 'رابط فيسبوك', 10),
        ('instagram_url', '', 'social', 'text', 'Instagram URL', 'رابط انستغرام', 11),
        ('tiktok_url', '', 'social', 'text', 'TikTok URL', 'رابط تيك توك', 12),
        ('footer_text', 'جميع الحقوق محفوظة', 'general', 'text', 'Footer Text', 'نص الفوتر', 13),
        ('about_text', 'نقدم أجود أنواع الحلويات الليبية والشرقية المصنوعة بحب واتقان', 'about', 'textarea', 'About Text', 'نص من نحن', 14)
      `
      results.push("site_settings seeded: 14")
    }

    // Site images
    const imgCount = await sql`SELECT count(*) as c FROM site_images`
    if (Number(imgCount[0].c) === 0) {
      await sql`INSERT INTO site_images (image_key, image_url, alt_text, section) VALUES
        ('hero_bg', '/images/hero-bg.jpg', 'خلفية الصفحة الرئيسية', 'hero'),
        ('logo', '/placeholder.svg', 'شعار عالم البكلاوة', 'general'),
        ('about_image', '/placeholder.svg', 'صورة من نحن', 'about'),
        ('menu_bg', '/placeholder.svg', 'خلفية القائمة', 'menu'),
        ('events_bg', '/placeholder.svg', 'خلفية المناسبات', 'events')
      `
      results.push("site_images seeded: 5")
    }

    // Verify
    const tableCheck = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    const counts = await sql`
      SELECT 'products' as tbl, count(*) as cnt FROM products
      UNION ALL SELECT 'product_categories', count(*) FROM product_categories
      UNION ALL SELECT 'delivery_pricing', count(*) FROM delivery_pricing
      UNION ALL SELECT 'site_settings', count(*) FROM site_settings
      UNION ALL SELECT 'site_images', count(*) FROM site_images
    `

    return NextResponse.json({
      success: true,
      results,
      tables: tableCheck.map((t: Record<string, string>) => t.table_name),
      counts: counts.map((c: Record<string, string>) => ({ table: c.tbl, count: c.cnt })),
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Migration error:", msg)
    return NextResponse.json({ success: false, error: msg, results }, { status: 500 })
  }
}
