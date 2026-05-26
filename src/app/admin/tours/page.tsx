import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TourActionsCell } from "./tour-actions-cell";

export const dynamic = "force-dynamic";

type TourRow = {
  id: string;
  title: string;
  destination: string;
  departure_date: string;
  price: number;
  capacity_total: number;
  status: string;
  cover_image_url: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "下書き",
  recruiting: "募集中",
  closed: "締切",
  completed: "終了",
  cancelled: "中止",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-paper-200 text-ink-600",
  recruiting: "bg-coral-100 text-coral-700",
  closed: "bg-paper-300 text-ink-600",
  completed: "bg-sage-100 text-sage-700",
  cancelled: "bg-paper-200 text-ink-500",
};

export default async function AdminToursPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .select(
      "id, title, destination, departure_date, price, capacity_total, status, cover_image_url, created_at"
    )
    .order("created_at", { ascending: false });

  const tours = (data ?? []) as TourRow[];

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-6">
        <div>
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Tours
          </p>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
            ツアー管理
          </h1>
          <p className="mt-3 text-[13px] font-light text-ink-500 leading-loose2">
            全 {tours.length} 件
          </p>
        </div>
        <Link
          href="/admin/tours/new"
          className="inline-block bg-coral-500 hover:bg-coral-700 text-paper-100 text-[13px] tracking-[0.15em] px-6 py-3 transition text-center"
        >
          ＋ 新規作成
        </Link>
      </div>

      {error && (
        <p className="text-[13px] text-coral-700">
          読み込みエラー: {error.message}
        </p>
      )}

      {/* 一覧 */}
      {tours.length === 0 ? (
        <p className="text-center text-[13px] font-light text-ink-500 leading-loose2 py-16">
          まだツアーはありません。
        </p>
      ) : (
        <div className="space-y-4">
          {tours.map((t) => {
            const dateLabel = new Date(t.departure_date).toLocaleDateString(
              "ja-JP",
              { year: "numeric", month: "long", day: "numeric" }
            );
            return (
              <div
                key={t.id}
                className="border border-line bg-paper-50 p-4 sm:p-5"
              >
                {/* 上段：サムネ + メタ情報（モバイルでも横並び） */}
                <div className="flex gap-4">
                  {/* サムネ */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-paper-200 overflow-hidden">
                    {t.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.cover_image_url}
                        alt={t.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* メタ情報 */}
                  <div className="flex-1 min-w-0">
                    {/* ステータスバッジ */}
                    <div>
                      <span
                        className={`inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic ${
                          STATUS_COLOR[t.status] ?? "bg-paper-200 text-ink-600"
                        }`}
                      >
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </div>

                    {/* タイトル */}
                    <h3 className="mt-2 font-serif text-base sm:text-lg tracking-[0.04em] text-ink-900 leading-snug line-clamp-2">
                      {t.title}
                    </h3>

                    {/* 目的地 + 日付（行を分けて改行しやすく） */}
                    <div className="mt-2 text-[11px] sm:text-[12px] text-ink-500 font-light leading-relaxed">
                      <div className="truncate">{t.destination}</div>
                      <div className="truncate">{dateLabel}</div>
                    </div>

                    {/* 価格・定員 */}
                    <div className="mt-1.5 text-[11px] sm:text-[12px] text-ink-600 font-light tracking-[0.03em]">
                      ¥{t.price.toLocaleString()} ／ 定員 {t.capacity_total} 名
                    </div>
                  </div>
                </div>

                {/* 下段：操作ボタン（モバイルでは横一列フル幅、PC では右寄せ） */}
                <div className="mt-4 pt-4 border-t border-line">
                  <TourActionsCell tourId={t.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
