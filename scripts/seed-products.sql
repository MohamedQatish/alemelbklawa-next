INSERT INTO products (name, price, category, description, image_url, is_available, is_featured, sort_order)
VALUES
-- عصائر (Juices)
('عصير فراولة', 8, 'عصائر', NULL, NULL, true, false, 1),
('عصير مانجو', 8, 'عصائر', NULL, NULL, true, false, 2),
('كركديه', 5, 'عصائر', NULL, NULL, true, false, 3),
('سلطة فواكه', 10, 'عصائر', NULL, NULL, true, false, 4),
('عصير برتقال', 7, 'عصائر', NULL, NULL, true, false, 5),
('كوكتيل', 12, 'عصائر', NULL, NULL, true, false, 6),

-- حلويات ليبية (Libyan Desserts)
('كعك حلو', 15, 'حلويات ليبية', NULL, NULL, true, false, 7),
('كعك مالح', 15, 'حلويات ليبية', NULL, NULL, true, false, 8),
('كعك تمر', 18, 'حلويات ليبية', NULL, NULL, true, false, 9),
('بسكويت تمر', 12, 'حلويات ليبية', NULL, NULL, true, false, 10),
('معمول تمر', 20, 'حلويات ليبية', NULL, NULL, true, false, 11),
('لويزة مكسرات', 25, 'حلويات ليبية', NULL, NULL, true, false, 12),
('لويزة شوكولاتة', 25, 'حلويات ليبية', NULL, NULL, true, false, 13),
('غريبة', 18, 'حلويات ليبية', NULL, NULL, true, false, 14),
('مقروض طرابلسي', 22, 'حلويات ليبية', NULL, NULL, true, true, 15),
('بقلاوة طرابلسية', 30, 'حلويات ليبية', NULL, NULL, true, true, 16),
('عنبمبر', 20, 'حلويات ليبية', NULL, NULL, true, false, 17),
('زلابية', 15, 'حلويات ليبية', NULL, NULL, true, false, 18),
('لقيمات', 12, 'حلويات ليبية', NULL, NULL, true, false, 19),
('بقلاوة حشي', 28, 'حلويات ليبية', NULL, NULL, true, false, 20),

-- حلويات شرقية (Oriental Desserts)
('أصابع زينب', 15, 'حلويات شرقية', NULL, NULL, true, false, 21),
('كنافة جبن', 25, 'حلويات شرقية', NULL, NULL, true, true, 22),
('كنافة نوتيلا', 28, 'حلويات شرقية', NULL, NULL, true, true, 23),
('كنافة نابلسية', 25, 'حلويات شرقية', NULL, NULL, true, false, 24),
('جولاش بالكاسترد', 18, 'حلويات شرقية', NULL, NULL, true, false, 25),
('مشلتت كلاسيك', 20, 'حلويات شرقية', NULL, NULL, true, false, 26),
('مشلتت شوكولاتة', 22, 'حلويات شرقية', NULL, NULL, true, false, 27),
('مشلتت كريمة', 22, 'حلويات شرقية', NULL, NULL, true, false, 28),
('بسبوسة كلاسيك', 15, 'حلويات شرقية', NULL, NULL, true, false, 29),
('بسبوسة شوكولاتة', 18, 'حلويات شرقية', NULL, NULL, true, false, 30),
('بسبوسة كريمة', 18, 'حلويات شرقية', NULL, NULL, true, false, 31),
('بلح الشام', 15, 'حلويات شرقية', NULL, NULL, true, false, 32),
('أم علي', 20, 'حلويات شرقية', NULL, NULL, true, false, 33),
('قطايف', 18, 'حلويات شرقية', NULL, NULL, true, false, 34),

-- كيك (Cakes)
('سان سيباستيان', 45, 'كيك', NULL, NULL, true, true, 35),
('تشيز كيك فراولة', 40, 'كيك', NULL, NULL, true, false, 36),
('تشيز كيك مانجو', 40, 'كيك', NULL, NULL, true, false, 37),
('كيكة برتقال', 35, 'كيك', NULL, NULL, true, false, 38),
('كيكة جزر', 35, 'كيك', NULL, NULL, true, false, 39),

-- تورتة مخصصة (Custom Torta)
('تورتة فستق', 55, 'تورتة مخصصة', 'حشوة فستق فاخرة', NULL, true, true, 40),
('تورتة أوريو', 50, 'تورتة مخصصة', 'حشوة أوريو كريمية', NULL, true, false, 41),
('تورتة شوكولاتة', 50, 'تورتة مخصصة', 'حشوة شوكولاتة غنية', NULL, true, false, 42),
('تورتة شوكولاتة وكراميل', 55, 'تورتة مخصصة', 'حشوة شوكولاتة وكراميل', NULL, true, false, 43)
ON CONFLICT DO NOTHING;
