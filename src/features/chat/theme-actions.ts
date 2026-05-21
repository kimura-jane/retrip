"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ChatThemeColor, ChatFont } from "@/types/database";

const VALID_COLORS: ChatThemeColor[] = ["green", "blue", "pink", "purple", "orange"];
const VALID_FONTS: ChatFont[] = ["sans", "serif", "rounded", "mincho", "pop"];

export type ThemeUpdateResult =
  | { success: true }
  | { success: false; error: string };

export async function updateChatThemeAction(
  color: ChatThemeColor,
  font: ChatFont
): Promise<ThemeUpdateResult> {
  if (!VALID_COLORS.includes(color)) {
    return { success: false, error: "テーマカラーが不正です" };
  }
  if (!VALID_FONTS.includes(font)) {
    return { success: false, error: "フォントが不正です" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      chat_theme_color: color,
      chat_font: font,
    } as never)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/chat");
  revalidatePath("/mypage");
  return { success: true };
}
