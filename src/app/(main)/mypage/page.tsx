import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/features/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/app/(main)/_components/favorite-button";
import { toggleWaitlistAction } from "@/features/waitlists/actions";
import { GENDER_LABELS } from "@/features/user/schema";
import type { Gender, BookingStatus } from "@/types/database";

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
  avatar_url: string | null;
  id_document_url: string | null;
  id_verified: boolean | null;
  id_rejected_at: string | null;
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

type FavoriteWithTour = {
  tour_id: string;
  tours: {
    id: string;
    title: string;
    destination: string;
    departure_date: string;
    price: number;
    cover_image_url: string | null;
    theme_tags: string[] | null;
  } | null;
};

type WaitlistWithTour = {
  id: string;
  tour_id: string;
  status: "waiting" | "notified";
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
      "display_name,bio,gender,birth_date,avatar_url,id_document_url,id_verified,id_rejected_at"
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

  // 気になるツアー一覧を取得（新規テーブルの型生成までは untyped client を使用）
  const favoritesClient = supabase as unknown as SupabaseClient;
  const { data: favoritesData } = await favoritesClient
    .from("favorites")
    .select(
      "tour_id,tours(id,title,destination,departure_date,price,cover_image_url,theme_tags)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favorites =
    (favoritesData as unknown as FavoriteWithTour[] | null) ?? [];

  // キャンセル待ち中のツアー一覧を取得
  const { data: waitlistsData } = await favoritesClient
    .from("waitlists")
    .select(
      "id,tour_id,status,tours(id,title,destination,departure_date,cover_image_url)"
    )
    .eq("user_id", user.id)
    .in("status", ["waiting", "notified"])
    .order("created_at", { ascending: true });

  const waitlists =
    (waitlistsData as unknown as WaitlistWithTour[] | null) ?? [];

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

  // 本人確認ステータス
  const hasSubmittedId = !!profile?.id_document_url;
  const isVerified = profile?.id_verified === true;
  const isRejected = !isVerified && !hasSubmittedId && !!profile?.id_rejected_at;

  let idStatus: VerificationStatus;
  if (isVerified) idStatus = "verified";
  else if (isRejected) idStatus = "rejected";
  else if (hasSubmittedId) idStatus = "reviewing";
  else idStatus = "none";

  const idStatusLabel: Record<VerificationStatus, string> = {
    verified: "承認済み",
    reviewing: "審査中",
    rejected: "却下",
    none: "未提出",
  };
  const idStatusColor: Record<VerificationStatus, string> = {
    verified: "text-sage-500",
    reviewing: "text-coral-500",
    rejected: "text-coral-700",
    none: "text-ink-500",
  };

  // 予約カード
  const renderBookingCard = (b: BookingWithTour) => {
    if (!b.tours) return null;
    return (
      <Link
        key={b.id}
        href={`/tours/${b.tours.id}`}
        className="group flex items-center gap-4 border border-line bg-paper-100 p-3 hover:border-ink-500 transition-colors"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-paper-200">
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
          <p className="text-[11px] tracking-wide text-ink-500 font-light">
            {b.tours.destination} · {fmtDate(b.tours.departure_date)}
          </p>
          <p className="mt-0.5 font-serif text-[15px] text-ink-900 truncate">
            {b.tours.title}
          </p>
          <span className="mt-0.5 inline-block text-[11px] text-coral-700">
            {statusLabel[b.status]}
          </span>
        </div>
      </Link>
    );
  };

  const renderFavoriteCard = (favorite: FavoriteWithTour) => {
    if (!favorite.tours) return null;
    const tour = favorite.tours;
    return (
      <div key={favorite.tour_id} className="group relative">
        <FavoriteButton
          tourId={tour.id}
          isFavorite
          nextPath="/mypage"
          variant="card"
        />
        <Link
          href={`/tours/${tour.id}`}
          className="flex items-center gap-4 border border-line bg-paper-100 p-3 hover:border-ink-500 transition-colors"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-paper-200">
            {tour.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tour.cover_image_url}
                alt={tour.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1 pr-10">
            <p className="text-[11px] tracking-wide text-ink-500 font-light">
              {tour.destination} · {fmtDate(tour.departure_date)}
            </p>
            <p className="mt-0.5 font-serif text-[15px] text-ink-900 truncate">
              {tour.title}
            </p>
            <span className="mt-0.5 inline-block font-display text-[13px] text-coral-700">
              ¥{tour.price.toLocaleString()}
            </span>
          </div>
        </Link>
      </div>
    );
  };

  const renderWaitlistCard = (entry: WaitlistWithTour) => {
    if (!entry.tours) return null;
    const tour = entry.tours;
    return (
      <div
        key={entry.id}
        className="relative border border-line bg-paper-100 p-3"
      >
        <Link href={`/tours/${tour.id}`} className="flex items-center gap-4 pr-16">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-paper-200">
            {tour.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tour.cover_image_url}
                alt={tour.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-wide text-ink-500 font-light">
              {tour.destination} · {fmtDate(tour.departure_date)}
            </p>
            <p className="mt-0.5 font-serif text-[15px] text-ink-900 truncate">
              {tour.title}
            </p>
            {entry.status === "notified" && (
              <span className="mt-1 inline-block bg-coral-500 px-2 py-0.5 text-[10px] text-paper-100">
                空きが出ました
              </span>
            )}
          </div>
        </Link>
        <form action={toggleWaitlistAction} className="absolute bottom-3 right-3">
          <input type="hidden" name="tourId" value={tour.id} />
          <input type="hidden" name="next" value="/mypage" />
          <button
            type="submit"
            className="border border-line bg-paper-50 px-2.5 py-1 text-[11px] text-ink-500 hover:border-coral-500 hover:text-coral-700 transition-colors"
          >
            解除
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* ページヘッダー */}
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-ink-900">
          マイページ
        </h1>
      </header>

      {/* プロフィール */}
      <section className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-serif text-base text-ink-900">プロフィール</h2>
          <Link
            href="/mypage/edit"
            className="text-xs text-coral-700 hover:text-coral-500 transition-colors"
          >
            編集 →
          </Link>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <Avatar className="h-20 w-20">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} />
            ) : null}
            <AvatarFallback className="bg-paper-50 text-ink-500 font-serif text-xl">
              {profile?.display_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-serif text-xl text-ink-900 leading-tight">
              {profile?.display_name ?? "未設定"}
            </p>
            <p className="text-xs text-ink-500 font-light mt-1.5 tracking-wide">
              {user.email}
            </p>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[11px] text-ink-500 font-light mb-1">
              自己紹介
            </dt>
            <dd className="text-ink-900 font-light leading-loose whitespace-pre-wrap">
              {profile?.bio || "未設定"}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <dt className="text-[11px] text-ink-500 font-light mb-1">
                性別
              </dt>
              <dd className="text-ink-900 font-light">
                {profile?.gender ? GENDER_LABELS[profile.gender] : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-500 font-light mb-1">
                生年月日
              </dt>
              <dd className="text-ink-900 font-light">
                {profile?.birth_date ?? "未設定"}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      {/* My Trip */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink-900 italic mb-4">My Trip</h2>

        {/* 今後の予約 */}
        <div className="mb-5">
          <h3 className="font-serif text-base text-ink-900 mb-3">今後の旅</h3>
          {upcoming.length === 0 ? (
            <p className="text-[13px] font-light text-ink-500 leading-loose">
              予約中のツアーはありません。
              <Link href="/tours" className="ml-2 text-coral-700 hover:text-coral-500">
                ツアーを探す →
              </Link>
            </p>
          ) : (
            <div className="space-y-2">{upcoming.map(renderBookingCard)}</div>
          )}
        </div>

        {/* 過去の参加 */}
        {past.length > 0 && (
          <div>
            <h3 className="font-serif text-base text-ink-900 mb-3">これまでの旅</h3>
            <div className="space-y-2">{past.map(renderBookingCard)}</div>
          </div>
        )}
      </section>

      {/* 気になるリスト */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink-900 italic mb-4">
          気になるリスト
        </h2>
        {favorites.length === 0 ? (
          <p className="text-[13px] font-light text-ink-500 leading-loose">
            気になるツアーはまだありません。
          </p>
        ) : (
          <div className="space-y-2">{favorites.map(renderFavoriteCard)}</div>
        )}
      </section>

      {/* キャンセル待ち中 */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-ink-900 italic mb-4">
          キャンセル待ち中
        </h2>
        {waitlists.length === 0 ? (
          <p className="text-[13px] font-light text-ink-500 leading-loose">
            キャンセル待ち中のツアーはありません。
          </p>
        ) : (
          <div className="space-y-2">{waitlists.map(renderWaitlistCard)}</div>
        )}
      </section>

      {/* 設定 */}
      <section>
        <h2 className="font-serif text-base text-ink-900 mb-4">設定</h2>

        <nav className="divide-y divide-line border-y border-line">
          {/* 本人確認 */}
          <Link
            href="/mypage/identity"
            className="flex items-center justify-between py-3 px-1 hover:bg-paper-50 transition-colors group"
          >
            <div>
              <p className="text-[14px] text-ink-900">本人確認</p>
              <p className={`text-[11px] font-light mt-0.5 ${idStatusColor[idStatus]}`}>
                {idStatusLabel[idStatus]}
              </p>
            </div>
            <span className="text-[11px] text-ink-500 group-hover:text-ink-900">
              →
            </span>
          </Link>

          {/* Re:Trip について（LP へ外部リンク） */}
          <a
            href="https://kimura-jane.github.io/retrip-lp/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-3 px-1 hover:bg-paper-50 transition-colors group"
          >
            <div>
              <p className="text-[14px] text-ink-900">Re:Trip について</p>
              <p className="text-[11px] text-ink-500 font-light mt-0.5">
                サービスの世界観をご紹介します
              </p>
            </div>
            <span className="text-[11px] text-ink-500 group-hover:text-ink-900">
              開く ↗
            </span>
          </a>

          {/* 通知設定（未実装） */}
          <div className="flex items-center justify-between py-3 px-1 opacity-40">
            <div>
              <p className="text-[14px] text-ink-900">通知設定</p>
              <p className="text-[11px] text-ink-500 font-light mt-0.5">準備中</p>
            </div>
            <span className="text-[11px] text-ink-500">準備中</span>
          </div>

          {/* チャットカスタマイズ */}
          <Link
            href="/mypage/chat-customize"
            className="flex items-center justify-between py-3 px-1 hover:bg-paper-50 transition-colors group"
          >
            <div>
              <p className="text-[14px] text-ink-900">チャットカスタマイズ</p>
              <p className="text-[11px] text-ink-500 font-light mt-0.5">
                メッセージの色とフォントを選ぶ
              </p>
            </div>
            <span className="text-[11px] text-ink-500 group-hover:text-ink-900">
              →
            </span>
          </Link>

          {/* サインアウト */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-between py-3 px-1 hover:bg-paper-50 transition-colors group text-left"
            >
              <div>
                <p className="text-[14px] text-ink-900">サインアウト</p>
                <p className="text-[11px] text-ink-500 font-light mt-0.5">
                  一時的にログアウトします
                </p>
              </div>
              <span className="text-[11px] text-ink-500 group-hover:text-ink-900">
                →
              </span>
            </button>
          </form>

          {/* 退会 */}
          <Link
            href="/settings/withdraw"
            className="flex items-center justify-between py-3 px-1 hover:bg-paper-50 transition-colors group"
          >
            <div>
              <p className="text-[14px] text-coral-700">退会する</p>
              <p className="text-[11px] text-ink-500 font-light mt-0.5">
                アカウントを論理削除します
              </p>
            </div>
            <span className="text-[11px] text-coral-700 group-hover:text-coral-500">
              →
            </span>
          </Link>
        </nav>
      </section>
    </div>
  );
}
