CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(200),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Update admin_sessions to link to admin_users
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_user_id INTEGER REFERENCES admin_users(id);
