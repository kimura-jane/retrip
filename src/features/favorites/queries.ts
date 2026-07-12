import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * 現在ログイン中ユーザーのお気に入り tour_id 集合を返す。
 * 未ログイン時は空 Set。
 */
export async function getFavoriteTourIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  // database.ts はマイグレーション適用後の型再生成まで favorites を含まないため、
  // この新規テーブルへのアクセスだけ untyped client として扱う。
  const favoritesClient = supabase as unknown as SupabaseClient;
  const { data } = await favoritesClient
    .from("favorites")
    .select("tour_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((r) => r.tour_id as string));
}
