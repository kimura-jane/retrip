import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./_components/admin-nav";

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
      <AdminNav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-10 py-10">
        {children}
      </main>
    </div>
  );
}
