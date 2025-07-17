-- 返信いいねテーブル
CREATE TABLE IF NOT EXISTS board_reply_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID REFERENCES board_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id) -- 同じユーザーは同じ返信に1回しかいいねできない
);

-- 返信テーブルにいいね数カラムを追加
ALTER TABLE board_replies ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 返信のいいね数を取得する関数
CREATE OR REPLACE FUNCTION get_reply_like_count(reply_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT COUNT(*) FROM board_reply_likes WHERE reply_id = reply_uuid), 0);
END;
$$ LANGUAGE plpgsql;

-- 返信削除時の権限チェック（投稿者のみ削除可能）
ALTER TABLE board_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete their own replies" ON board_replies
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view replies" ON board_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON board_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- いいねテーブルのRLS
ALTER TABLE board_reply_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON board_reply_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON board_reply_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON board_reply_likes
  FOR DELETE USING (auth.uid() = user_id);