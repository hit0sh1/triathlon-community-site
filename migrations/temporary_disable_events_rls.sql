-- 一時的にeventsテーブルのRLSを無効化（テスト用）
-- 本番環境では使用しないでください
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_distances DISABLE ROW LEVEL SECURITY;

-- 注意: この設定はテスト用のみです
-- 本番環境では適切なRLSポリシーを設定してください