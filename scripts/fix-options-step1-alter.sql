-- Step 1: Add missing columns
ALTER TABLE product_option_groups ADD COLUMN IF NOT EXISTS label_ar VARCHAR(255);
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS label VARCHAR(255);
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS label_ar VARCHAR(255);
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS price_modifier NUMERIC DEFAULT 0;

-- Backfill existing rows
UPDATE product_option_groups SET label_ar = name WHERE label_ar IS NULL;
UPDATE product_options SET label = name WHERE label IS NULL;
UPDATE product_options SET label_ar = name WHERE label_ar IS NULL;
UPDATE product_options SET price_modifier = COALESCE(price, 0) WHERE price_modifier = 0 OR price_modifier IS NULL;
