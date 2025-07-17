-- 一時的にeventsテーブルのRLSを無効化してテスト
-- 後で適切なポリシーを設定する必要があります

-- 現在のRLSポリシーを全て削除
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- RLSを一時的に無効化
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- event_distancesテーブルも同様に処理
DROP POLICY IF EXISTS "Event distances are viewable by everyone" ON event_distances;
DROP POLICY IF EXISTS "Authenticated users can create event distances" ON event_distances;
DROP POLICY IF EXISTS "Users can update their own event distances" ON event_distances;
DROP POLICY IF EXISTS "Users can delete their own event distances" ON event_distances;

ALTER TABLE event_distances DISABLE ROW LEVEL SECURITY;

-- 注意: この設定はテスト用のみです
-- 本番環境では適切なRLSポリシーを設定してください
-- テスト完了後は enable_events_rls_properly.sql を実行してください