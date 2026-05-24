"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ChatThemeColor, ChatFont } from "@/types/database";

const ALLOWED_COLORS: ChatThemeColor[] = ["coral", "sage", "ink", "paper", "sora"];
const ALLOWED_FONTS: ChatFont[] = ["sans", "serif", "display", "rounded"];

export async function updateChatThemeAction(
  color: string,
  font: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!ALLOWED_COLORS.includes(color as ChatThemeColor)) {
    return { success: false, error: "テーマカラーが不正です" };
  }
  if (!ALLOWED_FONTS.includes(font as ChatFont)) {
    return { success: false, error: "フォントが不正です" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "ログインが必要です" };

  const { error } = await supabase
    .from("users")
    .update({ chat_theme_color: color, chat_font: font } as never)
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/chat");
  revalidatePath("/mypage");
  return { success: true };
}
