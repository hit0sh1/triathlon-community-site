# 沖縄トライアスロンコミュニティサイト

このプロジェクトは[Next.js](https://nextjs.org)で構築された沖縄のトライアスロンコミュニティのためのWebアプリケーションです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`をコピーして`.env.local`を作成し、必要な環境変数を設定してください：

```bash
cp .env.local.example .env.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 重要な機能

### Google Maps統合

カフェページでGoogle Mapsを表示するには、`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`環境変数の設定が必要です。

**注意**: コンテンツブロッカー（AdBlock、uBlock Originなど）を使用している場合、Google Maps APIの一部のリクエスト（`gen_204`エンドポイント）がブロックされることがありますが、これは正常な動作で、マップ機能には影響しません。

#### 代替地図サービス

Google Mapsが利用できない場合でも、以下の代替サービスが自動的に提供されます：
- OpenStreetMap
- Yahoo!マップ
- Google Maps（外部リンク）

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### 掲示板システム

Slack-likeなリアルタイム掲示板システムが実装されています：
- リアルタイムメッセージング
- スレッド機能
- 絵文字リアクション
- メンション機能
- 全文検索
- チャンネル管理

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
