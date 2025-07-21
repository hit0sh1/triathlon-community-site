-- 削除理由とアクションログのためのテーブル作成

-- 削除理由カテゴリーテーブル
CREATE TABLE deletion_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- デフォルトの削除理由を挿入
INSERT INTO deletion_reasons (name, description, severity) VALUES 
  ('スパム', 'スパムまたは不適切な商業コンテンツ', 'high'),
  ('規約違反', 'コミュニティガイドラインまたは利用規約の違反', 'high'),
  ('不適切なコンテンツ', '不快または不適切な内容', 'medium'),
  ('誤情報', '虚偽または誤解を招く情報', 'medium'),
  ('重複投稿', '同じ内容の重複した投稿', 'low'),
  ('トピック外', 'カテゴリーやトピックに関連しない内容', 'low'),
  ('自己削除', 'ユーザー自身による削除', 'low'),
  ('その他', 'その他の理由', 'medium');

-- 削除・アクションログテーブル
CREATE TABLE content_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('delete', 'restore', 'hide', 'warn')),
  content_type TEXT NOT NULL CHECK (content_type IN ('event', 'board_post', 'board_reply', 'column', 'column_comment')),
  content_id UUID NOT NULL,
  content_title TEXT, -- 投稿のタイトル（可能な場合）
  content_author_id UUID REFERENCES profiles(id),
  performed_by_id UUID NOT NULL REFERENCES profiles(id),
  deletion_reason_id UUID REFERENCES deletion_reasons(id),
  custom_reason TEXT, -- カスタム理由
  admin_notes TEXT, -- 管理者メモ
  is_notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 削除カラムに削除者と理由を追加するためのマイグレーション
ALTER TABLE events 
ADD COLUMN deleted_by_id UUID REFERENCES profiles(id),
ADD COLUMN deletion_reason_id UUID REFERENCES deletion_reasons(id),
ADD COLUMN deletion_custom_reason TEXT;

ALTER TABLE board_posts 
ADD COLUMN deleted_by_id UUID REFERENCES profiles(id),
ADD COLUMN deletion_reason_id UUID REFERENCES deletion_reasons(id),
ADD COLUMN deletion_custom_reason TEXT;

ALTER TABLE board_replies 
ADD COLUMN deleted_by_id UUID REFERENCES profiles(id),
ADD COLUMN deletion_reason_id UUID REFERENCES deletion_reasons(id),
ADD COLUMN deletion_custom_reason TEXT;

ALTER TABLE columns 
ADD COLUMN deleted_by_id UUID REFERENCES profiles(id),
ADD COLUMN deletion_reason_id UUID REFERENCES deletion_reasons(id),
ADD COLUMN deletion_custom_reason TEXT;

ALTER TABLE column_comments 
ADD COLUMN deleted_by_id UUID REFERENCES profiles(id),
ADD COLUMN deletion_reason_id UUID REFERENCES deletion_reasons(id),
ADD COLUMN deletion_custom_reason TEXT;

-- インデックス追加
CREATE INDEX idx_content_action_logs_content ON content_action_logs(content_type, content_id);
CREATE INDEX idx_content_action_logs_author ON content_action_logs(content_author_id);
CREATE INDEX idx_content_action_logs_performed_by ON content_action_logs(performed_by_id);
CREATE INDEX idx_content_action_logs_created_at ON content_action_logs(created_at);

-- RLS ポリシー設定
ALTER TABLE deletion_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_action_logs ENABLE ROW LEVEL SECURITY;

-- 削除理由は全ユーザーが閲覧可能
CREATE POLICY "Everyone can read deletion reasons" ON deletion_reasons
  FOR SELECT USING (is_active = true);

-- アクションログは関係者のみ閲覧可能
CREATE POLICY "Users can read their own action logs" ON content_action_logs
  FOR SELECT USING (
    content_author_id = auth.uid() OR 
    performed_by_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- アクションログは管理者のみ作成・更新可能
CREATE POLICY "Admins can manage action logs" ON content_action_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );