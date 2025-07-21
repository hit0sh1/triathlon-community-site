-- 論理削除のためのカラム追加
-- deleted_at フィールドを各テーブルに追加

-- events テーブルに論理削除フィールド追加
ALTER TABLE events 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- board_posts テーブルに論理削除フィールド追加
ALTER TABLE board_posts 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- board_replies テーブルに論理削除フィールド追加
ALTER TABLE board_replies 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- columns テーブルに論理削除フィールド追加
ALTER TABLE columns 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- column_comments テーブルに論理削除フィールド追加
ALTER TABLE column_comments 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- インデックス追加（パフォーマンス向上のため）
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_board_posts_deleted_at ON board_posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_board_replies_deleted_at ON board_replies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_columns_deleted_at ON columns(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_column_comments_deleted_at ON column_comments(deleted_at) WHERE deleted_at IS NULL;

-- 論理削除用のヘルパー関数
CREATE OR REPLACE FUNCTION soft_delete_record(table_name TEXT, record_id UUID)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql;

-- 論理削除復元用のヘルパー関数
CREATE OR REPLACE FUNCTION restore_record(table_name TEXT, record_id UUID)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql;