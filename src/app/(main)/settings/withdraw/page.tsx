import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WithdrawForm } from "./withdraw-form";

type BlockingBooking = {
  id: string;
  tours: {
    id: string;
    title: string;
    departure_date: string;
  } | null;
};

export default async function WithdrawPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nowIso = new Date().toISOString();

  // 出発前の confirmed 予約があれば退会不可
  const { data: blockersData } = await supabase
    .from("bookings")
    .select("id, tours!inner(id,title,departure_date)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("tours.departure_date", nowIso);

  const blockers =
    (blockersData as unknown as BlockingBooking[] | null) ?? [];
  const canWithdraw = blockers.length === 0;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-12">
        <p className="font-display italic uppercase tracking-widest2 text-xs text-coral-700">
          Withdraw
        </p>
        <h1 className="font-serif text-4xl text-ink-900 mt-3 leading-loose2">
          退会する
        </h1>
        <div className="mt-6 h-px w-12 bg-coral-500" />
      </header>

      <section className="mb-10 border border-line bg-paper-50 p-6">
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-ink-500 mb-4">
          退会前にご確認ください
        </p>
        <ul className="space-y-3 text-[13px] text-ink-900 font-light leading-loose">
          <li>・アカウントは論理削除されます。再ログインはできません。</li>
          <li>
            ・過去の予約・参加履歴・チャット投稿は、他の参加者の旅の記録として残ります。表示名は「退会したユーザー」となります。
          </li>
          <li>
            ・出発前の予約が残っている場合は退会できません。先にキャンセル手続きをお願いします。
          </li>
          <li>・退会後、同じメールアドレスでの再登録はできません。</li>
        </ul>
      </section>

      {!canWithdraw ? (
        <section className="border border-coral-500/40 bg-coral-50 p-6">
          <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-4">
            退会できません
          </p>
          <p className="text-[13px] text-ink-900 font-light leading-loose mb-5">
            以下の出発前の予約があります。キャンセル後に再度お試しください。
          </p>
          <ul className="space-y-2 mb-6">
            {blockers.map((b) =>
              b.tours ? (
                <li
                  key={b.id}
                  className="flex items-center justify-between border-b border-line/60 pb-2"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-[14px] text-ink-900 truncate">
                      {b.tours.title}
                    </p>
                    <p className="text-[11px] text-ink-500 font-light mt-0.5">
                      出発：{fmtDate(b.tours.departure_date)}
                    </p>
                  </div>
                  <Link
                    href={`/tours/${b.tours.id}`}
                    className="text-[11px] tracking-widest2 uppercase text-coral-700 hover:text-coral-500 shrink-0 ml-3"
                  >
                    詳細 →
                  </Link>
                </li>
              ) : null
            )}
          </ul>
          <Link
            href="/settings"
            className="font-display italic text-xs text-ink-500 hover:text-coral-500 transition-colors"
          >
            ← 設定に戻る
          </Link>
        </section>
      ) : (
        <WithdrawForm />
      )}
    </div>
  );
}
