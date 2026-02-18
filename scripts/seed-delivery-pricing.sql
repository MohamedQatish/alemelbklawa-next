INSERT INTO delivery_pricing (city, price) VALUES
  ('طرابلس', 10),
  ('مصراتة', 25),
  ('الخمس', 20),
  ('درنة', 40),
  ('صبراتة', 15),
  ('الزاوية', 15),
  ('بنغازي', 35)
ON CONFLICT DO NOTHING;
