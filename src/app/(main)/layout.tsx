import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FAFBF7] flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>
      <footer className="px-6 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Re:Trip
      </footer>
    </div>
  );
}
