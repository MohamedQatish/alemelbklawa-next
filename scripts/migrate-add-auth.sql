-- Create base tables (idempotent)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  address TEXT,
  password_hash TEXT,
  password_plain TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  addons TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_pricing (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Add missing columns to users if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_plain') THEN
    ALTER TABLE users ADD COLUMN password_plain TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ip_address') THEN
    ALTER TABLE users ADD COLUMN ip_address VARCHAR(45);
  END IF;
END $$;

-- Seed delivery pricing
INSERT INTO delivery_pricing (city, price) VALUES ('طرابلس', 10.00) ON CONFLICT (city) DO NOTHING;
INSERT INTO delivery_pricing (city, price) VALUES ('مصراتة', 25.00) ON CONFLICT (city) DO NOTHING;
INSERT INTO delivery_pricing (city, price) VALUES ('الخمس', 20.00) ON CONFLICT (city) DO NOTHING;
INSERT INTO delivery_pricing (city, price) VALUES ('درنة', 40.00) ON CONFLICT (city) DO NOTHING;
INSERT INTO delivery_pricing (city, price) VALUES ('صبراتة', 15.00) ON CONFLICT (city) DO NOTHING;
INSERT INTO delivery_pricing (city, price) VALUES ('الزاوية', 15.00) ON CONFLICT (city) DO NOTHING;
INSERT INTO delivery_pricing (city, price) VALUES ('بنغازي', 35.00) ON CONFLICT (city) DO NOTHING;
