-- Add independent price column to product_options
ALTER TABLE product_options ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Migrate any existing options: copy price_modifier to price as a starting value
-- (Admin should then set the correct independent prices via the dashboard)
UPDATE product_options SET price = price_modifier WHERE price = 0 AND price_modifier != 0;
