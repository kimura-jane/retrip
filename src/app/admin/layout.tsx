import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string | undefined) ?? null;
  if (role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col">
      <header className="border-b border-line bg-paper-50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link href="/admin" className="flex flex-col leading-none">
            <span className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
              Re:Trip
            </span>
            <span className="mt-1 font-serif text-lg tracking-[0.06em] text-ink-900">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/tours"
              className="text-[12px] tracking-[0.15em] uppercase text-ink-600 hover:text-coral-700 transition"
            >
              Tours
            </Link>
            <Link
              href="/admin/verifications"
              className="text-[12px] tracking-[0.15em] uppercase text-ink-600 hover:text-coral-700 transition"
            >
              Verifications
            </Link>
            <Link
              href="/"
              className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900 transition"
            >
              Site
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900 transition"
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-10 py-10">
        {children}
      </main>
    </div>
  );
}
