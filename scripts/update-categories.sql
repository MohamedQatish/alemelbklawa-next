-- Migration: Remove categories (Baklava, Maamoul, Western Sweets, Gift Boxes)
-- and rename event categories (Weddings->Libyan Sweets, Trays->Eastern Sweets, Occasions is not present but handle generically)

-- 1. Delete products belonging to removed categories
DELETE FROM products WHERE category IN ('بقلاوة', 'معمول', 'حلويات غربية');

-- 2. Delete product_categories for removed categories
DELETE FROM product_categories WHERE name IN ('بقلاوة', 'معمول', 'حلويات غربية');
DELETE FROM product_categories WHERE label_ar IN ('بقلاوة', 'معمول', 'حلويات غربية');

-- 3. Delete events belonging to Gift Boxes category
DELETE FROM events WHERE category = 'علب هدايا';

-- 4. Rename event categories:
--    أعراس (Weddings) -> حلويات ليبية (Libyan Sweets)
UPDATE events SET category = 'حلويات ليبية' WHERE category = 'أعراس';

--    صواني مناسبات (Trays) -> حلويات شرقية (Eastern Sweets)
UPDATE events SET category = 'حلويات شرقية' WHERE category = 'صواني مناسبات';

-- 5. Update any order_items that reference old categories (for historical records)
UPDATE order_items SET category = 'حلويات ليبية' WHERE category = 'أعراس';
UPDATE order_items SET category = 'حلويات شرقية' WHERE category = 'صواني مناسبات';
