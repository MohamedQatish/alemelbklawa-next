-- Add missing columns to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT '';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS working_hours VARCHAR(100);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Migrate existing 'hours' data into 'working_hours' for any rows that have it
UPDATE branches SET working_hours = hours WHERE hours IS NOT NULL AND working_hours IS NULL;

-- Set city from name for existing branches (best guess)
UPDATE branches SET city = name WHERE city = '' OR city IS NULL;
