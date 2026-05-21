"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChatActionResult =
  | { success: true }
  | { success: false; error: string };

export async function sendMessageAction(
  roomId: string,
  content: string
): Promise<ChatActionResult> {
  if (!content.trim()) {
    return { success: false, error: "メッセージを入力してください" };
  }

  if (content.length > 2000) {
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
    content: content.trim(),
  };

  const { error } = await supabase
    .from("messages")
    .insert(payload as never);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}
