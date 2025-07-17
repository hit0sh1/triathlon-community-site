-- Supabase テーブルスキーマ設計
-- 沖縄トライアスロンコミュニティサイト

-- ユーザープロフィール拡張
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  joined_date TIMESTAMPTZ DEFAULT NOW(),
  total_distance DECIMAL(10, 2) DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  achievement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- コース情報
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('ラン', 'バイク', 'スイム')),
  distance DECIMAL(10, 2) NOT NULL, -- km単位
  area TEXT NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  elevation_gain INTEGER,
  map_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- コース写真
CREATE TABLE course_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- コースコメント
CREATE TABLE course_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板カテゴリ
CREATE TABLE board_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT, -- HEX color code
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板投稿
CREATE TABLE board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES board_categories(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 掲示板返信
CREATE TABLE board_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES board_replies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カフェ情報
CREATE TABLE cafes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  hours TEXT,
  has_bike_rack BOOLEAN DEFAULT FALSE,
  has_shower BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  map_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カフェメニュー
CREATE TABLE cafe_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- カフェレビュー
CREATE TABLE cafe_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cafe_id, user_id)
);

-- カフェ投稿
CREATE TABLE cafe_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カフェ投稿のコメント
CREATE TABLE cafe_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES cafe_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カフェ投稿のいいね
CREATE TABLE cafe_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES cafe_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 大会情報
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('トライアスロン', 'マラソン', 'サイクリング', 'スイム', 'ラン')),
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  entry_status TEXT CHECK (entry_status IN ('エントリー受付中', 'エントリー終了', 'エントリー開始前')),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  entry_fee TEXT,
  entry_deadline DATE,
  entry_url TEXT,
  image_url TEXT,
  website_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 大会距離設定
CREATE TABLE event_distances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  discipline TEXT CHECK (discipline IN ('swim', 'bike', 'run')),
  distance TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 大会スケジュール
CREATE TABLE event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  time_slot TIME NOT NULL,
  event_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 大会エイドステーション
CREATE TABLE event_aid_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  items TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 大会レビュー
CREATE TABLE event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  participation_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 大会過去成績
CREATE TABLE event_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  men_winner_time TEXT,
  women_winner_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- フォトギャラリー
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  category TEXT CHECK (category IN ('大会', '練習')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ギャラリー写真タグ
CREATE TABLE gallery_photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES gallery_photos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ギャラリー写真コメント
CREATE TABLE gallery_photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES gallery_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- トレーニングログ
CREATE TABLE training_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('ラン', 'バイク', 'スイム')),
  distance DECIMAL(10, 2), -- km単位
  duration INTERVAL,
  pace TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- トレーニング目標
