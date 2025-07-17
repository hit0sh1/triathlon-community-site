-- コース評価テーブルを作成
CREATE TABLE course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 一人のユーザーが同じコースに複数の評価をつけることを防ぐ
  UNIQUE(course_id, user_id)
);

-- インデックスを作成（パフォーマンス向上のため）
CREATE INDEX idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX idx_course_ratings_user_id ON course_ratings(user_id);
CREATE INDEX idx_course_ratings_rating ON course_ratings(rating);

-- RLSポリシーを設定
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;

-- 誰でも評価を読める
CREATE POLICY "Anyone can view course ratings" 
ON course_ratings FOR SELECT 
USING (true);

-- ログインユーザーは評価を作成できる
CREATE POLICY "Authenticated users can create course ratings" 
ON course_ratings FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- ユーザーは自分の評価を更新できる
CREATE POLICY "Users can update their own course ratings" 
ON course_ratings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の評価を削除できる
CREATE POLICY "Users can delete their own course ratings" 
ON course_ratings FOR DELETE 
USING (auth.uid() = user_id);

-- coursesテーブルに平均評価と評価数のカラムを追加
ALTER TABLE courses 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN rating_count INTEGER DEFAULT 0;

-- 評価の平均と数を計算する関数
CREATE OR REPLACE FUNCTION update_course_rating_stats(course_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses 
  SET 
    average_rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM course_ratings 
      WHERE course_id = course_uuid
    ), 0),
    rating_count = COALESCE((
      SELECT COUNT(*) 
      FROM course_ratings 
      WHERE course_id = course_uuid
    ), 0)
  WHERE id = course_uuid;
END;
$$ LANGUAGE plpgsql;

-- 評価が挿入・更新・削除されたときに統計を更新するトリガー
CREATE OR REPLACE FUNCTION update_course_rating_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_course_rating_stats(OLD.course_id);
    RETURN OLD;
  ELSE
    PERFORM update_course_rating_stats(NEW.course_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_course_rating_stats_trigger();