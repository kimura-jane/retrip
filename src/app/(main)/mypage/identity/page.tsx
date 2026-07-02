import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id_document_url: string | null;
  id_verified: boolean | null;
  id_rejected_at: string | null;
  id_rejection_reason: string | null;
};

type VerificationStatus = "verified" | "reviewing" | "rejected" | "none";

export default async function IdentityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("id_document_url,id_verified,id_rejected_at,id_rejection_reason")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const profile = data;
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* 戻るリンク */}
      <Link
        href="/mypage"
        className="font-display italic text-xs text-ink-500 hover:text-coral-700 transition-colors"
      >
        ← マイページ
      </Link>

      {/* ページヘッダー */}
      <header className="mt-6 mb-14">
        <div className="flex items-start justify-between">
          <h1 className="font-serif text-3xl text-ink-900 leading-loose2">
            本人確認
          </h1>
          <span className="flex items-center gap-2 text-xs text-ink-500 font-light mt-2">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-500 font-light leading-loose">
          ツアー参加には本人確認書類のご提出が必要です。運転免許証、パスポート、マイナンバーカード（表面のみ）のいずれかをご提出ください。
        </p>
        <div className="mt-6 h-px w-12 bg-coral-500" />
      </header>

      {/* ステータス別コンテンツ */}
      {status === "verified" && (
        <div className="space-y-4">
          <p className="text-sm text-ink-900 font-light leading-loose">
            本人確認が完了しています。ツアーの予約・参加が可能です。
          </p>
        </div>
      )}

      {status === "none" && (
        <div className="space-y-6">
          <p className="text-sm text-ink-900 font-light leading-loose">
            まだ本人確認書類が提出されていません。下のボタンから提出してください。
          </p>
          <Link
            href="/mypage/id-upload"
            className="inline-block border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2"
          >
            書類を提出する
          </Link>
        </div>
      )}

      {status === "reviewing" && (
        <div className="space-y-4">
          <p className="text-sm text-ink-900 font-light leading-loose">
            書類を確認中です。申請から3営業日以内に判定結果をお知らせします。
          </p>
        </div>
      )}

      {status === "rejected" && (
        <div className="space-y-6">
          <div className="border-l-2 border-coral-700 pl-5 py-2 space-y-4">
            <div>
              <p className="text-sm text-ink-900 font-light">
                本人確認書類が却下されました。
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
                  却下理由
                </p>
                <p className="text-sm text-ink-900 font-light leading-loose whitespace-pre-wrap">
                  {profile.id_rejection_reason}
                </p>
              </div>
            )}
          </div>
          <Link
            href="/mypage/id-upload"
            className="inline-block border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2"
          >
            再提出する
          </Link>
          <p className="text-xs text-ink-500 font-light">
            再提出後、3営業日以内に判定結果をお知らせします。
          </p>
        </div>
      )}
    </div>
  );
}
