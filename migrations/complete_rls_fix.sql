-- eventsテーブルのRLS問題を完全に解決

-- まず、全てのRLSポリシーを削除
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- RLSを一度完全に無効化
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 再度有効化
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 新しいポリシーを設定
-- 1. 全員が閲覧可能
CREATE POLICY "events_select_policy" ON events
  FOR SELECT USING (true);

-- 2. 認証済みユーザーが作成可能（シンプルなポリシー）
CREATE POLICY "events_insert_policy" ON events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 3. 作成者のみが更新可能
CREATE POLICY "events_update_policy" ON events
  FOR UPDATE USING (
    auth.uid() = created_by
  );

-- 4. 作成者のみが削除可能
CREATE POLICY "events_delete_policy" ON events
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- event_distancesテーブルも同様に処理
DROP POLICY IF EXISTS "Event distances are viewable by everyone" ON event_distances;
DROP POLICY IF EXISTS "Authenticated users can create event distances" ON event_distances;
DROP POLICY IF EXISTS "Users can update their own event distances" ON event_distances;
DROP POLICY IF EXISTS "Users can delete their own event distances" ON event_distances;

ALTER TABLE event_distances DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_distances ENABLE ROW LEVEL SECURITY;

-- event_distancesのポリシー
CREATE POLICY "event_distances_select_policy" ON event_distances
  FOR SELECT USING (true);

CREATE POLICY "event_distances_insert_policy" ON event_distances
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "event_distances_update_policy" ON event_distances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "event_distances_delete_policy" ON event_distances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );