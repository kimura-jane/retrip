import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, Gender } from "@/types/database";
import { BanControls } from "./ban-controls";
import { CancelControls } from "./cancel-controls";
import { getBookingByTourAndUserAction } from "@/features/booking/admin-actions";

export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  prefer_not_to_say: "無回答",
};

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "保留",
  confirmed: "確定",
  cancelled: "キャンセル",
  attended: "参加済み",
  no_show: "不参加",
};

const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "bg-paper-200 text-ink-600",
  confirmed: "bg-coral-100 text-coral-700",
  cancelled: "bg-paper-200 text-ink-500",
  attended: "bg-sage-100 text-sage-700",
  no_show: "bg-paper-300 text-ink-600",
};

type UserRow = {
  id: string;
  display_name: string;
  birth_date: string;
  gender: Gender;
  bio: string | null;
  avatar_url: string | null;
  id_document_url: string | null;
  id_verified: boolean;
  id_verified_at: string | null;
  id_rejected_at: string | null;
  id_rejection_reason: string | null;
  banned: boolean;
  chat_banned: boolean;
  created_at: string;
};

function calcAge(birthDate: string): number | null {
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function extractPath(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/\/id_documents\/(.+?)(?:\?|$)/);
  if (m) return m[1] ?? null;
  if (!url.startsWith("http")) return url;
  return null;
}

