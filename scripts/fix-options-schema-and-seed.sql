-- Fix product_option_groups: add label_ar if missing
ALTER TABLE product_option_groups ADD COLUMN IF NOT EXISTS label_ar VARCHAR(255);
UPDATE product_option_groups SET label_ar = name WHERE label_ar IS NULL;

-- Fix product_options: add label, label_ar, price_modifier columns if missing
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS label VARCHAR(255);
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS label_ar VARCHAR(255);
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS price_modifier NUMERIC DEFAULT 0;

-- Migrate existing data: copy name -> label/label_ar, price -> price_modifier
UPDATE product_options SET label = name WHERE label IS NULL;
UPDATE product_options SET label_ar = name WHERE label_ar IS NULL;
UPDATE product_options SET price_modifier = COALESCE(price, 0) WHERE price_modifier = 0 OR price_modifier IS NULL;

-- Now clear existing seeded data and re-seed properly per user requirements
-- Delete old option assignments, options, groups
DELETE FROM product_option_assignments;
DELETE FROM product_options;
DELETE FROM product_option_groups;

-- Get category IDs for juices, libyan sweets, oriental sweets
-- Juices category
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'juice-size', 'الحجم', id, 1 FROM product_categories WHERE name ILIKE '%juice%' OR label_ar ILIKE '%عصائر%' LIMIT 1;

-- Insert juice options
INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '250ml', '250 مل', '250ml', 0, 0, 1
FROM product_option_groups g WHERE g.name = 'juice-size';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '750ml', '750 مل', '750ml', 0, 0, 2
FROM product_option_groups g WHERE g.name = 'juice-size';

-- Libyan Sweets category
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'libyan-sweets-weight', 'الكمية', id, 1 FROM product_categories WHERE name ILIKE '%libyan%' OR label_ar ILIKE '%ليبية%' LIMIT 1;

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, 'piece', 'قطعة', 'piece', 0, 0, 1
FROM product_option_groups g WHERE g.name = 'libyan-sweets-weight';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '1kg', '1 كيلو', '1kg', 0, 0, 2
FROM product_option_groups g WHERE g.name = 'libyan-sweets-weight';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '500g', 'نصف كيلو', '500g', 0, 0, 3
FROM product_option_groups g WHERE g.name = 'libyan-sweets-weight';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '250g', 'ربع كيلو', '250g', 0, 0, 4
FROM product_option_groups g WHERE g.name = 'libyan-sweets-weight';

-- Oriental Sweets category
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'oriental-sweets-weight', 'الكمية', id, 1 FROM product_categories WHERE name ILIKE '%oriental%' OR label_ar ILIKE '%شرقية%' LIMIT 1;

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, 'piece', 'قطعة', 'piece', 0, 0, 1
FROM product_option_groups g WHERE g.name = 'oriental-sweets-weight';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '1kg', '1 كيلو', '1kg', 0, 0, 2
FROM product_option_groups g WHERE g.name = 'oriental-sweets-weight';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '500g', 'نصف كيلو', '500g', 0, 0, 3
FROM product_option_groups g WHERE g.name = 'oriental-sweets-weight';

INSERT INTO product_options (group_id, label, label_ar, name, price, price_modifier, sort_order)
SELECT g.id, '250g', 'ربع كيلو', '250g', 0, 0, 4
FROM product_option_groups g WHERE g.name = 'oriental-sweets-weight';

-- Auto-assign option groups to all products in matching categories
INSERT INTO product_option_assignments (product_id, option_group_id)
SELECT p.id, g.id
FROM products p
JOIN product_categories c ON p.category_id = c.id
JOIN product_option_groups g ON g.category_id = c.id
ON CONFLICT DO NOTHING;
