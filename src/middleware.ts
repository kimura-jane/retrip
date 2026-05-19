import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js のグローバル Middleware。
 * すべてのリクエストの前段で実行され、Supabase セッションをリフレッシュする。
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ：
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico, .png, .jpg, .svg, .webp 等の静的アセット
     *
     * 認証関連の処理は中の関数で行うので、ここではマッチング範囲だけ絞る。
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
