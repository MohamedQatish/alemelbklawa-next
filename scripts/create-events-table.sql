-- Create events table for event/occasion packages
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_sort ON events(sort_order);
CREATE INDEX IF NOT EXISTS idx_events_available ON events(is_available);

-- Seed with existing event data
INSERT INTO events (name, price, category, sort_order) VALUES
  ('بقلاوة', 30, 'حلويات', 1),
  ('عنبمبر', 20, 'حلويات', 2),
  ('مقروض', 22, 'حلويات', 3),
  ('كنافة جبن', 25, 'حلويات شرقية', 1),
  ('كنافة نوتيلا', 28, 'حلويات شرقية', 2),
  ('كنافة نابلسية', 25, 'حلويات شرقية', 3),
  ('عصير فراولة', 8, 'عصائر', 1),
  ('عصير مانجو', 8, 'عصائر', 2),
  ('روزاتا', 10, 'عصائر', 3)
ON CONFLICT DO NOTHING;
