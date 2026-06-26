"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WithdrawResult =
  | { success: true }
  | { success: false; error: string };

export type WithdrawBlockReason = {
  hasConfirmedFutureBooking: boolean;
  count: number;
};

/**
 * 退会前チェック：決済済み(confirmed)かつ出発日が未来のツアーがあれば退会不可。
 * pending（決済保留）と attended（参加済み）は退会OK。
 */
export async function checkWithdrawableAction(): Promise<
  | { ok: true }
  | { ok: false; reason: WithdrawBlockReason }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const nowIso = new Date().toISOString();

  // confirmed の予約のうち、未来のツアーに紐づくものを数える
  const { data, error } = await supabase
    .from("bookings")
    .select("id, tours!inner(departure_date)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("tours.departure_date", nowIso);

  if (error) return { ok: false, error: error.message };

  const count = (data ?? []).length;
  if (count > 0) {
    return {
      ok: false,
      reason: { hasConfirmedFutureBooking: true, count },
    };
  }
  return { ok: true };
}

/**
 * 退会実行（A案・論理削除）。
 * - withdrawals に理由を記録
 * - users.withdrawn=true, withdrawn_at=now()
 * - 全 chat_members に left_at をセット（roomから離脱）
 * - signOut() してトップへ
 * - auth.users は残す（FK 整合性保持のため）
 */
export async function withdrawAction(
  reason: string
): Promise<WithdrawResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "ログインが必要です" };

  // 退会前チェック（クライアントの表示と二重で守る）
  const nowIso = new Date().toISOString();
  const { data: blockers, error: checkErr } = await supabase
    .from("bookings")
    .select("id, tours!inner(departure_date)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("tours.departure_date", nowIso);

  if (checkErr) return { success: false, error: checkErr.message };
  if ((blockers ?? []).length > 0) {
    return {
      success: false,
      error:
        "出発前の予約があるため退会できません。キャンセル後にお試しください。",
    };
  }

  // withdrawals に理由を記録
  const trimmed = reason.trim().slice(0, 1000);
  const { error: insErr } = await supabase
    .from("withdrawals")
    .insert({ user_id: user.id, reason: trimmed || null } as never);
  if (insErr) return { success: false, error: insErr.message };

  // users を論理削除
  const { error: updErr } = await supabase
    .from("users")
    .update({
      withdrawn: true,
      withdrawn_at: new Date().toISOString(),
    } as never)
    .eq("id", user.id);
  if (updErr) return { success: false, error: updErr.message };

  // 全 chat room から離脱（is_chat_blocked() の効きと整合）
  await supabase
    .from("chat_members")
    .update({ left_at: new Date().toISOString() } as never)
    .eq("user_id", user.id)
    .is("left_at", null);

  // サインアウト
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  return { success: true };
}
