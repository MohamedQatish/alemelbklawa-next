-- Add location column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
