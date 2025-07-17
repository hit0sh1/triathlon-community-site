-- coursesテーブルのRLSを強制的に無効化

-- 全てのRLSポリシーを削除
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;

-- RLSを完全に無効化
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 同様に関連テーブルも無効化
DROP POLICY IF EXISTS "Course photos are viewable by everyone" ON course_photos;
DROP POLICY IF EXISTS "Authenticated users can create course photos" ON course_photos;
DROP POLICY IF EXISTS "Users can update their own course photos" ON course_photos;
DROP POLICY IF EXISTS "Users can delete their own course photos" ON course_photos;

ALTER TABLE course_photos DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Course comments are viewable by everyone" ON course_comments;
DROP POLICY IF EXISTS "Authenticated users can create course comments" ON course_comments;
DROP POLICY IF EXISTS "Users can update their own course comments" ON course_comments;
DROP POLICY IF EXISTS "Users can delete their own course comments" ON course_comments;

ALTER TABLE course_comments DISABLE ROW LEVEL SECURITY;

-- 確認のためのクエリ
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'course%'
ORDER BY tablename;

-- 現在のRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename LIKE 'course%'
ORDER BY tablename, policyname;