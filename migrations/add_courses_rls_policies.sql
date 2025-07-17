-- coursesテーブルのRLSポリシーを追加

-- 既存のポリシーを確認して削除
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;

-- coursesテーブルのRLSポリシーを設定
CREATE POLICY "Courses are viewable by everyone" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own courses" ON courses
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own courses" ON courses
  FOR DELETE USING (auth.uid() = created_by);

-- course_photosテーブルのRLSポリシーを追加
ALTER TABLE course_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course photos are viewable by everyone" ON course_photos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create course photos" ON course_photos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own course photos" ON course_photos
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own course photos" ON course_photos
  FOR DELETE USING (auth.uid() = uploaded_by);

-- course_commentsテーブルのRLSポリシーを追加
ALTER TABLE course_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course comments are viewable by everyone" ON course_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create course comments" ON course_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own course comments" ON course_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course comments" ON course_comments
  FOR DELETE USING (auth.uid() = user_id);