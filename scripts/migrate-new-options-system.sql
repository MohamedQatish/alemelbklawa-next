-- =========================================
-- NEW PRODUCT OPTION GROUPS (Per Product)
-- =========================================

CREATE TABLE IF NOT EXISTS product_option_groups_v2 (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  selection_type VARCHAR(20) DEFAULT 'single', -- single | multiple
  min_select INT DEFAULT 1,
  max_select INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_option_groups_v2_product
ON product_option_groups_v2(product_id);

-- =========================================
-- NEW PRODUCT OPTIONS (Clean Pricing)
-- =========================================

CREATE TABLE IF NOT EXISTS product_options_v2 (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES product_option_groups_v2(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  replace_base_price BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_v2_group
ON product_options_v2(group_id);

-- =========================================
-- ORDER ITEMS STRUCTURE UPDATE
-- =========================================

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS selected_options JSONB;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_price_snapshot NUMERIC(10,2);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS final_price_snapshot NUMERIC(10,2);