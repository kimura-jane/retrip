import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomView } from "./chat-room-view";

type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  room_type: "tour" | "lounge";
  requires_verification: boolean;
};

type MessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reply_to_message_id: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "gif" | null;
};

type ReactionRow = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
};

type SenderRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type UserPrefsRow = {
  chat_theme_color: string | null;
  chat_font: string | null;
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
  if (!user) {
    redirect("/login");
  }

  // ルーム情報
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id,name,description,room_type,requires_verification")
    .eq("id", roomId)
    .maybeSingle<RoomRow>();
  if (!room) {
    notFound();
  }

  // メッセージ（最新100件）
  const { data: messagesData } = await supabase
    .from("messages")
    .select(
      "id,user_id,content,created_at,edited_at,deleted_at,reply_to_message_id,media_url,media_type"
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);

  const messages: MessageRow[] = (messagesData as MessageRow[] | null) ?? [];

  // メッセージIDリスト
  const messageIds = messages.map((m) => m.id);

  // リアクション一括取得
  let reactions: ReactionRow[] = [];
  if (messageIds.length > 0) {
    const { data: reactionsData } = await supabase
      .from("message_reactions")
      .select("id,message_id,user_id,emoji")
      .in("message_id", messageIds);
    reactions = (reactionsData as ReactionRow[] | null) ?? [];
  }

  // 送信者IDリスト（メッセージ + リアクション）
  const userIds = Array.from(
    new Set([
      ...messages.map((m) => m.user_id),
      ...reactions.map((r) => r.user_id),
    ])
  );

  // 送信者情報を一括取得
  const senders: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: sendersData } = await supabase
      .from("users")
      .select("id,display_name,avatar_url")
      .in("id", userIds);
    for (const s of (sendersData as SenderRow[] | null) ?? []) {
      senders[s.id] = {
        display_name: s.display_name,
        avatar_url: s.avatar_url,
      };
    }
  }

  // 現在ユーザーのテーマ設定取得
  const { data: prefsData } = await supabase
    .from("users")
    .select("chat_theme_color,chat_font")
    .eq("id", user.id)
    .maybeSingle<UserPrefsRow>();

  const themeColor = (prefsData?.chat_theme_color ?? "green") as
    | "green"
    | "blue"
    | "pink"
    | "purple"
    | "orange";
  const chatFont = (prefsData?.chat_font ?? "sans") as
    | "sans"
    | "serif"
    | "rounded"
    | "mincho"
    | "pop";

  return (
    <ChatRoomView
      roomId={room.id}
      roomName={room.name}
      roomDescription={room.description}
      currentUserId={user.id}
      initialMessages={messages}
      initialReactions={reactions}
      senders={senders}
      themeColor={themeColor}
      chatFont={chatFont}
    />
  );
}
