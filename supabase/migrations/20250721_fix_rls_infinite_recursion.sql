-- RLSポリシーの無限再帰を修正

-- 問題のあるポリシーを削除
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON profiles;

-- シンプルなポリシーに変更（無限再帰を避ける）
CREATE POLICY "Users can read all profiles" ON profiles
  FOR SELECT USING (true); -- 全てのユーザーがprofilesを読み取り可能

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (profiles.id = auth.uid());

-- admin管理用のポリシーは一旦削除（後で別の方法で実装）