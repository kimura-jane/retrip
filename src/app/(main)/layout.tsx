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
          <nav className="flex items-center gap-6 md:gap-8 text-[12px] tracking-widest2 uppercase text-ink-600">
            <Link href="/" className="hover:text-coral-500 transition-colors">Journeys</Link>
            {user ? (
              <>
                <Link href="/chat" className="hover:text-coral-500 transition-colors">Chat</Link>
                <Link href="/mypage" className="hover:text-coral-500 transition-colors">Mypage</Link>
                <Link href="/settings" className="hover:text-coral-500 transition-colors">Settings</Link>
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

      <footer className="mt-24 border-t border-line bg-paper-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-[12px] text-ink-500 font-light">
          <div className="font-display text-2xl text-ink-900">Re:Trip</div>
          <div className="text-[11px] tracking-widest2 uppercase">
            © {new Date().getFullYear()} Re:Trip
          </div>
        </div>
      </footer>
    </div>
  );
}
