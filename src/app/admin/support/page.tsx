import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCountsAction } from "@/features/chat/actions";

export const dynamic = "force-dynamic";

type SupportRoomRow = {
  id: string;
  name: string;
  support_owner_id: string;
  created_at: string;
};

type OwnerRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type LastMessageRow = {
  room_id: string;
  content: string;
  created_at: string;
  user_id: string;
};

export default async function AdminSupportListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.role !== "admin") notFound();

  // database.ts の再生成までは support 固有カラムへのアクセスだけ untyped で扱う。
  const client = supabase as unknown as SupabaseClient;
  const { data: roomsData } = await client
    .from("chat_rooms")
    .select("id,name,support_owner_id,created_at")
    .eq("room_type", "support")
    .order("created_at", { ascending: false });

  const rooms = (roomsData as SupportRoomRow[] | null) ?? [];
  const ownerIds = Array.from(new Set(rooms.map((r) => r.support_owner_id)));

  const owners: Record<string, OwnerRow> = {};
  if (ownerIds.length > 0) {
    const { data: ownersData } = await supabase
      .from("users")
      .select("id,display_name,avatar_url")
      .in("id", ownerIds);
    for (const o of (ownersData as OwnerRow[] | null) ?? []) {
      owners[o.id] = o;
    }
  }

  const lastMessages: Record<string, LastMessageRow> = {};
  for (const room of rooms) {
    const { data: last } = await supabase
      .from("messages")
      .select("room_id,content,created_at,user_id")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<LastMessageRow>();
    if (last) lastMessages[room.id] = last;
  }

  const unread = await getUnreadCountsAction();

  const sorted = [...rooms].sort((a, b) => {
    const ua = unread[a.id] ?? 0;
    const ub = unread[b.id] ?? 0;
    if (ua !== ub) return ub - ua;
    const ta = lastMessages[a.id]?.created_at ?? "";
    const tb = lastMessages[b.id]?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="font-display italic uppercase tracking-widest2 text-xs text-coral-700">
          Admin / Support
        </p>
        <h1 className="font-serif text-3xl text-ink-900 mt-3">
          運営チャット一覧
        </h1>
      </header>
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-500 font-light">
          まだ問い合わせはありません。
        </p>
      ) : (
        <ul className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
          {sorted.map((room) => {
            const owner = owners[room.support_owner_id];
            const last = lastMessages[room.id];
            const unreadCount = unread[room.id] ?? 0;
            return (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base text-ink-900 truncate">
                      {owner?.display_name ?? "（不明なユーザー）"}
                    </p>
                    {last && (
                      <p className="mt-1 text-xs text-ink-500 font-light truncate">
                        {last.content}
                      </p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[11px] font-semibold text-paper-50 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
