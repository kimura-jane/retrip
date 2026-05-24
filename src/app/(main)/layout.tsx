import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900">
      <header className="sticky top-0 z-40 bg-paper-100/80 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-display text-2xl tracking-wide text-ink-900">Re:Trip</span>
            <span className="font-display italic text-[11px] tracking-widest2 text-ink-500 hidden sm:inline">
              re:trip
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[12px] tracking-widest2 uppercase text-ink-600">
            <Link href="/#concept" className="hover:text-coral-500 transition-colors">Concept</Link>
            <Link href="/" className="hover:text-coral-500 transition-colors">Journeys</Link>
            <Link href="/chat" className="hover:text-coral-500 transition-colors">Community</Link>
            {user ? (
              <>
                <Link href="/mypage" className="hover:text-coral-500 transition-colors">Mypage</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-coral-500 transition-colors">Login</Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper-100 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-32 border-t border-line bg-paper-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-10 md:grid-cols-4 text-[13px] text-ink-500 font-light">
          <div>
            <div className="font-display text-2xl text-ink-900">Re:Trip</div>
            <p className="mt-4 leading-loose2">
              週末のバス旅で、<br />ちいさな共同生活を。
            </p>
          </div>
          <div>
            <div className="text-[11px] tracking-widest2 uppercase text-ink-900 mb-4">About</div>
            <ul className="space-y-2 leading-loose2">
              <li><Link href="/#concept">コンセプト</Link></li>
              <li><Link href="/">旅をさがす</Link></li>
              <li><Link href="/chat">コミュニティ</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] tracking-widest2 uppercase text-ink-900 mb-4">Support</div>
            <ul className="space-y-2 leading-loose2">
              <li><Link href="#">運営会社</Link></li>
              <li><Link href="#">プライバシー</Link></li>
              <li><Link href="#">お問い合わせ</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] tracking-widest2 uppercase text-ink-900 mb-4">Follow</div>
            <ul className="space-y-2 leading-loose2">
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Note</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 text-[11px] tracking-widest2 uppercase text-ink-500">
            © {new Date().getFullYear()} Re:Trip
          </div>
        </div>
      </footer>
    </div>
  );
}
