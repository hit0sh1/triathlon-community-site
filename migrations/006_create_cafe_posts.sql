-- カフェ投稿テーブルの作成
CREATE TABLE IF NOT EXISTS cafe_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  opening_hours TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  tags TEXT[],
  wifi_available BOOLEAN DEFAULT FALSE,
  bike_parking BOOLEAN DEFAULT FALSE,
  has_power_outlet BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- カフェレビューテーブルの作成
CREATE TABLE IF NOT EXISTS cafe_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_post_id UUID NOT NULL REFERENCES cafe_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(cafe_post_id, user_id)
);

-- カフェお気に入りテーブルの作成
CREATE TABLE IF NOT EXISTS cafe_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_post_id UUID NOT NULL REFERENCES cafe_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(cafe_post_id, user_id)
);

-- インデックスの作成
CREATE INDEX idx_cafe_posts_user_id ON cafe_posts(user_id);
CREATE INDEX idx_cafe_posts_location ON cafe_posts(latitude, longitude);
CREATE INDEX idx_cafe_posts_created_at ON cafe_posts(created_at DESC);
CREATE INDEX idx_cafe_posts_approved ON cafe_posts(is_approved);
CREATE INDEX idx_cafe_reviews_cafe_post_id ON cafe_reviews(cafe_post_id);
CREATE INDEX idx_cafe_reviews_user_id ON cafe_reviews(user_id);
CREATE INDEX idx_cafe_favorites_cafe_post_id ON cafe_favorites(cafe_post_id);
CREATE INDEX idx_cafe_favorites_user_id ON cafe_favorites(user_id);

-- RLSポリシーの有効化
ALTER TABLE cafe_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_favorites ENABLE ROW LEVEL SECURITY;

-- カフェ投稿のRLSポリシー
CREATE POLICY "Anyone can view approved cafe posts" ON cafe_posts
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own cafe posts" ON cafe_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create cafe posts" ON cafe_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cafe posts" ON cafe_posts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cafe posts" ON cafe_posts
  FOR DELETE USING (auth.uid() = user_id);

-- カフェレビューのRLSポリシー
CREATE POLICY "Anyone can view reviews" ON cafe_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON cafe_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON cafe_reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON cafe_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- カフェお気に入りのRLSポリシー
CREATE POLICY "Users can view their own favorites" ON cafe_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create favorites" ON cafe_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON cafe_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_cafe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cafe_posts_updated_at
  BEFORE UPDATE ON cafe_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_updated_at();

CREATE TRIGGER update_cafe_reviews_updated_at
  BEFORE UPDATE ON cafe_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_cafe_updated_at();

-- カフェ投稿の統計情報を取得するビュー
CREATE OR REPLACE VIEW cafe_stats AS
SELECT 
  cp.id,
  cp.title,
  cp.description,
  cp.address,
  cp.phone,
  cp.website,
  cp.opening_hours,
  cp.latitude,
  cp.longitude,
  cp.image_url,
  cp.tags,
  cp.wifi_available,
  cp.bike_parking,
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
         cp.opening_hours, cp.latitude, cp.longitude, cp.image_url, cp.tags,
         cp.wifi_available, cp.bike_parking, cp.has_power_outlet, cp.is_approved,
         cp.user_id, cp.created_at, cp.updated_at;