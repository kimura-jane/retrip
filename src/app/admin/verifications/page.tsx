import { createClient } from "@/lib/supabase/server";
import { VerificationRow } from "./verification-row";

export const dynamic = "force-dynamic";

type PendingUser = {
  id: string;
  display_name: string | null;
  email: string | null;
  id_document_url: string | null;
  created_at: string;
  signedUrl: string | null;
};

export default async function VerificationsPage() {
  const supabase = await createClient();

  // 未審査ユーザー（書類提出済み・未承認・未却下）を取得
  const { data: users, error } = await supabase
    .from("users")
    .select("id, display_name, email, id_document_url, created_at, id_verified, id_rejected_at")
    .not("id_document_url", "is", null)
    .eq("id_verified", false)
    .is("id_rejected_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-serif mb-4">本人確認</h1>
        <p className="text-sm text-red-600">読み込みエラー: {error.message}</p>
      </div>
    );
  }

  // 署名URL生成（id_documents バケットは private）
  const pending: PendingUser[] = await Promise.all(
    (users ?? []).map(async (u) => {
      const path = extractPath(u.id_document_url);
      let signedUrl: string | null = null;
      if (path) {
        const { data } = await supabase.storage
          .from("id_documents")
          .createSignedUrl(path, 60 * 60); // 1時間
        signedUrl = data?.signedUrl ?? null;
      }
      return {
        id: u.id,
        display_name: u.display_name,
        email: u.email,
        id_document_url: u.id_document_url,
        created_at: u.created_at,
        signedUrl,
      };
    })
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif mb-2">本人確認</h1>
      <p className="text-sm text-neutral-500 mb-8">
        未審査の提出書類: {pending.length} 件
      </p>

      {pending.length === 0 ? (
        <p className="text-sm text-neutral-500">
          未審査の提出はありません。
        </p>
      ) : (
        <div className="space-y-6">
          {pending.map((u) => (
            <VerificationRow
              key={u.id}
              userId={u.id}
              displayName={u.display_name}
              email={u.email}
              createdAt={u.created_at}
              signedUrl={u.signedUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// id_document_url からストレージ内パスを抽出
function extractPath(url: string | null): string | null {
  if (!url) return null;
  // パターン1: 完全な公開/署名URL "https://xxx.supabase.co/storage/v1/object/(public|sign)/id_documents/<path>"
  // パターン2: 既に署名済URL（?token=... 付き）
  // パターン3: バケット内パスのみ "<userid>/xxx.jpg"
  const m = url.match(/\/id_documents\/(.+?)(?:\?|$)/);
  if (m) return m[1] ?? null;
  if (!url.startsWith("http")) return url;
  return null;
}
