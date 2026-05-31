import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ tour?: string }>;

type TourRow = {
  id: string;
  title: string;
  price: number;
  meeting_points: { id: string; name?: string; time?: string }[];
};

type BookingRow = {
  id: string;
  status: string;
  meeting_point_id: string | null;
  amount_paid: number | null;
};

export default async function BookingCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tour: tourId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ツアー情報の取得
  let tour: TourRow | null = null;
  if (tourId) {
    const { data } = await supabase
      .from("tours")
      .select("id, title, price, meeting_points")
      .eq("id", tourId)
      .maybeSingle();
    tour = (data as unknown as TourRow) ?? null;
  }

  // 予約情報の取得（Webhook がまだ書いていない可能性あり）
  let booking: BookingRow | null = null;
  if (user && tourId) {
    const { data } = await supabase
      .from("bookings")
      .select("id, status, meeting_point_id, amount_paid")
      .eq("tour_id", tourId)
      .eq("user_id", user.id)
      .maybeSingle();
    booking = (data as unknown as BookingRow) ?? null;
  }

  const isConfirmed = booking?.status === "confirmed";

  // 集合場所の表示名・時刻を解決
  const meetingPoint =
    booking?.meeting_point_id && tour
      ? (tour.meeting_points ?? []).find(
          (mp) => mp.id === booking?.meeting_point_id
        )
      : undefined;

  const amount = booking?.amount_paid ?? tour?.price ?? null;

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      {/* eyebrow */}
      <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700 text-center">
        {isConfirmed ? "Reservation Confirmed" : "Processing"}
      </p>

      {/* 見出し */}
      <h1 className="mt-3 font-serif text-2xl text-ink-900 text-center leading-loose2">
        {isConfirmed ? "ご予約が完了しました" : "決済を確認しています"}
      </h1>

      {/* リード文 */}
      <p className="mt-4 text-[13px] font-light text-ink-500 leading-loose2 text-center">
        {isConfirmed
          ? "ご予約ありがとうございます。当日お会いできるのを楽しみにしています。"
          : "決済の確認に少しお時間がかかる場合があります。数十秒後にこのページを再読み込みしてください。"}
      </p>

      {/* 予約サマリー */}
      {tour && (
        <div className="mt-10 border border-line bg-paper-100 px-6 py-6">
          <p className="font-display italic text-[11px] tracking-widest2 uppercase text-ink-500">
            Tour
          </p>
          <p className="mt-1 font-serif text-[16px] text-ink-900">
            {tour.title}
          </p>

          {meetingPoint && (
            <div className="mt-5 border-t border-line pt-5">
              <p className="font-display italic text-[11px] tracking-widest2 uppercase text-ink-500">
                Meeting Point
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="font-serif text-[14px] text-ink-900">
                  {meetingPoint.name}
                </span>
                {meetingPoint.time && (
                  <span className="font-display italic text-[11px] tracking-widest2 text-ink-500">
                    {meetingPoint.time}
                  </span>
                )}
              </div>
            </div>
          )}

          {amount != null && (
            <div className="mt-5 border-t border-line pt-5">
              <p className="font-display italic text-[11px] tracking-widest2 uppercase text-ink-500">
                Amount
              </p>
              <p className="mt-1 font-serif text-[14px] text-ink-900">
                ¥{amount.toLocaleString("ja-JP")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 導線 */}
      <div className="mt-10 space-y-3">
        {isConfirmed && tourId && (
          <Link
            href={`/tours/${tourId}`}
            className="block w-full px-6 py-4 bg-ink-900 text-paper-100 text-center text-[12px] tracking-widest2 uppercase hover:bg-coral-700 transition-colors"
          >
            ツアーのチャットを開く
          </Link>
        )}

        {!isConfirmed && tourId && (
          <Link
            href={`/booking/complete?tour=${tourId}`}
            className="block w-full px-6 py-4 bg-ink-900 text-paper-100 text-center text-[12px] tracking-widest2 uppercase hover:bg-coral-700 transition-colors"
          >
            状況を再確認する
          </Link>
        )}

        <Link
          href="/tours"
          className="block w-full border border-line bg-paper-100 px-6 py-4 text-center text-[12px] tracking-widest2 uppercase text-ink-900 hover:border-ink-500 transition-colors"
        >
          ツアー一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
