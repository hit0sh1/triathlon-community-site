-- 論理削除機能のためのカラム追加マイグレーション

-- カフェ投稿テーブルにカラム追加
ALTER TABLE cafe_posts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- コーステーブルにカラム追加
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- ギャラリー写真テーブルにカラム追加
ALTER TABLE gallery_photos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- ギアレビューテーブルにカラム追加
ALTER TABLE gear_reviews 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- インデックス作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_cafe_posts_deleted_at ON cafe_posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_courses_deleted_at ON courses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_deleted_at ON gallery_photos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_gear_reviews_deleted_at ON gear_reviews(deleted_at);

-- コメント追加
COMMENT ON COLUMN cafe_posts.deleted_at IS '論理削除日時';
COMMENT ON COLUMN cafe_posts.deletion_reason IS '削除理由（管理者削除時のみ）';
COMMENT ON COLUMN cafe_posts.deleted_by IS '削除者ID（管理者削除時のみ）';

COMMENT ON COLUMN courses.deleted_at IS '論理削除日時';
COMMENT ON COLUMN courses.deletion_reason IS '削除理由（管理者削除時のみ）';
COMMENT ON COLUMN courses.deleted_by IS '削除者ID（管理者削除時のみ）';

COMMENT ON COLUMN gallery_photos.deleted_at IS '論理削除日時';
COMMENT ON COLUMN gallery_photos.deletion_reason IS '削除理由（管理者削除時のみ）';
COMMENT ON COLUMN gallery_photos.deleted_by IS '削除者ID（管理者削除時のみ）';

COMMENT ON COLUMN gear_reviews.deleted_at IS '論理削除日時';
COMMENT ON COLUMN gear_reviews.deletion_reason IS '削除理由（管理者削除時のみ）';
COMMENT ON COLUMN gear_reviews.deleted_by IS '削除者ID（管理者削除時のみ）';