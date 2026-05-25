import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-100 flex flex-col">
      <header className="px-6 py-6 border-b border-line">
        <Link
          href="/"
          className="font-display italic text-2xl tracking-wide text-ink-900"
        >
          Re:Trip
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-6 py-8 text-center">
        <p className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500">
          © {new Date().getFullYear()} Re:Trip
        </p>
      </footer>
    </div>
  );
}
