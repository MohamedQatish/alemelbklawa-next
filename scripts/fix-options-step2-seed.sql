-- Clear old data
DELETE FROM product_option_assignments;
DELETE FROM product_options;
DELETE FROM product_option_groups;

-- Update product_categories to have label_ar populated from label
UPDATE product_categories SET label_ar = label WHERE label_ar IS NULL OR label_ar = '';

-- Insert option groups linked to categories
-- Juices category (عصائر طبيعية)
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'juice_size', 'الحجم', id, 1 FROM product_categories WHERE name = 'عصائر';

-- Libyan sweets (حلويات ليبية)
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'libyan_weight', 'الوزن', id, 1 FROM product_categories WHERE name = 'حلويات ليبية';

-- Oriental sweets (حلويات شرقية)
INSERT INTO product_option_groups (name, label_ar, category_id, sort_order)
SELECT 'oriental_weight', 'الوزن', id, 1 FROM product_categories WHERE name = 'حلويات شرقية';

-- Now insert options for each group
-- Juice sizes
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '250ml', '250ml', '250 مل', 0, 0, 1 FROM product_option_groups WHERE name = 'juice_size';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '500ml', '500ml', '500 مل', 0, 3, 2 FROM product_option_groups WHERE name = 'juice_size';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '750ml', '750ml', '750 مل', 0, 5, 3 FROM product_option_groups WHERE name = 'juice_size';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '1L', '1L', '1 لتر', 0, 8, 4 FROM product_option_groups WHERE name = 'juice_size';

-- Libyan sweets weights
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, 'piece', 'Piece', 'قطعة', 0, 0, 1 FROM product_option_groups WHERE name = 'libyan_weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '250g', '250g', '250 غرام', 0, 5, 2 FROM product_option_groups WHERE name = 'libyan_weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '500g', '500g', '500 غرام', 0, 15, 3 FROM product_option_groups WHERE name = 'libyan_weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '1kg', '1kg', '1 كيلو', 0, 30, 4 FROM product_option_groups WHERE name = 'libyan_weight';

-- Oriental sweets weights
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, 'piece', 'Piece', 'قطعة', 0, 0, 1 FROM product_option_groups WHERE name = 'oriental_weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '250g', '250g', '250 غرام', 0, 5, 2 FROM product_option_groups WHERE name = 'oriental_weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '500g', '500g', '500 غرام', 0, 15, 3 FROM product_option_groups WHERE name = 'oriental_weight';
INSERT INTO product_options (group_id, name, label, label_ar, price, price_modifier, sort_order)
SELECT id, '1kg', '1kg', '1 كيلو', 0, 30, 4 FROM product_option_groups WHERE name = 'oriental_weight';

-- Auto-assign option groups to products based on their category
INSERT INTO product_option_assignments (product_id, option_group_id)
SELECT p.id, og.id
FROM products p
JOIN product_categories pc ON p.category_id = pc.id
JOIN product_option_groups og ON og.category_id = pc.id
WHERE p.category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also assign for products matching category by name (fallback)
INSERT INTO product_option_assignments (product_id, option_group_id)
SELECT p.id, og.id
FROM products p
JOIN product_categories pc ON p.category = pc.name
JOIN product_option_groups og ON og.category_id = pc.id
WHERE p.category_id IS NULL
ON CONFLICT DO NOTHING;
