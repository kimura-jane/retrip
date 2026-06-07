"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BanResult =
  | { success: true }
  | { success: false; error: string };

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "ログインが必要です" };
  const role = (user.user_metadata?.role as string | undefined) ?? null;
  if (role !== "admin") return { ok: false as const, error: "権限がありません" };
  return { ok: true as const, supabase, adminId: user.id };
}

// 対象を全チャットroomから退出させる（left_at をセット）
async function leaveAllRooms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const nowIso = new Date().toISOString();
  await supabase
    .from("chat_members")
    .update({ left_at: nowIso } as never)
    .eq("user_id", userId)
    .is("left_at", null);
}

// 対象ユーザーが admin かどうか（admin を BAN させない安全弁）
async function isTargetAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  // users テーブルには role が無いため、auth 側の判定はできない。
  // 運用上、admin（草間さん/運営太郎）の user_id を直接ガードする。
  const ADMIN_IDS = [
    // 必要に応じて admin の user_id を追加する
  ];
  return ADMIN_IDS.includes(userId);
}

// ============================================
// アクセスBAN（予約・チャット投稿・room参加すべて不可）
// ============================================
export async function accessBanAction(userId: string): Promise<BanResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (userId === guard.adminId) {
    return { success: false, error: "自分自身はBANできません" };
  }
  if (await isTargetAdmin(guard.supabase, userId)) {
    return { success: false, error: "管理者はBANできません" };
  }

  const { error } = await guard.supabase
    .from("users")
    .update({ banned: true, banned_at: new Date().toISOString() } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await leaveAllRooms(guard.supabase, userId);

  revalidatePath("/admin/tours");
  return { success: true };
}

export async function accessUnbanAction(userId: string): Promise<BanResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const { error } = await guard.supabase
    .from("users")
    .update({ banned: false, banned_at: null } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/tours");
  return { success: true };
}

// ============================================
// チャットBAN（チャット投稿・room参加のみ不可。予約は可）
// ============================================
export async function chatBanAction(userId: string): Promise<BanResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (userId === guard.adminId) {
    return { success: false, error: "自分自身はBANできません" };
  }
  if (await isTargetAdmin(guard.supabase, userId)) {
    return { success: false, error: "管理者はBANできません" };
  }

  const { error } = await guard.supabase
    .from("users")
    .update({
      chat_banned: true,
      chat_banned_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await leaveAllRooms(guard.supabase, userId);

  revalidatePath("/admin/tours");
  return { success: true };
}

export async function chatUnbanAction(userId: string): Promise<BanResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const { error } = await guard.supabase
    .from("users")
    .update({ chat_banned: false, chat_banned_at: null } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/tours");
  return { success: true };
}
