import { createClient } from "@/lib/supabase/server";
import { UserBanRow } from "./user-ban-row";
import { UserList, type ListUser } from "./user-list";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  display_name: string | null;
  gender: string | null;
  banned: boolean | null;
  banned_at: string | null;
  chat_banned: boolean | null;
  chat_banned_at: string | null;
  withdrawn: boolean | null;
  id_verified: boolean | null;
  id_document_url: string | null;
  id_rejected_at: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, display_name, gender, banned, banned_at, chat_banned, chat_banned_at, withdrawn, id_verified, id_document_url, id_rejected_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-8">
        <div className="border-b border-line pb-6">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Users
          </p>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
            ユーザー管理
          </h1>
        </div>
        <p className="text-sm text-coral-700">
          読み込みエラー: {error.message}
        </p>
      </div>
    );
  }

  const users = (data ?? []) as UserRow[];

  const accessBanned = users.filter(
    (u) => u.banned === true && u.withdrawn !== true
  );
  const chatBanned = users.filter(
    (u) =>
      u.chat_banned === true && u.banned !== true && u.withdrawn !== true
  );

  const listUsers: ListUser[] = users.map((u) => ({
    id: u.id,
    display_name: u.display_name,
    gender: u.gender,
    banned: u.banned,
    chat_banned: u.chat_banned,
    withdrawn: u.withdrawn,
    id_verified: u.id_verified,
    id_document_url: u.id_document_url,
    id_rejected_at: u.id_rejected_at,
    created_at: u.created_at,
  }));

  return (
    <div className="space-y-12">
      {/* ヘッダー */}
      <div className="border-b border-line pb-6">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Users
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
          ユーザー管理
        </h1>
        <p className="mt-3 text-[12px] text-ink-500 font-light leading-relaxed">
          BAN 管理と、ユーザー詳細（プロフィール・本人確認書類）閲覧。
        </p>
      </div>

      {/* ── BAN 管理セクション ── */}
      <div className="space-y-8">
        <div className="border-b border-line pb-2">
          <p className="font-display italic text-[14px] tracking-widest2 uppercase text-ink-900">
            BAN 管理
          </p>
        </div>

        {/* アクセス BAN */}
        <section>
          <div className="flex items-baseline justify-between border-b border-line pb-2 mb-4">
            <p className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
              Access banned
            </p>
            <p className="text-[11px] text-ink-500 font-light">
              {accessBanned.length} 件
            </p>
          </div>
          {accessBanned.length === 0 ? (
            <p className="text-[13px] text-ink-500 font-light">
              アクセス BAN 中のユーザーはいません。
            </p>
          ) : (
            <ul className="space-y-3">
              {accessBanned.map((u) => (
                <UserBanRow
                  key={u.id}
                  userId={u.id}
                  displayName={u.display_name}
                  banType="access"
                  bannedAt={u.banned_at}
                />
              ))}
            </ul>
          )}
        </section>

        {/* チャット BAN */}
        <section>
          <div className="flex items-baseline justify-between border-b border-line pb-2 mb-4">
            <p className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
              Chat banned
            </p>
            <p className="text-[11px] text-ink-500 font-light">
              {chatBanned.length} 件
            </p>
          </div>
          {chatBanned.length === 0 ? (
            <p className="text-[13px] text-ink-500 font-light">
              チャット BAN 中のユーザーはいません。
            </p>
          ) : (
            <ul className="space-y-3">
              {chatBanned.map((u) => (
                <UserBanRow
                  key={u.id}
                  userId={u.id}
                  displayName={u.display_name}
                  banType="chat"
                  bannedAt={u.chat_banned_at}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── ユーザー一覧セクション ── */}
      <div className="space-y-6">
        <div className="border-b border-line pb-2">
          <p className="font-display italic text-[14px] tracking-widest2 uppercase text-ink-900">
            ユーザー一覧
          </p>
        </div>
        <UserList users={listUsers} />
      </div>
    </div>
  );
}
