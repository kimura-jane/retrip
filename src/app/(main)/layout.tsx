import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCountsAction } from "@/features/chat/actions";
import { BottomNav } from "./_components/bottom-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未読合計（ログイン時のみ）
  let totalUnread = 0;
  if (user) {
    const counts = await getUnreadCountsAction();
    totalUnread = Object.values(counts).reduce(
      (sum, n) => sum + (typeof n === "number" ? n : 0),
      0
    );
  }

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900">
      {/* 上部ヘッダー：ロゴのみ。未ログイン時のみ Login/Sign up を右側に出す */}
      <header className="sticky top-0 z-40 bg-paper-100/80 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-display text-2xl tracking-wide text-ink-900">
              Re:Trip
            </span>
            <span className="font-display italic text-[11px] tracking-widest2 text-ink-500 hidden sm:inline">
              re:trip
            </span>
          </Link>
          {!user && (
            <nav className="flex items-center gap-6 md:gap-8 text-[12px] text-ink-600">
              <Link
                href="/login"
                className="hover:text-coral-500 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper-100 transition-colors"
              >
                会員登録
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* 下部ナビ分の余白を確保（pb-[env(safe-area-inset-bottom)] + 64px くらい） */}
      <main className={user ? "pb-24" : ""}>{children}</main>

      {/* フッター */}
      <footer className="mt-24 border-t border-line bg-paper-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 space-y-10">
          {/* リンク行 */}
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-[12px] text-ink-500 font-light">
            <a
              href="https://kimura-jane.github.io/retrip-lp/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-coral-700 transition-colors"
            >
              Re:Trip について
            </a>
            <Link href="/faq" className="hover:text-coral-700 transition-colors">
              よくある質問
            </Link>
            <Link
              href="/contact"
              className="hover:text-coral-700 transition-colors"
            >
              お問い合わせ
            </Link>
            <Link
              href="/terms"
              className="hover:text-coral-700 transition-colors"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="hover:text-coral-700 transition-colors"
            >
              プライバシー
            </Link>
            <Link
              href="/tokushoho"
              className="hover:text-coral-700 transition-colors"
            >
              特定商取引法に基づく表記
            </Link>
          </nav>

          {/* ロゴ + コピーライト */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[12px] text-ink-500 font-light border-t border-line pt-8">
            <div className="font-display text-2xl text-ink-900">Re:Trip</div>
            <div className="text-[11px] font-light">
              © {new Date().getFullYear()} Re:Trip
            </div>
          </div>
        </div>
      </footer>

      {/* 下部タブバー（ログイン時のみ） */}
      {user && <BottomNav unreadTotal={totalUnread} />}
    </div>
  );
}
