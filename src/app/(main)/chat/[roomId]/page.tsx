import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomView } from "./chat-room-view";
import type { IntroRow } from "./intro-panel";
import type { PollData } from "./poll-bubble";
import type { ChatThemeColor, ChatFont, PollOption, AgeGroup, Gender } from "@/types/database";

type RoomRow = {
  id: string;
  name: string;
  description: string | null;
  room_type: "tour" | "lounge";
  requires_verification: boolean;
  tour_id: string | null;
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
  message_type: "text" | "poll";
  poll_id: string | null;
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

type PollRow = {
  id: string;
  room_id: string;
  created_by: string;
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  created_at: string;
};

type PollResultRow = {
  poll_id: string;
  option_id: string;
  vote_count: number;
};

type PollVoteRow = {
  poll_id: string;
  option_id: string;
};

type IntroDbRow = {
  user_id: string;
  nickname: string;
  age_group: AgeGroup;
  gender: Gender;
  occupation: string | null;
  hobbies: string | null;
  spot: string | null;
  message: string | null;
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

  const isAdmin = user.user_metadata?.role === "admin";

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id,name,description,room_type,requires_verification,tour_id")
    .eq("id", roomId)
    .maybeSingle<RoomRow>();
  if (!room) {
    notFound();
  }

  const { data: messagesData } = await supabase
    .from("messages")
    .select(
      "id,user_id,content,created_at,edited_at,deleted_at,reply_to_message_id,media_url,media_type,message_type,poll_id"
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(100);

  const messages: MessageRow[] = (messagesData as MessageRow[] | null) ?? [];
  const messageIds = messages.map((m) => m.id);

  // poll メッセージから poll_id を集める
  const pollIds = Array.from(
    new Set(
      messages
        .filter((m) => m.message_type === "poll" && m.poll_id)
        .map((m) => m.poll_id as string)
    )
  );

  let reactions: ReactionRow[] = [];
  if (messageIds.length > 0) {
    const { data: reactionsData } = await supabase
      .from("message_reactions")
      .select("id,message_id,user_id,emoji")
      .in("message_id", messageIds);
    reactions = (reactionsData as ReactionRow[] | null) ?? [];
  }

  // polls 本体、集計、自分の投票を並列取得
  let polls: PollData[] = [];
  if (pollIds.length > 0) {
    const [pollsResp, resultsResp, myVotesResp] = await Promise.all([
      supabase
        .from("polls")
        .select("id,room_id,created_by,question,options,allow_multiple,created_at")
        .in("id", pollIds),
      supabase
        .from("poll_results")
        .select("poll_id,option_id,vote_count")
        .in("poll_id", pollIds),
      supabase
        .from("poll_votes")
        .select("poll_id,option_id")
        .in("poll_id", pollIds)
        .eq("user_id", user.id),
    ]);

    const pollRows = (pollsResp.data as PollRow[] | null) ?? [];
    const results = (resultsResp.data as PollResultRow[] | null) ?? [];
    const myVotes = (myVotesResp.data as PollVoteRow[] | null) ?? [];

    polls = pollRows.map((p) => {
      const counts: Record<string, number> = {};
      for (const r of results) {
        if (r.poll_id === p.id) counts[r.option_id] = r.vote_count;
      }
      const my = myVotes.find((v) => v.poll_id === p.id);
      return {
        id: p.id,
        question: p.question,
        options: p.options,
        voteCounts: counts,
        myVoteOptionId: my?.option_id ?? null,
        createdBy: p.created_by,
      };
    });
  }

  // tour room の場合のみ、自己紹介を取得する
  let intros: IntroRow[] = [];
  if (room.room_type === "tour" && room.tour_id) {
    const { data: introsData } = await supabase
      .from("tour_introductions")
      .select("user_id,nickname,age_group,gender,occupation,hobbies,spot,message")
      .eq("tour_id", room.tour_id)
      .order("created_at", { ascending: true });
    intros = (introsData as IntroDbRow[] | null) ?? [];
  }

  const userIds = Array.from(
    new Set([
      ...messages.map((m) => m.user_id),
      ...reactions.map((r) => r.user_id),
      ...intros.map((i) => i.user_id),
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
      isAdmin={isAdmin}
      initialMessages={messages}
      initialReactions={reactions}
      initialPolls={polls}
      senders={senders}
      themeColor={themeColor}
      chatFont={chatFont}
      tourId={room.room_type === "tour" ? room.tour_id : null}
      intros={intros}
    />
  );
}
