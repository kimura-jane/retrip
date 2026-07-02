import { createClient } from "@/lib/supabase/server";
import { UserBanRow } from "./user-ban-row";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  display_name: string | null;
  banned: boolean | null;
  banned_at: string | null;
  chat_banned: boolean | null;
  chat_banned_at: string | null;
  withdrawn: boolean | null;
  id_verified: boolean | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, display_name, banned, banned_at, chat_banned, chat_banned_at, withdrawn, id_verified, created_at"
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
  const active = users.filter(
    (u) =>
      u.banned !== true && u.chat_banned !== true && u.withdrawn !== true
  );
  const withdrawn = users.filter((u) => u.withdrawn === true);

  return (
    <div className="space-y-10">
      {/* ヘッダー */}
      <div className="border-b border-line pb-6">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Users
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
          ユーザー管理
        </h1>
        <p className="mt-3 text-[12px] text-ink-500 font-light leading-relaxed">
          BAN 済みユーザーの解除と、全ユーザーの状況確認。
        </p>
      </div>

      {/* アクセス BAN 一覧 */}
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

      {/* チャット BAN 一覧 */}
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

      {/* アクティブユーザー一覧（参考表示・BAN は行わない） */}
      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2 mb-4">
          <p className="font-display italic text-[10px] tracking-widest2 uppercase text-ink-500">
            Active users
          </p>
          <p className="text-[11px] text-ink-500 font-light">
            {active.length} 件
          </p>
        </div>
        {active.length === 0 ? (
          <p className="text-[13px] text-ink-500 font-light">
            アクティブなユーザーはいません。
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {active.map((u) => (
              <li
                key={u.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[15px] text-ink-900 truncate">
                    {u.display_name ?? "(名前未設定)"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-500 font-light">
                    登録: {new Date(u.created_at).toLocaleDateString("ja-JP")}
                    {u.id_verified === true && (
                      <span className="ml-2 text-sage-700">認証済み</span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 退会ユーザー */}
      {withdrawn.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-line pb-2 mb-4">
            <p className="font-display italic text-[10px] tracking-widest2 uppercase text-ink-500">
              Withdrawn
            </p>
            <p className="text-[11px] text-ink-500 font-light">
              {withdrawn.length} 件
            </p>
          </div>
          <ul className="divide-y divide-line border-y border-line opacity-70">
            {withdrawn.map((u) => (
              <li
                key={u.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[14px] text-ink-500 truncate font-light">
                    {u.display_name ?? "(退会したユーザー)"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
