"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChatActionResult =
  | { success: true }
  | { success: false; error: string };

// ===========================================
// メッセージ送信
// ===========================================

export async function sendMessageAction(
  roomId: string,
  content: string,
  options?: {
    replyToMessageId?: string | null;
    mediaUrl?: string | null;
    mediaType?: "image" | "video" | "gif" | null;
  }
): Promise<ChatActionResult> {
  const hasMedia = !!options?.mediaUrl;
  const trimmed = content.trim();

  if (!trimmed && !hasMedia) {
    return { success: false, error: "メッセージを入力してください" };
  }

  if (trimmed.length > 2000) {
    return { success: false, error: "メッセージは2000文字以下にしてください" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const payload = {
    room_id: roomId,
    user_id: user.id,
    content: trimmed,
    reply_to_message_id: options?.replyToMessageId ?? null,
    media_url: options?.mediaUrl ?? null,
    media_type: options?.mediaType ?? null,
  };

  const { error } = await supabase.from("messages").insert(payload as never);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}

// ===========================================
// メッセージ編集
// ===========================================

export async function editMessageAction(
  messageId: string,
  newContent: string,
  roomId: string
): Promise<ChatActionResult> {
  const trimmed = newContent.trim();
  if (!trimmed) {
    return { success: false, error: "メッセージを入力してください" };
  }
  if (trimmed.length > 2000) {
    return { success: false, error: "メッセージは2000文字以下にしてください" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("messages")
    .update({
      content: trimmed,
      edited_at: new Date().toISOString(),
    } as never)
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}

// ===========================================
// メッセージ削除（送信取り消し）
// ===========================================

export async function deleteMessageAction(
  messageId: string,
  roomId: string
): Promise<ChatActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("messages")
    .update({
      deleted_at: new Date().toISOString(),
      content: "",
      media_url: null,
      media_type: null,
    } as never)
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}

// ===========================================
// リアクション追加
// ===========================================

export async function addReactionAction(
  messageId: string,
  emoji: string,
  roomId: string
): Promise<ChatActionResult> {
  if (!emoji || emoji.length > 16) {
    return { success: false, error: "絵文字が不正です" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase.from("message_reactions").insert({
    message_id: messageId,
    user_id: user.id,
    emoji,
  } as never);

  if (error) {
    // 既に同じ絵文字を押していた場合(unique制約違反)はエラーにしない
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}

// ===========================================
// リアクション削除（トグル）
// ===========================================

export async function removeReactionAction(
  messageId: string,
  emoji: string,
  roomId: string
): Promise<ChatActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}

// ===========================================
// メディアアップロード（画像・動画・GIF）
// ===========================================

export async function uploadChatMediaAction(
  formData: FormData
): Promise<
  | { success: true; url: string; mediaType: "image" | "video" | "gif" }
  | { success: false; error: string }
> {
  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string | null;

  if (!file || !roomId) {
    return { success: false, error: "ファイルが指定されていません" };
  }

  // ファイル種別判定
  const mime = file.type;
  let mediaType: "image" | "video" | "gif";
  let maxSize: number;

  if (mime === "image/gif") {
    mediaType = "gif";
    maxSize = 10 * 1024 * 1024;
  } else if (mime.startsWith("image/")) {
    mediaType = "image";
    maxSize = 10 * 1024 * 1024;
  } else if (mime.startsWith("video/")) {
    mediaType = "video";
    maxSize = 50 * 1024 * 1024;
  } else {
    return {
      success: false,
      error: "対応していないファイル形式です（画像/動画/GIFのみ）",
    };
  }

  if (file.size > maxSize) {
    const limitMb = maxSize / 1024 / 1024;
    return {
      success: false,
      error: `ファイルサイズは ${limitMb}MB 以下にしてください`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  // ファイル名生成: {userId}/{roomId}/{timestamp}-{ext}
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${roomId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("message_images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: mime,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("message_images")
    .getPublicUrl(path);

  return {
    success: true,
    url: publicUrlData.publicUrl,
    mediaType,
  };
}
