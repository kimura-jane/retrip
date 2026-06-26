import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-16">
        <p className="font-display italic uppercase tracking-widest2 text-xs text-coral-700">
          Settings
        </p>
        <h1 className="font-serif text-4xl text-ink-900 mt-3 leading-loose2">
          設定
        </h1>
        <div className="mt-6 h-px w-12 bg-coral-500" />
      </header>

      <nav className="divide-y divide-line border-y border-line">
        {/* 通知（次セッションで実装） */}
        <div className="flex items-center justify-between py-5 px-1 opacity-40">
          <div>
            <p className="text-[14px] text-ink-900">通知設定</p>
            <p className="text-[11px] text-ink-500 font-light mt-1">
              準備中
            </p>
          </div>
          <span className="text-[11px] tracking-widest2 uppercase text-ink-500">
            soon
          </span>
        </div>

        {/* 問い合わせ（次セッションで実装） */}
        <div className="flex items-center justify-between py-5 px-1 opacity-40">
          <div>
            <p className="text-[14px] text-ink-900">運営への問い合わせ</p>
            <p className="text-[11px] text-ink-500 font-light mt-1">
              準備中
            </p>
          </div>
          <span className="text-[11px] tracking-widest2 uppercase text-ink-500">
            soon
          </span>
        </div>

        {/* 規約系（次セッションで実装） */}
        <div className="flex items-center justify-between py-5 px-1 opacity-40">
          <div>
            <p className="text-[14px] text-ink-900">利用規約・プライバシー</p>
            <p className="text-[11px] text-ink-500 font-light mt-1">
              準備中
            </p>
          </div>
          <span className="text-[11px] tracking-widest2 uppercase text-ink-500">
            soon
          </span>
        </div>

        {/* 退会（今回実装） */}
        <Link
          href="/settings/withdraw"
          className="flex items-center justify-between py-5 px-1 hover:bg-paper-50 transition-colors group"
        >
          <div>
            <p className="text-[14px] text-coral-700">退会する</p>
            <p className="text-[11px] text-ink-500 font-light mt-1">
              アカウントを論理削除します
            </p>
          </div>
          <span className="text-[11px] tracking-widest2 uppercase text-coral-700 group-hover:text-coral-500">
            →
          </span>
        </Link>
      </nav>

      <div className="mt-12">
        <Link
          href="/mypage"
          className="font-display italic text-xs text-ink-500 hover:text-coral-500 transition-colors"
        >
          ← マイページに戻る
        </Link>
      </div>
    </div>
  );
}
