-- coursesテーブルのRLS問題を修正

-- RLSを一時的に無効化してテスト
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments DISABLE ROW LEVEL SECURITY;

-- 確認のためのクエリ
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'course%';