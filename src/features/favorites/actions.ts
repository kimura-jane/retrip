"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const tourId = String(formData.get("tourId") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  const nextPath = nextRaw.startsWith("/") ? nextRaw : "/";

  if (!tourId) {
    console.error("[favorites] missing tourId in formData");
    redirect(nextPath);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    console.error("[favorites] getUser error", userErr);
  }
  if (!user) {
    console.warn("[favorites] no user, redirecting to /login");
    redirect("/login");
  }

  // database.ts はマイグレーション適用後の型再生成まで favorites を含まないため、
  // この新規テーブルへのアクセスだけ untyped client として扱う。
  const favoritesClient = supabase as unknown as SupabaseClient;

  const { data: existing, error: selectErr } = await favoritesClient
    .from("favorites")
    .select("user_id")
    .eq("user_id", user!.id)
    .eq("tour_id", tourId)
    .maybeSingle();

  if (selectErr) {
    console.error("[favorites] select error", {
      message: selectErr.message,
      details: selectErr.details,
      hint: selectErr.hint,
      code: selectErr.code,
      userId: user!.id,
      tourId,
    });
    redirect(nextPath);
  }

  if (existing) {
    const { error: delErr } = await favoritesClient
      .from("favorites")
      .delete()
      .eq("user_id", user!.id)
      .eq("tour_id", tourId);
    if (delErr) {
      console.error("[favorites] delete error", {
        message: delErr.message,
        details: delErr.details,
        hint: delErr.hint,
        code: delErr.code,
        userId: user!.id,
        tourId,
      });
    } else {
      console.log("[favorites] deleted", { userId: user!.id, tourId });
    }
  } else {
    const { error: insErr } = await favoritesClient
      .from("favorites")
      .insert({ user_id: user!.id, tour_id: tourId });
    if (insErr) {
      console.error("[favorites] insert error", {
        message: insErr.message,
        details: insErr.details,
        hint: insErr.hint,
        code: insErr.code,
        userId: user!.id,
        tourId,
      });
    } else {
      console.log("[favorites] inserted", { userId: user!.id, tourId });
    }
  }

  revalidatePath("/");
  revalidatePath("/mypage");
  revalidatePath(`/tours/${tourId}`);

  redirect(nextPath);
}
