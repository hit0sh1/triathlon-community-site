-- Migration: Slack-like Board System
-- Creates new tables for channels, messages, reactions, mentions, and notifications

-- 1. Create channels table (チャンネル)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES board_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create messages table (メッセージ - チャンネル投稿とスレッド返信を統一)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- NULL=チャンネル直接投稿
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('channel', 'thread_reply')) NOT NULL,
  
  -- 既存機能の継承
  like_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  deleted_by_id UUID REFERENCES profiles(id),
  deletion_reason_id UUID REFERENCES deletion_reasons(id),
  deletion_custom_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create reactions table (リアクション)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji_code TEXT NOT NULL, -- 例: 'thumbs_up', 'heart', 'smile'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji_code)
);

-- 4. Create mentions table (メンション)
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create notifications table (通知)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('reply', 'mention', 'reaction')) NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX idx_channels_category_id ON channels(category_id);
CREATE INDEX idx_channels_sort_order ON channels(sort_order);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_author_id ON messages(author_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_reactions_message_id ON reactions(message_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_mentions_message_id ON mentions(message_id);
CREATE INDEX idx_mentions_mentioned_user_id ON mentions(mentioned_user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- 7. Add RLS (Row Level Security) policies
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Channels policies
CREATE POLICY "Channels are viewable by everyone" ON channels FOR SELECT USING (true);
CREATE POLICY "Only admins can create channels" ON channels FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update channels" ON channels FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can delete channels" ON channels FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Messages policies
CREATE POLICY "Messages are viewable by everyone (except deleted)" ON messages FOR SELECT USING (
  deleted_at IS NULL OR 
  author_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Authenticated users can create messages" ON messages FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (
  author_id = auth.uid() AND deleted_at IS NULL
);
CREATE POLICY "Users can delete their own messages, admins can delete any" ON messages FOR UPDATE USING (
  author_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions" ON reactions FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);
CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (
  user_id = auth.uid()
);

-- Mentions policies
CREATE POLICY "Mentions are viewable by everyone" ON mentions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create mentions" ON mentions FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- 8. Create trigger functions for automatic operations
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notifications for replies and mentions
CREATE OR REPLACE FUNCTION create_message_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for thread replies
  IF NEW.message_type = 'thread_reply' AND NEW.thread_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, message_id)
    SELECT DISTINCT m.author_id, 'reply', NEW.id
    FROM messages m
    WHERE m.id = NEW.thread_id AND m.author_id != NEW.author_id;
  END IF;
  
  -- Create notifications for mentions will be handled by the application
  -- when parsing @mentions in the content
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_message_notifications_trigger 
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_message_notifications();

-- 9. Insert some sample data for testing
-- Sample channels for existing categories
INSERT INTO channels (category_id, name, description, sort_order, created_by_id)
SELECT 
  bc.id,
  CASE 
    WHEN bc.name = '一般' THEN '雑談'
    WHEN bc.name = 'トレーニング' THEN 'トレーニング相談'
    WHEN bc.name = '大会情報' THEN '大会レポート'
    WHEN bc.name = 'ギア・装備' THEN 'ギア相談'
    ELSE 'general'
  END as channel_name,
  CASE 
    WHEN bc.name = '一般' THEN '何でも気軽にお話しください'
    WHEN bc.name = 'トレーニング' THEN 'トレーニングに関する質問や相談'
    WHEN bc.name = '大会情報' THEN '大会の感想やレポートをシェア'
    WHEN bc.name = 'ギア・装備' THEN 'ギアや装備に関する相談'
    ELSE 'General discussion channel'
  END as description,
  0 as sort_order,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) as created_by_id
FROM board_categories bc
WHERE bc.name IN ('一般', 'トレーニング', '大会情報', 'ギア・装備')
ORDER BY bc.created_at;

COMMENT ON TABLE channels IS 'Slack-like channels within board categories';
COMMENT ON TABLE messages IS 'Unified messages table for both channel posts and thread replies';
COMMENT ON TABLE reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE mentions IS 'User mentions in messages';
COMMENT ON TABLE notifications IS 'Real-time notifications for users';