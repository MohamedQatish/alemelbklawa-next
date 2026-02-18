import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Running auth migration...");

  // Ensure all base tables exist first (idempotent)
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(255),
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `;

  await sql`
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      addons TEXT,
      notes TEXT
    )
  `;

  await sql`
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_pricing (
      id SERIAL PRIMARY KEY,
      city VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL
    )
  `;

  console.log("Base tables ensured.");

  // Add missing columns to users table (safe - uses IF NOT EXISTS pattern)
  const columns = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND table_schema = 'public'
  `;
  const columnNames = columns.map((c) => c.column_name);

  if (!columnNames.includes("password_hash")) {
    await sql`ALTER TABLE users ADD COLUMN password_hash TEXT`;
    console.log("Added password_hash column");
  }

  if (!columnNames.includes("password_plain")) {
    await sql`ALTER TABLE users ADD COLUMN password_plain TEXT`;
    console.log("Added password_plain column");
  }

  if (!columnNames.includes("ip_address")) {
    await sql`ALTER TABLE users ADD COLUMN ip_address VARCHAR(45)`;
    console.log("Added ip_address column");
  }

  // Create user_sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `;
  console.log("Created user_sessions table");

  // Seed delivery pricing (idempotent)
  const cities = [
    { city: "طرابلس", price: 10.0 },
    { city: "مصراتة", price: 25.0 },
    { city: "الخمس", price: 20.0 },
    { city: "درنة", price: 40.0 },
    { city: "صبراتة", price: 15.0 },
    { city: "الزاوية", price: 15.0 },
    { city: "بنغازي", price: 35.0 },
  ];

  for (const { city, price } of cities) {
    await sql`
      INSERT INTO delivery_pricing (city, price)
      VALUES (${city}, ${price})
      ON CONFLICT (city) DO NOTHING
    `;
  }
  console.log("Delivery pricing seeded.");

  console.log("Auth migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
