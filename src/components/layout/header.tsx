import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl tracking-wide text-neutral-800"
        >
          Re:Trip
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/tours"
                className="text-sm text-neutral-700 hover:text-brand-600 transition"
              >
                ツアー
              </Link>
              <Link
                href="/chat"
                className="text-sm text-neutral-700 hover:text-brand-600 transition"
              >
                チャット
              </Link>
              <Link
                href="/mypage"
                className="text-sm text-neutral-700 hover:text-brand-600 transition"
              >
                マイページ
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm text-neutral-500 hover:text-neutral-800 transition"
                >
                  ログアウト
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-neutral-700 hover:text-brand-600 transition"
              >
                ログイン
              </Link>
              <Link href="/signup">
                <Button size="sm">新規登録</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
