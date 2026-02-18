CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  hours VARCHAR(100),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing branch data
INSERT INTO branches (name, address, phone, hours, latitude, longitude, sort_order)
VALUES
  ('فرع النوفليين', 'النوفليين - شارع صحنة الحسناء', '0920001171', '10:00 ص - 12:00 م', 32.8872, 13.1803, 1),
  ('فرع سوق الجمعة', 'سوق الجمعة - مركز الشرطة', '0925006674', '10:00 ص - 12:00 م', 32.9017, 13.1569, 2),
  ('فرع السراج', 'السراج - بجانب مماش', '0922777878', '10:00 ص - 12:00 م', 32.8534, 13.0357, 3)
ON CONFLICT DO NOTHING;
