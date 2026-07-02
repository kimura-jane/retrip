import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 未審査件数（id_document_url あり、id_verified = false、id_rejected_at は null）
  const { count: pendingCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .not("id_document_url", "is", null)
    .eq("id_verified", false)
    .is("id_rejected_at", null);

  // ツアー総数
  const { count: tourCount } = await supabase
    .from("tours")
    .select("id", { count: "exact", head: true });

  // BAN 中の総数（アクセスBAN + チャットBAN、退会者は除外）
  const { count: bannedCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .or("banned.eq.true,chat_banned.eq.true")
    .neq("withdrawn", true);

  const cards = [
    {
      href: "/admin/tours",
      label: "Tours",
      title: "ツアー",
      desc: "ツアーの作成・編集・予約者の管理",
      meta: `全 ${tourCount ?? 0} 件`,
    },
    {
      href: "/chat",
      label: "Chat",
      title: "チャット",
      desc: "チャットルームの確認・モデレーション",
      meta: null,
    },
    {
      href: "/admin/verifications",
      label: "Verifications",
      title: "本人確認",
      desc: "提出された本人確認書類の審査",
      meta: `${pendingCount ?? 0} 件 審査待ち`,
    },
    {
      href: "/admin/users",
      label: "Users",
      title: "ユーザー管理",
      desc: "BAN 済みユーザーの解除・全ユーザーの確認",
      meta: `${bannedCount ?? 0} 件 BAN 中`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-6">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Dashboard
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
          管理ダッシュボード
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block border border-line bg-paper-50 p-6 hover:bg-paper-100 transition group"
          >
            <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
              {c.label}
            </p>
            <h2 className="mt-3 font-serif text-xl tracking-[0.04em] text-ink-900 group-hover:text-coral-700 transition">
              {c.title}
            </h2>
            <p className="mt-2 text-[12px] text-ink-500 font-light leading-relaxed">
              {c.desc}
            </p>
            {c.meta && (
              <p className="mt-4 text-[13px] text-ink-600 font-light tracking-[0.03em]">
                {c.meta}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
