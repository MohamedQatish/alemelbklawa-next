-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(150) NOT NULL,
  icon_key VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_option_groups table (e.g. "الوزن", "الحجم", "الكمية")
CREATE TABLE IF NOT EXISTS product_option_groups (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES product_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_options table (individual options with prices)
CREATE TABLE IF NOT EXISTS product_options (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES product_option_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_option_assignments (link products to option groups)
CREATE TABLE IF NOT EXISTS product_option_assignments (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  option_group_id INT REFERENCES product_option_groups(id) ON DELETE CASCADE,
  UNIQUE(product_id, option_group_id)
);

-- Add category_id to products table to link to new categories
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT REFERENCES product_categories(id);

-- Seed the default categories
INSERT INTO product_categories (name, label, icon_key, sort_order) VALUES
  ('عصائر', 'عصائر طبيعية', 'juices', 1),
  ('حلويات ليبية', 'حلويات ليبية', 'libyan', 2),
  ('حلويات شرقية', 'حلويات شرقية', 'oriental', 3),
  ('كيك', 'كيك وتورتات', 'cakes', 4),
  ('تورتة مخصصة', 'تورتات مخصصة', 'torta', 5)
ON CONFLICT (name) DO NOTHING;

-- Link existing products to their categories
UPDATE products SET category_id = pc.id
FROM product_categories pc
WHERE products.category = pc.name AND products.category_id IS NULL;

-- Seed default option groups for sweets (weight-based)
INSERT INTO product_option_groups (category_id, name, sort_order)
SELECT pc.id, 'الوزن', 1
FROM product_categories pc
WHERE pc.name IN ('حلويات ليبية', 'حلويات شرقية')
ON CONFLICT DO NOTHING;

-- Seed default option groups for cakes (weight-based)
INSERT INTO product_option_groups (category_id, name, sort_order)
SELECT pc.id, 'الوزن', 1
FROM product_categories pc
WHERE pc.name IN ('كيك', 'تورتة مخصصة')
ON CONFLICT DO NOTHING;

-- Seed default option groups for juices (size-based)
INSERT INTO product_option_groups (category_id, name, sort_order)
SELECT pc.id, 'الحجم', 1
FROM product_categories pc
WHERE pc.name = 'عصائر'
ON CONFLICT DO NOTHING;