export default async function AdminBookingUserDetailPage({
  params,
}: {
  params: Promise<{ tourId: string; userId: string }>;
}) {
  const { tourId, userId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase
    .from("users")
    .select(
      "id, display_name, birth_date, gender, bio, avatar_url, id_document_url, id_verified, id_verified_at, id_rejected_at, id_rejection_reason, banned, chat_banned, created_at"
    )
    .eq("id", userId)
    .maybeSingle<UserRow>();

  if (!userData) {
    notFound();
  }

  // 予約情報を取得（キャンセル操作用）
  const bookingResult = await getBookingByTourAndUserAction(tourId, userId);
  const booking = bookingResult.success ? bookingResult.booking : null;

  // 本人確認画像の署名付きURL
  let signedUrl: string | null = null;
  const path = extractPath(userData.id_document_url);
  if (path) {
    const { data: signed } = await supabase.storage
      .from("id_documents")
      .createSignedUrl(path, 60 * 60);
    signedUrl = signed?.signedUrl ?? null;
  }

  const age = calcAge(userData.birth_date);
  const birthLabel = userData.birth_date
    ? new Date(userData.birth_date).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  let verifyStatus: { label: string; className: string };
  if (userData.id_verified) {
    verifyStatus = {
      label: "本人確認済み",
      className: "bg-sage-100 text-sage-700",
    };
  } else if (userData.id_rejected_at) {
    verifyStatus = {
      label: "却下",
      className: "bg-coral-100 text-coral-700",
    };
  } else if (userData.id_document_url) {
    verifyStatus = {
      label: "審査待ち",
      className: "bg-paper-200 text-ink-600",
    };
  } else {
    verifyStatus = {
      label: "未提出",
      className: "bg-paper-200 text-ink-500",
    };
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-6">
        <div>
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Member
          </p>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
            {userData.display_name}
          </h1>
        </div>
        <Link
          href={`/admin/tours/${tourId}/bookings`}
          className="inline-block border border-line bg-paper-100 hover:bg-paper-200 text-ink-600 text-[13px] tracking-[0.15em] px-6 py-3 transition text-center"
        >
          ← 予約者一覧
        </Link>
      </div>

      {/* BAN状態の警告表示 */}
      {(userData.banned || userData.chat_banned) && (
        <div className="border border-coral-300 bg-coral-50 p-4">
          <p className="text-[13px] text-coral-700 font-medium">
            {userData.banned
              ? "このユーザーはアクセスBAN中です（予約・チャットすべて不可）"
              : "このユーザーはチャットBAN中です（チャットのみ不可）"}
          </p>
        </div>
      )}

      {/* 予約情報 */}
      {booking && (
        <section className="border border-line bg-paper-50 p-5 space-y-4">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Booking
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic ${BOOKING_STATUS_COLOR[booking.status]}`}
            >
              {BOOKING_STATUS_LABEL[booking.status]}
            </span>
            <span className="text-[12px] text-ink-500 font-light">
              予約日:{" "}
              {new Date(booking.bookedAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[11px] text-ink-500 font-light">集合場所</p>
              <p className="text-ink-900">{booking.meetingPointName}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-500 font-light">支払額</p>
              <p className="text-ink-900">
                ¥{booking.amountPaid.toLocaleString()}
              </p>
            </div>
            {booking.stripePaymentIntentId && (
              <div className="sm:col-span-2">
                <p className="text-[11px] text-ink-500 font-light">
                  Stripe Payment Intent
                </p>
                <p className="text-ink-900 font-mono text-[11px] break-all">
                  {booking.stripePaymentIntentId}
                </p>
              </div>
            )}
          </div>

          <CancelControls
            tourId={tourId}
            userId={userId}
            bookingId={booking.bookingId}
            status={booking.status}
            amountPaid={booking.amountPaid}
            hasPaymentIntent={!!booking.stripePaymentIntentId}
          />
        </section>
      )}

      {/* プロフィール */}
      <section className="border border-line bg-paper-50 p-5 space-y-5">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 flex-shrink-0 rounded-full bg-paper-200 overflow-hidden">
            {userData.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userData.avatar_url}
                alt={userData.display_name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="font-serif text-lg text-ink-900">
              {userData.display_name}
            </p>
            <span
              className={`mt-1 inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic ${verifyStatus.className}`}
            >
              {verifyStatus.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <p className="text-[11px] text-ink-500 font-light">生年月日</p>
            <p className="text-ink-900">
              {birthLabel}
              {age !== null && `（${age}歳）`}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-500 font-light">性別</p>
            <p className="text-ink-900">{GENDER_LABEL[userData.gender]}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-ink-500 font-light mb-1">自己紹介</p>
          <p className="text-[13px] text-ink-900 font-light leading-loose whitespace-pre-wrap">
            {userData.bio?.trim() ? userData.bio : "（未記入）"}
          </p>
        </div>
      </section>

      {/* 本人確認 */}
      <section className="border border-line bg-paper-50 p-5 space-y-4">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Identity
        </p>

        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <p className="text-[11px] text-ink-500 font-light">ステータス</p>
            <p className="text-ink-900">{verifyStatus.label}</p>
          </div>
          {userData.id_verified_at && (
            <div>
              <p className="text-[11px] text-ink-500 font-light">承認日</p>
              <p className="text-ink-900">
                {new Date(userData.id_verified_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
          )}
          {userData.id_rejected_at && (
            <div>
              <p className="text-[11px] text-ink-500 font-light">却下日</p>
              <p className="text-ink-900">
                {new Date(userData.id_rejected_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
          )}
        </div>

        {userData.id_rejection_reason && (
          <div>
            <p className="text-[11px] text-ink-500 font-light mb-1">却下理由</p>
            <p className="text-[13px] text-coral-700 font-light leading-loose whitespace-pre-wrap">
              {userData.id_rejection_reason}
            </p>
          </div>
        )}

        <div>
          <p className="text-[11px] text-ink-500 font-light mb-2">
            本人確認書類
          </p>
          {signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt="本人確認書類"
              className="max-w-full max-h-[28rem] rounded border border-line"
            />
          ) : userData.id_document_url ? (
            <p className="text-[12px] text-coral-700 font-light">
              書類URLの読み込みに失敗しました。
            </p>
          ) : (
            <p className="text-[12px] text-ink-500 font-light">
              書類は提出されていません。
            </p>
          )}
        </div>
      </section>

      {/* BAN操作 */}
      <section className="border border-line bg-paper-50 p-5 space-y-4">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Moderation
        </p>
        <BanControls
          userId={userData.id}
          isBanned={userData.banned}
          isChatBanned={userData.chat_banned}
        />
      </section>
    </div>
  );
}
