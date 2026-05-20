import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFBF7] flex flex-col">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="font-serif text-2xl tracking-wide text-neutral-800"
        >
          re trip
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-6 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} re trip
      </footer>
    </div>
  );
}
