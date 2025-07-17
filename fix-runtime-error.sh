#!/bin/bash

# Runtime Error を修正するスクリプト

echo "🔧 Runtime Error の修正を開始..."

# 1. 開発サーバーを停止（プロセスが動いている場合）
echo "⏹️  開発サーバーを停止中..."
pkill -f "next dev" 2>/dev/null || true

# 2. .next フォルダを削除
echo "🗑️  .next フォルダを削除中..."
rm -rf .next

# 3. node_modules を削除
echo "🗑️  node_modules を削除中..."
rm -rf node_modules

# 4. package-lock.json を削除
echo "🗑️  package-lock.json を削除中..."
rm -f package-lock.json

# 5. npm キャッシュをクリア
echo "🧹 npm キャッシュをクリア中..."
npm cache clean --force

# 6. 依存関係を再インストール
echo "📦 依存関係を再インストール中..."
npm install

# 7. 開発サーバーを起動
echo "🚀 開発サーバーを起動中..."
npm run dev

echo "✅ 修正完了！ブラウザで http://localhost:3000 にアクセスしてください。"