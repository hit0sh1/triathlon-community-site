# データベースマイグレーションの実行方法

## 1. Supabase CLIを使用した自動実行（推奨）

### リモートプロジェクトにマイグレーションを適用

```bash
# プロジェクトにリンク（初回のみ）
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF

# マイグレーション実行
npx supabase db push
```

### プロジェクトREFの確認方法
1. Supabase Dashboard (https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. Settings > General > Reference ID をコピー

## 2. Supabase Dashboardでの手動実行

### SQL Editorを使用
1. Supabase Dashboard にアクセス
2. 「SQL Editor」を選択
3. 以下のファイルの内容をコピー&ペースト:
   - **最新**: `/supabase/migrations/20250125_add_image_url_to_messages.sql`
   - 過去のマイグレーション: `/supabase/migrations/20250721_add_soft_delete_to_content_tables.sql`
4. 「Run」ボタンをクリック

### 画像添付機能のためのマイグレーション（緊急）
**現在エラーが発生しているため、以下のSQLを最優先で実行してください:**

```sql
-- Add image_url column to messages table
ALTER TABLE messages ADD COLUMN image_url TEXT;

-- Add index for performance
CREATE INDEX idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;

-- Update constraint to allow messages with only images
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add check constraint to ensure either content or image_url is provided
ALTER TABLE messages ADD CONSTRAINT check_content_or_image 
  CHECK (
    (content IS NOT NULL AND content != '') OR 
    (image_url IS NOT NULL AND image_url != '')
  );
```

## 3. 実行されるSQL内容

マイグレーションにより以下のカラムが追加されます:

### 対象テーブル
- `cafe_posts`
- `courses` 
- `gallery_photos`
- `gear_reviews`

### 追加されるカラム
- `deleted_at`: TIMESTAMPTZ (論理削除日時)
- `deletion_reason`: TEXT (削除理由、管理者削除時のみ)
- `deleted_by`: UUID (削除者ID、管理者削除時のみ)

### パフォーマンス最適化
- 各テーブルに `deleted_at` インデックス追加
- 外部キー制約追加

## 4. 実行後の確認

マイグレーション実行後、アプリケーションで以下が正常動作することを確認:

```bash
npm run dev
```

- ギアレビュー一覧の表示エラーが解消
- 削除機能が正常動作（論理削除）
- 管理者削除時の通知機能

## 5. トラブルシューティング

### エラーが発生した場合
```bash
# マイグレーション状態確認
npx supabase db diff

# 特定のマイグレーションをリセット（注意: データ損失の可能性）
npx supabase db reset
```

### 手動でカラム存在確認
```sql
-- SQL Editorで実行
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cafe_posts' 
AND column_name IN ('deleted_at', 'deletion_reason', 'deleted_by');
```