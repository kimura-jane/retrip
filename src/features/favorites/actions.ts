"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const tourId = String(formData.get("tourId") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  if (!tourId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // database.ts はマイグレーション適用後の型再生成まで favorites を含まないため、
  // この新規テーブルへのアクセスだけ untyped client として扱う。
  const favoritesClient = supabase as unknown as SupabaseClient;

  // 現在の状態を確認して toggle
  const { data: existing } = await favoritesClient
    .from("favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("tour_id", tourId)
    .maybeSingle();

  if (existing) {
    await favoritesClient
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("tour_id", tourId);
  } else {
    await favoritesClient.from("favorites").insert({
      user_id: user.id,
      tour_id: tourId,
    });
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/tours/${tourId}`);

  if (nextRaw.startsWith("/")) {
    redirect(nextRaw);
  }
}
