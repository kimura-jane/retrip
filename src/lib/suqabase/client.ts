import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * ブラウザ（Client Component）から使う Supabase クライアント。
 *
 * 使用例：
 * ```tsx
 * "use client";
 * import { createClient } from "@/lib/supabase/client";
 *
 * const supabase = createClient();
 * const { data } = await supabase.from("tours").select("*");
 * ```
 *
 * 認証情報は Cookie に保存され、SSR と整合性が取れる。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
