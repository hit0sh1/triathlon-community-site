-- 通知テーブルに表示設定を追加
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_notifications_show_on_homepage ON notifications(show_on_homepage);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- 期限切れの通知を自動削除する関数
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 期限切れ通知の自動削除を1時間ごとに実行するためのcronジョブ設定
-- 注意: pg_cronエクステンションが必要です
-- SELECT cron.schedule('delete-expired-notifications', '0 * * * *', 'SELECT delete_expired_notifications();');