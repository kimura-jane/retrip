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
    } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  // admin_logs に記録
  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: "approve_verification",
    target_user_id: userId,
  } as never);

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}

export async function rejectVerificationAction(
  userId: string
): Promise<Result> {
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return { success: false, error: "ログインが必要です" };
  if (!isAdmin) return { success: false, error: "管理者権限が必要です" };

  const { error } = await supabase
    .from("users")
    .update({
      id_verified: false,
      id_document_url: null,
      id_rejected_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("admin_logs").insert({
    admin_id: user.id,
    action: "reject_verification",
    target_user_id: userId,
  } as never);

  revalidatePath("/admin/verifications");
  revalidatePath("/admin");
  return { success: true };
}
