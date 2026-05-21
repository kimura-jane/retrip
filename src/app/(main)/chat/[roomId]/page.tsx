import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomView } from "./chat-room-view";

type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  room_type: string;
  requires_verification: boolean;
};

type MessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type SenderRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
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

  // 部屋情報取得（RLSで権限なければ null）
  const { data: roomData } = await supabase
    .from("chat_rooms")
    .select("id,name,description,room_type,requires_verification")
    .eq("id", roomId)
    .maybeSingle();

  const room = roomData as RoomRow | null;
  if (!room) notFound();

  // メッセージ取得（直近100件、古い順）
  const { data: messagesData } = await supabase
    .from("messages")
    .select("id,user_id,content,created_at,edited_at,deleted_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rawMessages = (messagesData as MessageRow[] | null) ?? [];
  const messages = [...rawMessages].reverse();

  // 送信者情報をまとめて取得
  const userIds = Array.from(new Set(messages.map((m) => m.user_id)));
  let senders: Record<string, { display_name: string; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: sendersData } = await supabase
      .from("users")
      .select("id,display_name,avatar_url")
      .in("id", userIds);

    const rows = (sendersData as SenderRow[] | null) ?? [];
    senders = rows.reduce((acc, row) => {
      acc[row.id] = {
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      };
      return acc;
    }, {} as Record<string, { display_name: string; avatar_url: string | null }>);
  }

  return (
    <ChatRoomView
      roomId={room.id}
      roomName={room.name}
      roomDescription={room.description}
      currentUserId={user.id}
      initialMessages={messages}
      senders={senders}
    />
  );
}
