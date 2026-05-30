import Stripe from "stripe";

// Stripe シークレットキーは環境変数から読む（テスト/本番はキーの値で切り替わる）。
// ⚠️ このファイルはサーバー専用。クライアントから import しないこと。
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  // ビルド時ではなく実行時に気づけるようにする
  throw new Error("環境変数 STRIPE_SECRET_KEY が設定されていません");
}

export const stripe = new Stripe(secretKey, {
  // SDK が要求する API バージョン。SDK のメジャー更新時はここも合わせる。
  apiVersion: "2025-04-30.basil",
  appInfo: {
    name: "Re:Trip",
  },
});
