-- テスト完了後、適切なRLSポリシーを設定

-- RLSを有効化
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_distances ENABLE ROW LEVEL SECURITY;

-- eventsテーブルのRLSポリシーを設定
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- event_distancesテーブルのRLSポリシーを設定
CREATE POLICY "Event distances are viewable by everyone" ON event_distances
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create event distances" ON event_distances
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own event distances" ON event_distances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own event distances" ON event_distances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_distances.event_id 
      AND events.created_by = auth.uid()
    )
  );