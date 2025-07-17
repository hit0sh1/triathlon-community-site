-- カフェ投稿テーブルの更新
-- 緯度・経度の削除とbike_parkingをhas_cycle_rackに変更

-- 新しい列を追加
ALTER TABLE cafe_posts ADD COLUMN IF NOT EXISTS has_cycle_rack BOOLEAN DEFAULT FALSE;

-- 既存のデータを移行
UPDATE cafe_posts SET has_cycle_rack = bike_parking WHERE bike_parking IS NOT NULL;

-- 古い列を削除
ALTER TABLE cafe_posts DROP COLUMN IF EXISTS bike_parking;
ALTER TABLE cafe_posts DROP COLUMN IF EXISTS latitude;
ALTER TABLE cafe_posts DROP COLUMN IF EXISTS longitude;

-- インデックスを削除
DROP INDEX IF EXISTS idx_cafe_posts_location;

-- 統計ビューを更新
DROP VIEW IF EXISTS cafe_stats;

CREATE OR REPLACE VIEW cafe_stats AS
SELECT 
  cp.id,
  cp.title,
  cp.description,
  cp.address,
  cp.phone,
  cp.website,
  cp.opening_hours,
  cp.image_url,
  cp.tags,
  cp.wifi_available,
  cp.has_cycle_rack,
  cp.has_power_outlet,
  cp.is_approved,
  cp.user_id,
  cp.created_at,
  cp.updated_at,
  COALESCE(AVG(cr.rating), 0) AS average_rating,
  COUNT(cr.id) AS review_count,
  COUNT(cf.id) AS favorite_count
FROM cafe_posts cp
LEFT JOIN cafe_reviews cr ON cp.id = cr.cafe_post_id
LEFT JOIN cafe_favorites cf ON cp.id = cf.cafe_post_id
GROUP BY cp.id, cp.title, cp.description, cp.address, cp.phone, cp.website, 
         cp.opening_hours, cp.image_url, cp.tags,
         cp.wifi_available, cp.has_cycle_rack, cp.has_power_outlet, cp.is_approved,
         cp.user_id, cp.created_at, cp.updated_at;