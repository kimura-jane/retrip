import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatThemeForm } from "../chat-theme-form";
import type { ChatThemeColor, ChatFont } from "@/types/database";

type PrefsRow = {
  chat_theme_color: ChatThemeColor | null;
  chat_font: ChatFont | null;
};

export default async function ChatCustomizePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("chat_theme_color,chat_font")
    .eq("id", user.id)
    .maybeSingle<PrefsRow>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* 戻るリンク */}
      <Link
        href="/mypage"
        className="font-display italic text-xs text-ink-500 hover:text-coral-700 transition-colors"
      >
        ← マイページ
      </Link>

      {/* ページヘッダー */}
      <header className="mt-6 mb-14">
        <h1 className="font-serif text-3xl text-ink-900 leading-loose2">
          チャットカスタマイズ
        </h1>
        <p className="mt-3 text-sm text-ink-500 font-light leading-loose">
          あなたのメッセージの色とフォントを選べます。設定は自分のチャット画面にだけ反映されます。
        </p>
        <div className="mt-6 h-px w-12 bg-coral-500" />
      </header>

      <ChatThemeForm
        initialColor={data?.chat_theme_color ?? "coral"}
        initialFont={data?.chat_font ?? "sans"}
      />
    </div>
  );
}
