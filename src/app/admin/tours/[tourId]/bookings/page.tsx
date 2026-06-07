import Link from "next/link";
import { notFound } from "next/navigation";
import { getTourBookingsAction } from "@/features/booking/admin-actions";
import type { BookingStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "保留",
  confirmed: "確定",
  cancelled: "キャンセル",
  attended: "参加済み",
  no_show: "不参加",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "bg-paper-200 text-ink-600",
  confirmed: "bg-coral-100 text-coral-700",
  cancelled: "bg-paper-200 text-ink-500",
  attended: "bg-sage-100 text-sage-700",
  no_show: "bg-paper-300 text-ink-600",
};

export default async function AdminTourBookingsPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const result = await getTourBookingsAction(tourId);

  if (!result.success) {
    notFound();
  }

  // キャンセルを除いた有効予約の人数
  const activeCount = result.bookings.filter(
    (b) => b.status !== "cancelled"
  ).length;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-6">
        <div>
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Bookings
          </p>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
            {result.tourTitle}
          </h1>
          <p className="mt-3 text-[13px] font-light text-ink-500 leading-loose2">
            有効予約 {activeCount} 名 ／ 全 {result.bookings.length} 件（キャンセル含む）
          </p>
        </div>
        <Link
          href="/admin/tours"
          className="inline-block border border-line bg-paper-100 hover:bg-paper-200 text-ink-600 text-[13px] tracking-[0.15em] px-6 py-3 transition text-center"
        >
          ← ツアー一覧
        </Link>
      </div>

      {/* 一覧 */}
      {result.bookings.length === 0 ? (
        <p className="text-center text-[13px] font-light text-ink-500 leading-loose2 py-16">
          まだ予約はありません。
        </p>
      ) : (
        <div className="space-y-3">
          {result.bookings.map((b) => {
            const dateLabel = new Date(b.bookedAt).toLocaleString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <Link
                key={b.bookingId}
                href={`/admin/tours/${tourId}/bookings/${b.userId}`}
                className="block border border-line bg-paper-50 p-4 hover:bg-paper-100 transition"
              >
                <div className="flex gap-4 items-start">
                  {/* アバター */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-paper-200 overflow-hidden">
                    {b.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.avatarUrl}
                        alt={b.displayName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-base tracking-[0.04em] text-ink-900">
                        {b.displayName}
                      </span>
                      {b.idVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sage-700 font-light">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
                          本人確認済み
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-500 font-light">
                          未確認
                        </span>
                      )}
                      <span
                        className={`inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic ${STATUS_COLOR[b.status]}`}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>

                    <div className="mt-2 text-[12px] text-ink-500 font-light leading-relaxed">
                      <div>集合: {b.meetingPointName}</div>
                      <div>
                        支払い: ¥{b.amountPaid.toLocaleString()} ／ {dateLabel}
                      </div>
                    </div>
                  </div>

                  {/* 矢印 */}
                  <span className="flex-shrink-0 self-center font-display italic text-xs text-ink-500">
                    詳細 →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
