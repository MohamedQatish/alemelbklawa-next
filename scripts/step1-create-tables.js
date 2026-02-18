import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("=== STEP 1: DROP & CREATE ALL TABLES ===");

  await sql`DROP TABLE IF EXISTS site_images CASCADE`;
  await sql`DROP TABLE IF EXISTS site_settings CASCADE`;
  await sql`DROP TABLE IF EXISTS reservations CASCADE`;
  await sql`DROP TABLE IF EXISTS product_option_assignments CASCADE`;
  await sql`DROP TABLE IF EXISTS product_options CASCADE`;
  await sql`DROP TABLE IF EXISTS product_option_groups CASCADE`;
  await sql`DROP TABLE IF EXISTS order_items CASCADE`;
  await sql`DROP TABLE IF EXISTS orders CASCADE`;
  await sql`DROP TABLE IF EXISTS products CASCADE`;
  await sql`DROP TABLE IF EXISTS product_categories CASCADE`;
  await sql`DROP TABLE IF EXISTS delivery_pricing CASCADE`;
  await sql`DROP TABLE IF EXISTS branches CASCADE`;
  await sql`DROP TABLE IF EXISTS events CASCADE`;
  await sql`DROP TABLE IF EXISTS admin_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS admin_users CASCADE`;
  await sql`DROP TABLE IF EXISTS user_sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log("All tables dropped");

  await sql`CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, password_hash TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: users");

  await sql`CREATE TABLE user_sessions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, session_token TEXT UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: user_sessions");

  await sql`CREATE TABLE admin_users (id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name VARCHAR(255), role VARCHAR(50) DEFAULT 'admin', permissions JSONB DEFAULT '[]', is_active BOOLEAN DEFAULT true, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: admin_users");

  await sql`CREATE TABLE admin_sessions (id SERIAL PRIMARY KEY, session_token TEXT UNIQUE NOT NULL, expires_at TIMESTAMP NOT NULL, admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: admin_sessions");

  await sql`CREATE TABLE product_categories (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, label_ar VARCHAR(255), icon VARCHAR(100), sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: product_categories");

  await sql`CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0, category VARCHAR(255), category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL, image_url TEXT, is_available BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: products");

  await sql`CREATE TABLE product_option_groups (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, label_ar VARCHAR(255), is_required BOOLEAN DEFAULT false, allow_multiple BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: product_option_groups");

  await sql`CREATE TABLE product_options (id SERIAL PRIMARY KEY, group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, label_ar VARCHAR(255), price_modifier DECIMAL(10,2) DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: product_options");

  await sql`CREATE TABLE product_option_assignments (id SERIAL PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, option_group_id INTEGER REFERENCES product_option_groups(id) ON DELETE CASCADE, UNIQUE(product_id, option_group_id))`;
  console.log("Created: product_option_assignments");

  await sql`CREATE TABLE events (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL DEFAULT 0, category VARCHAR(255), image_url TEXT, is_available BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: events");

  await sql`CREATE TABLE branches (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, address TEXT, phone VARCHAR(50), secondary_phone VARCHAR(50), city VARCHAR(100), google_maps_url TEXT, latitude DECIMAL(10,7), longitude DECIMAL(10,7), working_hours TEXT, image_url TEXT, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: branches");

  await sql`CREATE TABLE delivery_pricing (id SERIAL PRIMARY KEY, city_name VARCHAR(255) NOT NULL, city VARCHAR(255), price DECIMAL(10,2) DEFAULT 0, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: delivery_pricing");

  await sql`CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, customer_name VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, notes TEXT, total_amount DECIMAL(10,2) DEFAULT 0, delivery_fee DECIMAL(10,2) DEFAULT 0, status VARCHAR(50) DEFAULT 'pending', order_type VARCHAR(50) DEFAULT 'delivery', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: orders");

  await sql`CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER, product_name VARCHAR(255), category VARCHAR(255), quantity INTEGER DEFAULT 1, unit_price DECIMAL(10,2) DEFAULT 0, addons JSONB, notes TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: order_items");

  await sql`CREATE TABLE reservations (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, customer_name VARCHAR(255), phone VARCHAR(50), event_type VARCHAR(100), date DATE, time VARCHAR(50), guests INTEGER, notes TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: reservations");

  await sql`CREATE TABLE site_settings (id SERIAL PRIMARY KEY, setting_key VARCHAR(255) UNIQUE NOT NULL, setting_value TEXT DEFAULT '', setting_type VARCHAR(50) DEFAULT 'text', setting_group VARCHAR(100) DEFAULT 'general', label VARCHAR(255) DEFAULT '', label_ar VARCHAR(255) DEFAULT '', description TEXT, sort_order INTEGER DEFAULT 0, updated_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: site_settings");

  await sql`CREATE TABLE site_images (id SERIAL PRIMARY KEY, image_key VARCHAR(255) UNIQUE NOT NULL, image_url TEXT DEFAULT '', alt_text VARCHAR(255) DEFAULT '', is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`;
  console.log("Created: site_images");

  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log("=== " + tables.length + " TABLES CREATED ===");
  for (const t of tables) console.log("  " + t.table_name);
}

run().catch(e => { console.error("FAILED:", e); process.exit(1); });
