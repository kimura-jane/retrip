"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "./schema";
import type { Gender } from "@/types/database";

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

type UsersUpdatePayload = {
  display_name?: string;
  bio?: string | null;
  gender?: Gender;
  birth_date?: string;
  id_document_url?: string | null;
  id_rejected_at?: string | null;
  id_rejection_reason?: string | null;
};

export async function updateProfileAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const raw = {
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload: UsersUpdatePayload = {
    display_name: parsed.data.displayName,
    bio: parsed.data.bio || null,
    gender: parsed.data.gender,
    birth_date: parsed.data.birthDate,
  };

  const { error } = await supabase
    .from("users")
    .update(payload as never)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/mypage");
  redirect("/mypage");
}

export async function uploadIdDocumentAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const file = formData.get("idDocument");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "画像を選択してください" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "ファイルサイズは10MB以下にしてください" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "JPEG, PNG, WebP, HEIC形式の画像をアップロードしてください" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("id_documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: `アップロードに失敗しました: ${uploadError.message}` };
  }

  const idPayload: UsersUpdatePayload = {
    id_document_url: path,
    id_rejected_at: null,
    id_rejection_reason: null,
  };

  const { error: updateError } = await supabase
    .from("users")
    .update(idPayload as never)
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/mypage");
  return { success: true, message: "本人確認書類を送信しました。承認をお待ちください。" };
}
