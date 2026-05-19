import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * サーバー（Server Component, Server Action, Route Handler）から使う Supabase クライアント。
 *
 * Next.js 15 から `cookies()` は async になったので、この関数も async。
 *
 * 使用例：
 * ```tsx
 * // Server Component
 * import { createClient } from "@/lib/supabase/server";
 *
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   return <div>{user?.email}</div>;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合、Cookie の書き込みはできない。
            // middleware で session が更新されていれば問題ない。
          }
        },
      },
    }
  );
}

/**
 * service_role キーを使う管理者向けクライアント。RLS をバイパスする。
 *
 * 使い所：
 * - Stripe Webhook で予約確定する時
 * - 運営承認の自動処理
 * - cron job
 *
 * ⚠️ 絶対にクライアント側（"use client" ファイル）で使わない。
 *    Server Action や Route Handler のみで使用すること。
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
