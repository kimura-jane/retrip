import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomView } from "./chat-room-view";
import type { ChatThemeColor, ChatFont } from "@/types/database";

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

// 旧パレット → 新パレット の安全側マッピング（DB に旧値が残っていた場合の保険）
const COLOR_MAP: Record<string, ChatThemeColor> = {
  coral: "coral",
  sage: "sage",
  ink: "ink",
  paper: "paper",
  sora: "sora",
  green: "sage",
  blue: "sora",
  pink: "coral",
  purple: "sage",
  orange: "coral",
};

const FONT_MAP: Record<string, ChatFont> = {
  sans: "sans",
  serif: "serif",
  display: "display",
  rounded: "rounded",
  mincho: "serif",
  pop: "sans",
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

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id,name,description,room_type,requires_verification")
    .eq("id", roomId)
    .maybeSingle<RoomRow>();
  if (!room) {
    notFound();
  }

  const { data: messagesData } = await supabase
    .from("messages")
    .select(
      "id,user_id,content,created_at,edited_at,deleted_at,reply_to_message_id,media_url,media_type"
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);

  const messages: MessageRow[] = (messagesData as MessageRow[] | null) ?? [];
  const messageIds = messages.map((m) => m.id);

  let reactions: ReactionRow[] = [];
  if (messageIds.length > 0) {
    const { data: reactionsData } = await supabase
      .from("message_reactions")
      .select("id,message_id,user_id,emoji")
      .in("message_id", messageIds);
    reactions = (reactionsData as ReactionRow[] | null) ?? [];
  }

  const userIds = Array.from(
    new Set([
      ...messages.map((m) => m.user_id),
      ...reactions.map((r) => r.user_id),
    ])
  );

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

  const { data: prefsData } = await supabase
    .from("users")
    .select("chat_theme_color,chat_font")
    .eq("id", user.id)
    .maybeSingle<UserPrefsRow>();

  const rawColor = prefsData?.chat_theme_color ?? "coral";
  const rawFont = prefsData?.chat_font ?? "sans";
  const themeColor: ChatThemeColor = COLOR_MAP[rawColor] ?? "coral";
  const chatFont: ChatFont = FONT_MAP[rawFont] ?? "sans";

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