CREATE TABLE training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  goal_type TEXT CHECK (goal_type IN ('ラン', 'バイク', 'スイム')),
  target_distance DECIMAL(8, 2),
  target_period TEXT CHECK (target_period IN ('週間', '月間', '年間')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー実績
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  achievement_date DATE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 月間サマリー（ビューまたは集計テーブル）
CREATE VIEW monthly_training_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  activity_type,
  SUM(distance) as total_distance,
  COUNT(*) as activity_count,
  SUM(EXTRACT(EPOCH FROM duration) / 3600) as total_hours
FROM training_logs
GROUP BY user_id, DATE_TRUNC('month', date), activity_type;

-- ギアカテゴリ
CREATE TABLE gear_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

-- ギアレビュー
CREATE TABLE gear_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES gear_categories(id),
  user_id UUID REFERENCES profiles(id),
  product_name TEXT NOT NULL,
  brand TEXT,
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  price TEXT,
  image_url TEXT,
  summary TEXT,
  detailed_review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ギアレビューの良い点
CREATE TABLE gear_review_pros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES gear_reviews(id) ON DELETE CASCADE,
  pro_point TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ギアレビューの悪い点
CREATE TABLE gear_review_cons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES gear_reviews(id) ON DELETE CASCADE,
  con_point TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- いいね管理
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  target_type TEXT CHECK (target_type IN ('post', 'photo', 'review')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- 初期データ挿入
INSERT INTO board_categories (name, description, color, sort_order) VALUES
  ('初心者質問', 'トライアスロンを始めたい方の質問コーナー', '#3B82F6', 1),
  ('練習仲間募集', '一緒に練習する仲間を見つけよう', '#10B981', 2),
  ('大会情報', '大会の情報交換', '#F59E0B', 3),
  ('雑談', '自由な話題でコミュニケーション', '#8B5CF6', 4);

INSERT INTO gear_categories (name, sort_order) VALUES
  ('トライスーツ', 1),
  ('バイク', 2),
  ('シューズ', 3),
  ('ウォッチ', 4),
  ('スイムギア', 5),
  ('補給食', 6);

-- インデックス
CREATE INDEX idx_courses_type ON courses(type);
CREATE INDEX idx_courses_area ON courses(area);
CREATE INDEX idx_courses_featured ON courses(is_featured);
CREATE INDEX idx_board_posts_category ON board_posts(category_id);
CREATE INDEX idx_board_posts_created ON board_posts(created_at DESC);
CREATE INDEX idx_board_posts_author ON board_posts(author_id);
CREATE INDEX idx_board_replies_post ON board_replies(post_id);
CREATE INDEX idx_cafes_area ON cafes(area);
CREATE INDEX idx_cafe_posts_cafe ON cafe_posts(cafe_id);
CREATE INDEX idx_cafe_posts_user ON cafe_posts(user_id);
CREATE INDEX idx_cafe_posts_created ON cafe_posts(created_at DESC);
CREATE INDEX idx_cafe_post_comments_post ON cafe_post_comments(post_id);
CREATE INDEX idx_cafe_post_likes_post ON cafe_post_likes(post_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_status ON events(entry_status);
CREATE INDEX idx_gallery_photos_category ON gallery_photos(category);
CREATE INDEX idx_gallery_photos_user ON gallery_photos(user_id);
CREATE INDEX idx_training_logs_user_date ON training_logs(user_id, date);
CREATE INDEX idx_training_logs_type ON training_logs(activity_type);
CREATE INDEX idx_gear_reviews_category ON gear_reviews(category_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー例（必要に応じて調整）
-- 読み取りは全員可能
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Courses are viewable by everyone" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Board posts are viewable by everyone" ON board_posts
  FOR SELECT USING (true);

CREATE POLICY "Board replies are viewable by everyone" ON board_replies
  FOR SELECT USING (true);

CREATE POLICY "Cafes are viewable by everyone" ON cafes
  FOR SELECT USING (true);

CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Gallery photos are viewable by everyone" ON gallery_photos
  FOR SELECT USING (true);

CREATE POLICY "Gear reviews are viewable by everyone" ON gear_reviews
  FOR SELECT USING (true);

-- 作成・更新は認証済みユーザーのみ
CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can create courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own courses" ON courses
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create board posts" ON board_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own board posts" ON board_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create board replies" ON board_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own board replies" ON board_replies
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can view their own training logs" ON training_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training logs" ON training_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training logs" ON training_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own training goals" ON training_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training goals" ON training_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can upload gallery photos" ON gallery_photos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own gallery photos" ON gallery_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery photos" ON gallery_photos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create gear reviews" ON gear_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own gear reviews" ON gear_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- カフェ投稿のRLSポリシー
CREATE POLICY "Cafe posts are viewable by everyone" ON cafe_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create cafe posts" ON cafe_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own cafe posts" ON cafe_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cafe posts" ON cafe_posts
  FOR DELETE USING (auth.uid() = user_id);

-- カフェ投稿コメントのRLSポリシー
CREATE POLICY "Cafe post comments are viewable by everyone" ON cafe_post_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create cafe post comments" ON cafe_post_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own cafe post comments" ON cafe_post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cafe post comments" ON cafe_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- カフェ投稿いいねのRLSポリシー
CREATE POLICY "Cafe post likes are viewable by everyone" ON cafe_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create cafe post likes" ON cafe_post_likes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own cafe post likes" ON cafe_post_likes
  FOR DELETE USING (auth.uid() = user_id);