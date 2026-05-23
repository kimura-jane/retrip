"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const role = (user.user_metadata?.role as string | undefined) ?? null;
  return { supabase, user, isAdmin: role === "admin" };
}

export async function approveVerificationAction(
  userId: string
): Promise<Result> {
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return { success: false, error: "ログインが必要です" };
  if (!isAdmin) return { success: false, error: "管理者権限が必要です" };

  const { error } = await supabase
    .from("users")
    .update({
      id_verified: true,
      id_verified_at: new Date().toISOString(),
      id_rejected_at: null,
      id_rejection_reason: null,
    } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_logs").insert({
    admin_user_id: user.id,
    action: "approve_verification",
    target_type: "user",
    target_id: userId,
  } as never);

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}

export async function rejectVerificationAction(
  userId: string,
  reason: string
): Promise<Result> {
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return { success: false, error: "ログインが必要です" };
  if (!isAdmin) return { success: false, error: "管理者権限が必要です" };

  const trimmedReason = reason.trim();
  if (trimmedReason.length === 0) {
    return { success: false, error: "却下理由を入力してください" };
  }
  if (trimmedReason.length > 500) {
    return { success: false, error: "却下理由は500文字以内で入力してください" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      id_verified: false,
      id_document_url: null,
      id_rejected_at: new Date().toISOString(),
      id_rejection_reason: trimmedReason,
    } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_logs").insert({
    admin_user_id: user.id,
    action: "reject_verification",
    target_type: "user",
    target_id: userId,
    note: trimmedReason,
  } as never);

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}
