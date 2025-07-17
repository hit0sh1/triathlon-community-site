-- eventsテーブルのRLSポリシーを追加

-- 認証済みユーザーがeventsを作成できるポリシー
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ユーザーが自分の作成したeventsを更新できるポリシー
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- ユーザーが自分の作成したeventsを削除できるポリシー
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- event_distancesテーブルのRLSポリシーを追加
ALTER TABLE event_distances ENABLE ROW LEVEL SECURITY;

-- 誰でもevent_distancesを閲覧できるポリシー
CREATE POLICY "Event distances are viewable by everyone" ON event_distances
  FOR SELECT USING (true);

-- 認証済みユーザーがevent_distancesを作成できるポリシー（イベント作成者のみ）
CREATE POLICY "Authenticated users can create event distances" ON event_distances
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- ユーザーが自分のイベントのevent_distancesを更新できるポリシー
CREATE POLICY "Users can update their own event distances" ON event_distances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- ユーザーが自分のイベントのevent_distancesを削除できるポリシー
CREATE POLICY "Users can delete their own event distances" ON event_distances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );