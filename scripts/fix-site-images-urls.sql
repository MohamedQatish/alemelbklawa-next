-- Fix site_images: set hero_bg to the real image path
UPDATE site_images SET image_url = '/images/hero-bg.jpg' WHERE image_key = 'hero_bg';
