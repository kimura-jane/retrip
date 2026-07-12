import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCountsAction } from "@/features/chat/actions";

type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  requires_verification: boolean;
  sort_order: number;
};

type TourRoomRow = {
  id: string;
  name: string;
  tour_id: string | null;
};

type SupportRoomRow = {
  id: string;
  name: string;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[11px] font-semibold text-paper-50 leading-none">
      {label}
    </span>
  );
}

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 一覧表示では部屋を作成せず、自分の既存supportルームをSELECTするだけにする。
  const supportClient = supabase as unknown as SupabaseClient;
  const { data: supportRoomData } = await supportClient
    .from("chat_rooms")
    .select("id,name")
    .eq("room_type", "support")
    .eq("support_owner_id", user.id)
    .maybeSingle();
  const supportRoom = supportRoomData as SupportRoomRow | null;

  // 自分の本人確認状態を確認
  const { data: profileData } = await supabase
    .from("users")
    .select("id_verified")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileData as { id_verified: boolean } | null;
  const isVerified = profile?.id_verified === true;

  // lounge 部屋一覧取得（RLSが効いてるので、見えるものだけ返ってくる）
  const { data: roomsData } = await supabase
    .from("chat_rooms")
    .select("id,name,description,requires_verification,sort_order")
    .eq("room_type", "lounge")
    .order("sort_order", { ascending: true });

  const rooms = (roomsData as RoomRow[] | null) ?? [];

  const publicRooms = rooms.filter((r) => !r.requires_verification);
  const verifiedRooms = rooms.filter((r) => r.requires_verification);

  // 参加中の旅チャット（tour room）取得。
  // RLS の chat_rooms_select_tour_participant により、
  // 予約のあるツアーの room だけが返ってくる。
  const { data: tourRoomsData } = await supabase
    .from("chat_rooms")
    .select("id,name,tour_id")
    .eq("room_type", "tour")
    .order("created_at", { ascending: false });

  const tourRooms = (tourRoomsData as TourRoomRow[] | null) ?? [];

  // 未読カウント取得（RPC一発、{ roomId: count }）
  const unreadCounts = await getUnreadCountsAction();
  const getUnread = (roomId: string): number => unreadCounts[roomId] ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* ページヘッダー */}
      <header className="mb-10">
        <p className="font-display italic uppercase tracking-widest2 text-xs text-coral-700">
          Lounges
        </p>
        <h1 className="font-serif text-4xl text-ink-900 mt-3 leading-loose2">
          チャット
        </h1>
        <div className="mt-4 h-px w-12 bg-coral-500" />
        <p className="mt-4 text-[13px] text-ink-500 font-light tracking-wide leading-loose">
          他の旅人たちと、自由におしゃべりしましょう。
        </p>
      </header>

      {/* 運営とのチャット */}
      {supportRoom && (
        <section className="mb-10">
          <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-5">
            Support
          </p>
          <ul className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
            <li>
              <Link
                href={`/chat/${supportRoom.id}`}
                className="flex items-center justify-between py-4 group"
              >
                <span className="font-serif text-lg text-ink-900 group-hover:text-coral-700 transition-colors">
                  運営とのチャット
                </span>
                <span className="flex items-center gap-3">
                  <UnreadBadge count={getUnread(supportRoom.id)} />
                  <span className="font-display italic text-xs text-ink-500 group-hover:text-coral-700 transition-colors">
                    enter →
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </section>
      )}

      {/* 参加中の旅チャット（予約のあるツアーのみ表示される） */}
      {tourRooms.length > 0 && (
        <section className="mb-10">
          <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-5">
            My journeys
          </p>
          <ul className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
            {tourRooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex items-center justify-between py-4 group"
                >
                  <span className="font-serif text-lg text-ink-900 group-hover:text-coral-700 transition-colors">
                    {room.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <UnreadBadge count={getUnread(room.id)} />
                    <span className="font-display italic text-xs text-ink-500 group-hover:text-coral-700 transition-colors">
                      enter →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* みんなの広場 */}
      <section className="mb-10">
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-5">
          For everyone
        </p>
        <ul className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
          {publicRooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/chat/${room.id}`}
                className="flex items-center justify-between py-4 group"
              >
                <span className="font-serif text-lg text-ink-900 group-hover:text-coral-700 transition-colors">
                  {room.name}
                </span>
                <span className="flex items-center gap-3">
                  <UnreadBadge count={getUnread(room.id)} />
                  <span className="font-display italic text-xs text-ink-500 group-hover:text-coral-700 transition-colors">
                    enter →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 本人確認済みエリア */}
      {isVerified ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700">
              Verified only
            </p>
            <span className="flex items-center gap-2 text-xs text-ink-500 font-light">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
              認証済み
            </span>
          </div>
          <ul className="divide-y divide-[#E5E0D8] border-y border-[#E5E0D8]">
            {verifiedRooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex items-center justify-between py-4 group"
                >
                  <span className="font-serif text-lg text-ink-900 group-hover:text-coral-700 transition-colors">
                    {room.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <UnreadBadge count={getUnread(room.id)} />
                    <span className="font-display italic text-xs text-ink-500 group-hover:text-coral-700 transition-colors">
                      enter →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700 mb-5">
            Verified only
          </p>
          <div className="border-l-2 border-coral-500 pl-5 py-2 space-y-4">
            <p className="text-sm text-ink-900 font-light leading-loose">
              本人確認を済ませると、「希望の目的地チャット」「感想チャット」など、ツアー参加者だけのチャットにも参加できるようになります。
            </p>
            <Link
              href="/mypage/id-upload"
              className="inline-block border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2"
            >
              Submit document
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
