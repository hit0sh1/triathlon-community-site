-- 旧掲示板システムのテーブルとデータを削除

-- 旧掲示板のテーブルが存在する場合は削除
DROP TABLE IF EXISTS board_replies CASCADE;
DROP TABLE IF EXISTS board_posts CASCADE;

-- 旧掲示板用のboard_categoriesテーブルが存在し、新しいシステムと重複している場合は
-- 新しいシステムでは既にslack用のカテゴリーを作成済みなので、
-- 旧システムのカテゴリーは不要（必要に応じて手動でマイグレーション）

-- RLSポリシーのクリーンアップ（該当するテーブルが存在した場合）
-- これらのテーブルが存在しない場合はエラーになるが、IGNORE_ERRORS的な扱い

-- 使用されていない可能性のある関数やトリガーをクリーンアップ
-- (具体的な名前が分からないため、必要に応じて後で追加)

-- コメント
COMMENT ON SCHEMA public IS 'Updated schema after old board system cleanup';