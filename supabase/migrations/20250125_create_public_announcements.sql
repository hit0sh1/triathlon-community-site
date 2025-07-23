-- 公開お知らせテーブルの作成
CREATE TABLE IF NOT EXISTS public_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  is_active BOOLEAN DEFAULT true,
  link TEXT, -- お知らせをクリックしたときのリンク先
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックスの作成
CREATE INDEX idx_public_announcements_is_active ON public_announcements(is_active);
CREATE INDEX idx_public_announcements_created_at ON public_announcements(created_at DESC);

-- RLSポリシーの有効化
ALTER TABLE public_announcements ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが公開お知らせを閲覧可能
CREATE POLICY "Anyone can view active public announcements" ON public_announcements
  FOR SELECT USING (is_active = true);

-- 管理者のみが公開お知らせを作成・更新・削除可能
CREATE POLICY "Only admins can manage public announcements" ON public_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 更新日時を自動更新するトリガー
CREATE TRIGGER update_public_announcements_updated_at
  BEFORE UPDATE ON public_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- サンプルお知らせの追加
INSERT INTO public_announcements (title, message, type, is_active) VALUES
('沖縄トライアスロンコミュニティへようこそ！', '沖縄の美しい海と風を感じながら、仲間と共に最高のトレーニング体験をお楽しみください。初心者から上級者まで、みんなが楽しめるコミュニティです。', 'info', true),
('2025年大会カレンダー公開', '2025年の主要なトライアスロン大会のスケジュールを公開しました。エントリー開始日程もあわせてご確認ください。', 'success', true),
('安全なトレーニングのお願い', '海での練習時は必ずバディシステムを守り、天候の変化に十分注意してください。安全第一でトレーニングを楽しみましょう。', 'warning', true);