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
    <div className="min-h-screen bg-[#FAFBF7] flex flex-col">
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/admin"
            className="font-serif text-xl tracking-wide text-neutral-800"
          >
            Re:Trip Admin
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/verifications"
              className="text-sm text-neutral-700 hover:text-brand-600 transition"
            >
              本人確認
            </Link>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-800 transition"
            >
              サイトへ
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm text-neutral-500 hover:text-neutral-800 transition"
              >
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
