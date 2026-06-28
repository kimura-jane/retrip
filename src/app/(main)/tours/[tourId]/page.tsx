import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, MeetingPoint } from "@/types/database";
import BookingPanel from "./booking-panel";
import RouteMap from "./_components/route-map";

type TourRow = Database["public"]["Tables"]["tours"]["Row"];

type Params = Promise<{ tourId: string }>;

export default async function TourDetailPage({ params }: { params: Params }) {
  const { tourId } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .maybeSingle();

  const tour = data as TourRow | null;

  if (!tour) {
    notFound();
  }

  const isSample = (tour.theme_tags ?? []).includes("サンプル");
  const tags = (tour.theme_tags ?? []).filter((x: string) => x !== "サンプル");
  const meetingPoints = (tour.meeting_points ?? []) as MeetingPoint[];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // このツアーに対する自分の予約状況を確認する（cancelled は予約扱いしない）
  // maybeSingle にジェネリックを渡して型を確定させる（このリポジトリの流儀）
  let existingBooking:
    | { id: string; status: string; meeting_point_id: string | null }
    | null = null;

  if (user) {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("id, status, meeting_point_id")
      .eq("tour_id", tourId)
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .maybeSingle<{
        id: string;
        status: string;
        meeting_point_id: string | null;
      }>();

    existingBooking = bookingData ?? null;
  }

  // 予約済みの集合場所名を求める（表示用）
  const bookedMeetingPoint = existingBooking?.meeting_point_id
    ? meetingPoints.find((p) => p.id === existingBooking?.meeting_point_id) ?? null
    : null;

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      : "";

  // 日帰り（day_trip）なら return_date は出さない。
  // overnight でかつ departure_date と異なる場合のみ Return を表示する。
  const showReturnDate =
    tour.tour_type === "overnight" &&
    !!tour.return_date &&
    tour.return_date !== tour.departure_date;

  // 地図に表示する点が1つ以上あるか
  const hasMapPoints = meetingPoints.some(
    (p) => typeof p.lat === "number" && typeof p.lng === "number"
  );

  return (
    <>
      {/* SAMPLE 帯 */}
      {isSample && (
        <div className="bg-coral-500 text-paper-100 text-center py-3 text-[11px] tracking-widest2 uppercase font-display italic">
          Sample Tour ─ これはサンプルツアーです。実際の運行は準備中です。
        </div>
      )}

      {/* パンくず */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-6 text-[11px] tracking-widest2 uppercase text-ink-500 font-display italic">
        <Link href="/" className="hover:text-coral-500">Journeys</Link>
        <span className="mx-2">/</span>
        <span>{tour.destination}</span>
      </div>

      {/* ヒーロー */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pt-6 pb-12">
        <div className="relative aspect-[16/10] overflow-hidden bg-paper-200">
          {tour.cover_image_url && (
            <Image
              src={tour.cover_image_url}
              alt={tour.title}
              fill
              priority
              className="object-cover"
            />
          )}
          {isSample && (
            <span className="absolute top-6 left-6 bg-coral-500 text-paper-100 text-[12px] tracking-widest2 uppercase px-4 py-2 font-display italic">
              Sample
            </span>
          )}
        </div>

        <div className="mt-10 max-w-3xl">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            {tour.tour_type === "overnight" ? "Overnight Journey" : "Day Trip"}
          </p>
          <h1 className="mt-4 font-serif text-3xl md:text-5xl tracking-[0.04em] leading-[1.5] text-ink-900">
            {tour.title}
          </h1>
          <div className="mt-6 text-[13px] tracking-[0.08em] text-ink-500 font-light leading-loose2">
            {tour.destination}
            <span className="mx-3">·</span>
            {fmt(tour.departure_date)}
            {showReturnDate && (
              <>
                <span className="mx-2">〜</span>
                {fmt(tour.return_date)}
              </>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tracking-[0.15em] text-ink-500 font-light">
              {tags.map((t: string) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 本文 + サイドバー */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-20 grid lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
        {/* 左：description + 集合場所 */}
        <div>
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            About this journey
          </p>
          <h2 className="mt-4 font-serif text-2xl tracking-[0.04em] text-ink-900">
            旅のしおり
          </h2>
          <div className="mt-8 whitespace-pre-line text-[14px] font-light leading-loose2 tracking-[0.06em] text-ink-600">
            {tour.description}
          </div>

          {/* 集合場所 */}
          {meetingPoints.length > 0 && (
            <div className="mt-20">
              <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
                Meeting Points
              </p>
              <h2 className="mt-4 font-serif text-2xl tracking-[0.04em] text-ink-900">
                集合場所
              </h2>
              <p className="mt-3 text-[12px] font-light text-ink-500 leading-loose2">
                新宿集合がメインですが、途中のサービスエリアでの乗車、現地合流もできます。解散も同じく途中下車・現地解散できます。
              </p>

              {/* ルートマップ */}
              {hasMapPoints && (
                <div className="mt-8">
                  <RouteMap meetingPoints={meetingPoints} />
                  <p className="mt-3 text-[11px] font-light text-ink-500 leading-loose2">
                    ※ 地図上の番号は集合・経由・現地の順序を示しています。実際の運行ルートとは異なる場合があります。
                  </p>
                </div>
              )}

              <ul className="mt-8 space-y-6">
                {meetingPoints.map((p, i) => {
                  const isMain = i === 0;
                  return (
                    <li
                      key={p.id}
                      className="grid grid-cols-[100px_1fr] gap-6 border-t border-line pt-6"
                    >
                      <div
                        className={`font-display italic text-[13px] tracking-widest2 ${
                          isMain ? "text-coral-700" : "text-ink-500"
                        }`}
                      >
                        {p.time}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-lg tracking-[0.04em] text-ink-900">
                            {p.name}
                          </h3>
                          {isMain && (
                            <span className="text-[10px] tracking-widest2 uppercase bg-ink-900 text-paper-100 px-2 py-0.5 font-display italic">
                              Main
                            </span>
                          )}
                        </div>
                        {p.note && (
                          <p className="mt-2 text-[12px] font-light text-ink-500 leading-loose2">
                            {p.note}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* 右：サイドバー */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="border border-line bg-paper-50 p-8">
            <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
              Details
            </p>

            <div className="mt-6 font-display text-3xl text-ink-900">
              ¥{tour.price.toLocaleString()}
              <span className="ml-2 text-[10px] tracking-widest2 uppercase text-ink-500">
                / seat
              </span>
            </div>

            <dl className="mt-8 space-y-5 text-[12px]">
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="tracking-widest2 uppercase text-ink-500 font-display italic">Type</dt>
                <dd className="font-serif text-ink-900">
                  {tour.tour_type === "overnight" ? "1泊" : "日帰り"}
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="tracking-widest2 uppercase text-ink-500 font-display italic">Depart</dt>
                <dd className="font-serif text-ink-900">{fmt(tour.departure_date)}</dd>
              </div>
              {showReturnDate && (
                <div className="grid grid-cols-[80px_1fr] gap-4">
                  <dt className="tracking-widest2 uppercase text-ink-500 font-display italic">Return</dt>
                  <dd className="font-serif text-ink-900">{fmt(tour.return_date)}</dd>
                </div>
              )}
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="tracking-widest2 uppercase text-ink-500 font-display italic">Seats</dt>
                <dd className="font-serif text-ink-900">
                  {tour.capacity_total}名
                  {tour.capacity_male != null && tour.capacity_female != null && (
                    <span className="ml-2 text-[11px] text-ink-500 font-light">
                      （男{tour.capacity_male}・女{tour.capacity_female}）
                    </span>
                  )}
                </dd>
              </div>
              {(tour.age_range_min || tour.age_range_max) && (
                <div className="grid grid-cols-[80px_1fr] gap-4">
                  <dt className="tracking-widest2 uppercase text-ink-500 font-display italic">Age</dt>
                  <dd className="font-serif text-ink-900">
                    {tour.age_range_min ?? "?"} 〜 {tour.age_range_max ?? "?"} 歳
                  </dd>
                </div>
              )}
            </dl>

            {/* CTA */}
            {isSample ? (
              <div className="mt-10">
                <button
                  disabled
                  className="w-full px-6 py-4 bg-ink-900/40 text-paper-100 text-[12px] tracking-widest2 uppercase cursor-not-allowed"
                >
                  申し込み（準備中）
                </button>
                <p className="mt-4 text-[11px] font-light text-ink-500 leading-loose2 text-center">
                  サンプルツアーにつき、お申し込み機能は近日公開予定です。
                </p>
              </div>
            ) : !user ? (
              <div className="mt-10">
                <Link
                  href="/login"
                  className="block w-full text-center px-6 py-4 bg-ink-900 text-paper-100 text-[12px] tracking-widest2 uppercase hover:bg-coral-700 transition-colors"
                >
                  ログインして申し込む
                </Link>
                <p className="mt-4 text-[11px] font-light text-ink-500 leading-loose2 text-center">
                  ご予約にはログインと本人確認が必要です。
                </p>
              </div>
            ) : existingBooking ? (
              <div className="mt-10">
                <div className="border border-sage-500 bg-sage-50 px-5 py-5 text-center">
                  <p className="font-display italic text-[11px] tracking-widest2 uppercase text-sage-700">
                    Reserved
                  </p>
                  <p className="mt-2 font-serif text-[15px] text-ink-900 tracking-[0.04em]">
                    予約済みのツアーです
                  </p>
                  {bookedMeetingPoint && (
                    <p className="mt-2 text-[12px] font-light text-ink-500 leading-loose2">
                      集合場所：{bookedMeetingPoint.name}
                      {bookedMeetingPoint.time ? `（${bookedMeetingPoint.time}）` : ""}
                    </p>
                  )}
                </div>
                <Link
                  href="/mypage"
                  className="mt-4 block w-full text-center px-6 py-4 bg-ink-900 text-paper-100 text-[12px] tracking-widest2 uppercase hover:bg-coral-700 transition-colors"
                >
                  マイページで予約を確認
                </Link>
                <p className="mt-4 text-[11px] font-light text-ink-500 leading-loose2 text-center">
                  ツアーの旅チャットや詳細はマイページからご確認いただけます。
                </p>
              </div>
            ) : (
              <BookingPanel tourId={tour.id} meetingPoints={meetingPoints} />
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
