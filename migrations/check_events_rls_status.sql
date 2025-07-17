-- eventsテーブルのRLS設定を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('events', 'event_distances');

-- 現在のRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('events', 'event_distances');

-- 現在のユーザーIDを確認
SELECT auth.uid() as current_user_id;