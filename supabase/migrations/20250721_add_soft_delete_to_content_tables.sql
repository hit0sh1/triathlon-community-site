-- カフェ、コース、ギャラリー、ギアレビューテーブルに論理削除カラムを追加

-- カフェ投稿テーブルにカラム追加
ALTER TABLE cafe_posts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 外部キー制約追加（deleted_byがusersテーブルを参照）
ALTER TABLE cafe_posts 
ADD CONSTRAINT fk_cafe_posts_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- コーステーブルにカラム追加
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 外部キー制約追加
ALTER TABLE courses 
ADD CONSTRAINT fk_courses_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ギャラリー写真テーブルにカラム追加
ALTER TABLE gallery_photos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 外部キー制約追加
ALTER TABLE gallery_photos 
ADD CONSTRAINT fk_gallery_photos_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ギアレビューテーブルにカラム追加
ALTER TABLE gear_reviews 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 外部キー制約追加
ALTER TABLE gear_reviews 
ADD CONSTRAINT fk_gear_reviews_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- パフォーマンス向上のためのインデックス作成
CREATE INDEX IF NOT EXISTS idx_cafe_posts_deleted_at 
ON cafe_posts(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_courses_deleted_at 
ON courses(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_photos_deleted_at 
ON gallery_photos(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gear_reviews_deleted_at 
ON gear_reviews(deleted_at) WHERE deleted_at IS NULL;

-- テーブルとカラムにコメント追加
COMMENT ON COLUMN cafe_posts.deleted_at IS '論理削除日時（NULLでない場合は削除済み）';
COMMENT ON COLUMN cafe_posts.deletion_reason IS '削除理由（管理者削除時のみ設定）';
COMMENT ON COLUMN cafe_posts.deleted_by IS '削除者のユーザーID（管理者削除時のみ設定）';

COMMENT ON COLUMN courses.deleted_at IS '論理削除日時（NULLでない場合は削除済み）';
COMMENT ON COLUMN courses.deletion_reason IS '削除理由（管理者削除時のみ設定）';
COMMENT ON COLUMN courses.deleted_by IS '削除者のユーザーID（管理者削除時のみ設定）';

COMMENT ON COLUMN gallery_photos.deleted_at IS '論理削除日時（NULLでない場合は削除済み）';
COMMENT ON COLUMN gallery_photos.deletion_reason IS '削除理由（管理者削除時のみ設定）';
COMMENT ON COLUMN gallery_photos.deleted_by IS '削除者のユーザーID（管理者削除時のみ設定）';

COMMENT ON COLUMN gear_reviews.deleted_at IS '論理削除日時（NULLでない場合は削除済み）';
COMMENT ON COLUMN gear_reviews.deletion_reason IS '削除理由（管理者削除時のみ設定）';
COMMENT ON COLUMN gear_reviews.deleted_by IS '削除者のユーザーID（管理者削除時のみ設定）';