-- board_repliesテーブルのRLSポリシーを確認・修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can delete their own replies" ON board_replies;
DROP POLICY IF EXISTS "Anyone can view replies" ON board_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON board_replies;

-- 新しいポリシーを作成
CREATE POLICY "Anyone can view replies" ON board_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON board_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies" ON board_replies
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own replies" ON board_replies
  FOR DELETE USING (auth.uid() = author_id);

-- RLSが有効になっているか確認
ALTER TABLE board_replies ENABLE ROW LEVEL SECURITY;