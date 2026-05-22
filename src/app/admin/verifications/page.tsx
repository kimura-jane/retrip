import { createClient } from "@/lib/supabase/server";
import { VerificationRow } from "./verification-row";

type PendingUser = {
  id: string;
  display_name: string;
  birth_date: string;
  gender: string;
  id_document_url: string;
  created_at: string;
};

export default async function VerificationsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id,display_name,birth_date,gender,id_document_url,created_at")
    .not("id_document_url", "is", null)
    .eq("id_verified", false)
    .is("id_rejected_at", null)
    .order("created_at", { ascending: true });

  const users = (data as PendingUser[] | null) ?? [];

  // 各書類の署名URLを発行（1時間有効）
  const usersWithSignedUrl = await Promise.all(
    users.map(async (u) => {
      // id_document_url はフルパス or バケット内パスのどちらか
      // バケット内パス前提（例: "userid/xxx.jpg"）として処理。
      // フルURLで保存されている場合は public.url から path 部分を抽出する必要あり。
      const path = extractPath(u.id_document_url);
      let signedUrl: string | null = null;
      if (path) {
        const { data: signed } = await supabase.storage
          .from("id_documents")
          .createSignedUrl(path, 60 * 60);
        signedUrl = signed?.signedUrl ?? null;
      }
      return { ...u, signedUrl };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-800">本人確認</h1>
        <p className="text-sm text-neutral-600 mt-2">
          {users.length} 件の審査待ち
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">読み込みエラー: {error.message}</p>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-neutral-500">審査待ちはありません。</p>
      ) : (
        <div className="space-y-4">
          {usersWithSignedUrl.map((u) => (
            <VerificationRow
              key={u.id}
              userId={u.id}
              displayName={u.display_name}
              birthDate={u.birth_date}
              gender={u.gender}
              createdAt={u.created_at}
              signedUrl={u.signedUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// id_document_url から storage のパス部分を抽出する
function extractPath(url: string): string | null {
  // パターン1: フルURL "https://xxx.supabase.co/storage/v1/object/public/id_documents/<path>"
  // パターン2: フルURL "https://xxx.supabase.co/storage/v1/object/sign/id_documents/<path>?..."
  // パターン3: バケット内パスのみ "<userid>/xxx.jpg"
  const m = url.match(/\/id_documents\/(.+?)(?:\?|$)/);
  if (m) return m[1];
  if (!url.startsWith("http")) return url;
  return null;
}
