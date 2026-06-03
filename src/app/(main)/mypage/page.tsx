import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GENDER_LABELS } from "@/features/user/schema";
import { ChatThemeForm } from "./chat-theme-form";
import type { Gender, ChatThemeColor, ChatFont, BookingStatus } from "@/types/database";

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
  avatar_url: string | null;
  id_document_url: string | null;
  id_verified: boolean | null;
  id_rejected_at: string | null;
  id_rejection_reason: string | null;
  chat_theme_color: ChatThemeColor | null;
  chat_font: ChatFont | null;
};

type VerificationStatus = "verified" | "reviewing" | "rejected" | "none";

// 予約 + ツアー情報（JOIN 結果）
type BookingWithTour = {
  id: string;
  status: BookingStatus;
  amount_paid: number;
  tours: {
    id: string;
    title: string;
    destination: string;
    departure_date: string;
    cover_image_url: string | null;
  } | null;
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select(
      "display_name,bio,gender,birth_date,avatar_url,id_document_url,id_verified,id_rejected_at,id_rejection_reason,chat_theme_color,chat_font"
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;

  // 予約一覧を取得（cancelled は除外、ツアー情報も JOIN）
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(
      "id,status,amount_paid,tours(id,title,destination,departure_date,cover_image_url)"
    )
    .eq("user_id", user.id)
    .neq("status", "cancelled");

  const bookings = (bookingsData as unknown as BookingWithTour[] | null) ?? [];

  // 出発日で「今後」「過去」に振り分け
  const now = Date.now();
  const upcoming: BookingWithTour[] = [];
  const past: BookingWithTour[] = [];
  for (const b of bookings) {
    if (!b.tours) continue;
    const depart = new Date(b.tours.departure_date).getTime();
    if (!isNaN(depart) && depart >= now) {
      upcoming.push(b);
    } else {
      past.push(b);
    }
  }
  // 今後は出発が近い順、過去は新しい順
  upcoming.sort(
    (a, b) =>
      new Date(a.tours!.departure_date).getTime() -
      new Date(b.tours!.departure_date).getTime()
  );
  past.sort(
    (a, b) =>
      new Date(b.tours!.departure_date).getTime() -
      new Date(a.tours!.departure_date).getTime()
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const statusLabel: Record<BookingStatus, string> = {
    pending: "保留中",
    confirmed: "予約確定",
    cancelled: "キャンセル",
    attended: "参加済み",
    no_show: "不参加",
  };

  const hasSubmittedId = !!profile?.id_document_url;
  const isVerified = profile?.id_verified === true;
  const isRejected = !isVerified && !hasSubmittedId && !!profile?.id_rejected_at;

  let status: VerificationStatus;
  if (isVerified) status = "verified";
  else if (isRejected) status = "rejected";
  else if (hasSubmittedId) status = "reviewing";
  else status = "none";

  const statusMap: Record<VerificationStatus, { label: string; dot: string }> = {
    verified: { label: "承認済み", dot: "bg-sage-500" },
    reviewing: { label: "審査中", dot: "bg-coral-500" },
    rejected: { label: "却下", dot: "bg-coral-700" },
    none: { label: "未提出", dot: "bg-ink-500/40" },
  };
  const statusInfo = statusMap[status];

  const rejectedAtText = profile?.id_rejected_at
    ? new Date(profile.id_rejected_at).toLocaleDateString("ja-JP")
    : null;

  // 予約カード（今後・過去で共通利用）
  const renderBookingCard = (b: BookingWithTour) => {
    if (!b.tours) return null;
    return (
      <Link
        key={b.id}
        href={`/tours/${b.tours.id}`}
        className="group flex items-center gap-5 border border-line bg-paper-100 p-4 hover:border-ink-500 transition-colors"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-paper-200">
          {b.tours.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.tours.cover_image_url}
              alt={b.tours.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display italic text-[10px] tracking-widest2 uppercase text-ink-500">
            {b.tours.destination} · {fmtDate(b.tours.departure_date)}
          </p>
          <p className="mt-1 font-serif text-[15px] text-ink-900 truncate">
            {b.tours.title}
          </p>
          <span className="mt-1 inline-block text-[10px] tracking-widest2 uppercase text-coral-700 font-display italic">
            {statusLabel[b.status]}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* ページヘッダー */}
      <header className="mb-16">
        <p className="font-display italic uppercase tracking-widest2 text-xs text-coral-700">
          My Page
        </p>
        <h1 className="font-serif text-4xl text-ink-900 mt-3 leading-loose2">
          マイページ
        </h1>
        <div className="mt-6 h-px w-12 bg-coral-500" />
      </header>

      {/* プロフィール */}
      <section className="mb-16">
        <div className="flex items-start justify-between mb-8">
          <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700">
            Profile
          </p>
          <Link
            href="/mypage/edit"
            className="font-display italic text-xs text-coral-700 hover:text-coral-500 transition-colors"
          >
            edit →
          </Link>
        </div>

        <div className="flex items-center gap-6 mb-10">
          <Avatar className="h-20 w-20">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} />
            ) : null}
            <AvatarFallback className="bg-paper-50 text-ink-500 font-serif text-xl">
              {profile?.display_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-serif text-2xl text-ink-900 leading-tight">
              {profile?.display_name ?? "未設定"}
            </p>
            <p className="text-xs text-ink-500 font-light mt-1.5 tracking-wide">
              {user.email}
            </p>
          </div>
        </div>

        <dl className="space-y-6 text-sm">
          <div>
            <dt className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-2">
              About
            </dt>
            <dd className="text-ink-900 font-light leading-loose whitespace-pre-wrap">
              {profile?.bio || "未設定"}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <dt className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-2">
                Gender
              </dt>
              <dd className="text-ink-900 font-light">
                {profile?.gender ? GENDER_LABELS[profile.gender] : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-2">
                Birth
              </dt>
              <dd className="text-ink-900 font-light">
                {profile?.birth_date ?? "未設定"}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <div className="h-px w-full bg-[#E5E0D8] mb-16" />

      {/* 予約したツアー */}
      <section className="mb-16">
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-8">
          My Journeys
        </p>

        {/* 今後の予約 */}
        <div className="mb-10">
          <h2 className="font-serif text-lg text-ink-900 mb-5">今後の旅</h2>
          {upcoming.length === 0 ? (
            <p className="text-[13px] font-light text-ink-500 leading-loose">
              予約中のツアーはありません。
              <Link href="/tours" className="ml-2 text-coral-700 hover:text-coral-500">
                ツアーを探す →
              </Link>
            </p>
          ) : (
            <div className="space-y-3">{upcoming.map(renderBookingCard)}</div>
          )}
        </div>

        {/* 過去の参加 */}
        {past.length > 0 && (
          <div>
            <h2 className="font-serif text-lg text-ink-900 mb-5">これまでの旅</h2>
            <div className="space-y-3">{past.map(renderBookingCard)}</div>
          </div>
        )}
      </section>

      <div className="h-px w-full bg-[#E5E0D8] mb-16" />

      {/* 本人確認 */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700">
            Identity
          </p>
          <span className="flex items-center gap-2 text-xs text-ink-500 font-light">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </div>

        <p className="text-sm text-ink-900 font-light leading-loose mb-6">
          ツアー参加には本人確認書類のご提出が必要です。運転免許証、パスポート、マイナンバーカード（表面のみ）などをご提出ください。
        </p>

        {status === "none" && (
          <Link
            href="/mypage/id-upload"
            className="inline-block border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2"
          >
            Submit document
          </Link>
        )}

        {status === "reviewing" && (
          <p className="text-xs text-ink-500 font-light">
            書類を確認中です。申請から3営業日以内に判定結果をお知らせします。
          </p>
        )}

        {status === "rejected" && (
          <div className="border-l-2 border-coral-700 pl-5 py-2 space-y-4">
            <div>
              <p className="text-sm text-ink-900 font-light">
                本人確認書類が却下されました
              </p>
              {rejectedAtText && (
                <p className="text-xs text-ink-500 mt-1 font-light">
                  却下日：{rejectedAtText}
                </p>
              )}
            </div>
            {profile?.id_rejection_reason && (
              <div>
                <p className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-1.5">
                  Reason
                </p>
                <p className="text-sm text-ink-900 font-light leading-loose whitespace-pre-wrap">
                  {profile.id_rejection_reason}
                </p>
              </div>
            )}
            <Link
              href="/mypage/id-upload"
              className="inline-block border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2"
            >
              Resubmit
            </Link>
            <p className="text-xs text-ink-500 font-light">
              再提出後、3営業日以内に判定結果をお知らせします。
            </p>
          </div>
        )}
      </section>

      <div className="h-px w-full bg-[#E5E0D8] mb-16" />

      {/* チャットの見た目 */}
      <section className="mb-16">
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-8">
          Chat appearance
        </p>
        <ChatThemeForm
          initialColor={profile?.chat_theme_color ?? "coral"}
          initialFont={profile?.chat_font ?? "sans"}
        />
      </section>

      <div className="h-px w-full bg-[#E5E0D8] mb-16" />

      {/* アカウント */}
      <section>
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-8">
          Account
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="border border-ink-500/30 text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
