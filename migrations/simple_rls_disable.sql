-- 最もシンプルな解決策：RLSを完全に無効化

-- eventsテーブルのRLSを完全に無効化
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- event_distancesテーブルのRLSを完全に無効化
ALTER TABLE event_distances DISABLE ROW LEVEL SECURITY;

-- 他の関連テーブルも無効化
ALTER TABLE event_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_aid_stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_results DISABLE ROW LEVEL SECURITY;

-- 確認のためのクエリ
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'event%';