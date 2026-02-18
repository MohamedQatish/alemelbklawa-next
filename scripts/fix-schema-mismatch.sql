
ALTER TABLE delivery_pricing RENAME COLUMN city TO city_name;
ALTER TABLE delivery_pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE delivery_pricing ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE product_categories RENAME COLUMN icon_key TO icon;

UPDATE delivery_pricing SET sort_order = id WHERE sort_order = 0;