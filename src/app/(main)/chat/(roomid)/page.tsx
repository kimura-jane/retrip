import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomView } from "./chat-room-view";

type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  requires_verification: boolean;
};

type MessageWithUser = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: {
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 部屋情報を取得（RLSによりアクセス権なければnull）
  const { data: roomData } = await supabase
    .from("chat_rooms")
    .select("id,name,description,requires_verification")
    .eq("id", roomId)
    .maybeSingle();

  const room = roomData as RoomRow | null;

  if (!room) {
    notFound();
  }

  // 初期メッセージ取得（直近100件、新しい順）
  const { data: messagesData } = await supabase
    .from("messages")
    .select("id,content,created_at,user_id,users(display_name,avatar_url)")
    .eq("room_id", roomId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const messages = ((messagesData as MessageWithUser[] | null) ?? []).reverse();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/chat"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← チャット一覧
        </Link>
        <h1 className="font-serif text-2xl text-neutral-800 mt-2">
          {room.name}
        </h1>
        {room.description && (
          <p className="text-xs text-neutral-500 mt-1">{room.description}</p>
        )}
      </div>

      <ChatRoomView
        roomId={room.id}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  );
}
