# Re:Trip

関東発・少人数バスツアーのマッチング & コミュニティアプリ。

決済後に専用チャットで事前交流し、当日の旅で関係性を深める。ツアー後もチャットとアルバムが残り、リピーター同士のコミュニティとして機能する。

## 技術スタック

- **フロントエンド / バックエンド**: Next.js 15 (App Router) + TypeScript (strict)
- **データベース / 認証 / ストレージ / Realtime**: Supabase
- **決済**: Stripe（フェーズ3〜）
- **モバイル配信**: Capacitor（iOS / Android）
- **バリデーション**: Zod
- **スタイリング**: Tailwind CSS + shadcn/ui
- **ホスティング**: Vercel

## ディレクトリ構成

```
src/
  app/              # Next.js ルーティング
  features/         # ドメインごとのロジック
    auth/
    tour/
    payment/
    chat/
    lounge/
    album/
    user/
  lib/              # 共通ライブラリ
    supabase/       # Supabase クライアント
  types/            # 型定義
    database.ts     # DB スキーマ対応の型（単一情報源）
  components/ui/    # shadcn/ui コンポーネント
supabase/
  migrations/       # DB マイグレーション SQL
```

## 開発フェーズ

- [x] フェーズ1: プロジェクト初期化、Supabase 接続、認証基盤、DBスキーマ、RLS
- [ ] フェーズ2: ユーザー登録、プロフィール、本人確認フロー、運営承認 UI
- [ ] フェーズ3: ツアー一覧・詳細・申込、Stripe決済、Webhook
- [ ] フェーズ4: チャット（ツアー専用＋全体ラウンジ）、Realtime
- [ ] フェーズ5: アルバム機能
- [ ] フェーズ6: 運営管理画面
- [ ] フェーズ7: UI調整、Capacitor、ストア申請、本番デプロイ

## セットアップ

### 1. 環境変数

`.env.example` をコピーして `.env.local` を作成し、Supabase / Stripe のキーを設定する。

Vercel デプロイ時は Project Settings → Environment Variables に同じ値を設定。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

### 2. Supabase マイグレーション

`supabase/migrations/` 配下の SQL を順番に Supabase ダッシュボードの SQL Editor で実行。

1. `0001_init.sql` - テーブル作成
2. `0002_rls.sql` - RLS ポリシーとストレージ設定
3. `0003_chat_rooms.sql` - チャットルーム
4. `0004_chat_features.sql` - リアクション・引用・編集・画像
5. `0005_chat_theme.sql` - ユーザーごとのテーマ設定
6. `0006_users_grant_update.sql` - users テーブルへの UPDATE 権限付与

### 3. 開発サーバー（ローカル環境がある場合）

```bash
npm install
npm run dev
```

## デプロイ

GitHub と Vercel を連携。`main` ブランチへの push で自動デプロイされる。

## セキュリティ

- 全テーブルで RLS 有効化済み
- `service_role` キーは絶対にクライアント側で使用しない
- 本人確認書類は専用バケットで本人と運営のみアクセス可
- Stripe Webhook は `stripe_event_id` のユニーク制約で冪等性を確保

## ライセンス

Private project. All rights reserved.
