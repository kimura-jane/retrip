"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessageAction,
  editMessageAction,
  deleteMessageAction,
  addReactionAction,
  removeReactionAction,
  uploadChatMediaAction,
  markRoomReadAction,
} from "@/features/chat/actions";
import {
  chatBanAction,
  accessBanAction,
  adminDeleteMessageAction,
} from "@/features/admin/ban-actions";
import { deletePollAction } from "@/features/poll/actions";
import { ReactionPicker } from "@/features/chat/reaction-picker";
import { MessageMenu, type MessageMenuAction } from "@/features/chat/message-menu";
import { getTheme, getFont } from "@/features/chat/theme";
import { PollBubble, type PollData } from "./poll-bubble";
import { PollComposer } from "./poll-composer";
import IntroPanel, { ProfileModal, type IntroRow } from "./intro-panel";
import type { ChatThemeColor, ChatFont } from "@/types/database";

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

type SenderInfo = {
  display_name: string;
  avatar_url: string | null;
};

type Props = {
  roomId: string;
  roomName: string;
  roomDescription: string | null;
  currentUserId: string;
  isAdmin: boolean;
  initialMessages: MessageRow[];
  initialReactions: ReactionRow[];
  initialPolls: PollData[];
  senders: Record<string, SenderInfo>;
  themeColor: ChatThemeColor;
  chatFont: ChatFont;
  tourId: string | null;
  intros: IntroRow[];
};

export function ChatRoomView({
  roomId,
  roomName,
  roomDescription,
  currentUserId,
  isAdmin,
  initialMessages,
  initialReactions,
  initialPolls,
  senders: initialSenders,
  themeColor,
  chatFont,
  tourId,
  intros,
}: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [reactions, setReactions] = useState<ReactionRow[]>(initialReactions);
  const [polls, setPolls] = useState<PollData[]>(initialPolls);
  const [senders, setSenders] = useState<Record<string, SenderInfo>>(initialSenders);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [menuFor, setMenuFor] = useState<MessageRow | null>(null);
  const [pickerFor, setPickerFor] = useState<MessageRow | null>(null);
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  // 管理者がアバターをタップしたときに開く管理パネルの対象ユーザー
  const [adminPanelUserId, setAdminPanelUserId] = useState<string | null>(null);
  // 管理者が他人のメッセージを削除する際の確認対象
  const [adminDeleteFor, setAdminDeleteFor] = useState<MessageRow | null>(null);
  const [uploadPreview, setUploadPreview] = useState<{
    url: string;
    mediaType: "image" | "video" | "gif";
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // visualViewportの「高さ」と「ズレ（スクロールによる押し上げ分）」を保持する
  const [viewportHeight, setViewportHeight] = useState<number | string>("100dvh");
  const [viewportTop, setViewportTop] = useState<number>(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const supabase = useMemo(() => createClient(), []);

  const theme = getTheme(themeColor);
  const font = getFont(chatFont);

  // visualViewportで高さを監視し、iOSの強制スクロールを打ち消す（最終奥義）
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;

    const updateView = () => {
      setViewportHeight(vv.height);
      setViewportTop(vv.offsetTop);
    };

    updateView();
    vv.addEventListener("resize", updateView);
    vv.addEventListener("scroll", updateView);

    return () => {
      vv.removeEventListener("resize", updateView);
      vv.removeEventListener("scroll", updateView);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length, viewportHeight]);

  // ルーム入室時に既読化（last_read_at を now() に更新する）。
  // ルーム切替時にもう一度叩かれる。LINE 的挙動：開いている間の新着分は
  // 次回入室時にまとめて既読化される。
  useEffect(() => {
    void markRoomReadAction(roomId);
  }, [roomId]);

  // poll を最新化する（投票の楽観更新後やリアルタイム反映用）
  const fetchPolls = async (pollIds: string[]) => {
    if (pollIds.length === 0) return;

    const { data: pollsData } = await supabase
      .from("polls")
      .select("id, room_id, created_by, question, options, allow_multiple, created_at")
      .in("id", pollIds);

    const { data: resultsData } = await supabase
      .from("poll_results")
      .select("poll_id, option_id, vote_count")
      .in("poll_id", pollIds);

    const { data: myVotesData } = await supabase
      .from("poll_votes")
      .select("poll_id, option_id")
      .in("poll_id", pollIds)
      .eq("user_id", currentUserId);

    const pollRows = (pollsData ?? []) as unknown as Array<{
      id: string;
      created_by: string;
      question: string;
      options: { id: string; label: string }[];
    }>;
    const results = (resultsData ?? []) as Array<{
      poll_id: string;
      option_id: string;
      vote_count: number;
    }>;
    const myVotes = (myVotesData ?? []) as Array<{
      poll_id: string;
      option_id: string;
    }>;

    const fresh: PollData[] = pollRows.map((p) => {
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

    setPolls((prev) => {
      const merged = [...prev];
      for (const f of fresh) {
        const idx = merged.findIndex((p) => p.id === f.id);
        if (idx >= 0) merged[idx] = f;
        else merged.push(f);
      }
      return merged;
    });
  };

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // 送信者情報が未取得なら取得する。
          // ここで senders を直接参照すると useEffect の依存に senders が必要になり、
          // メッセージ受信のたびにチャンネルが張り直されてフリーズの原因になる。
          // そのため「未取得かどうか」も setSenders の関数型更新の中で判定する。
          setSenders((prevSenders) => {
            if (prevSenders[newMessage.user_id]) return prevSenders;
            // まだ無い場合だけ非同期で取得し、取得後に再度 setSenders する
            void (async () => {
              const { data } = await supabase
                .from("users")
                .select("display_name,avatar_url")
                .eq("id", newMessage.user_id)
                .maybeSingle();
              if (data) {
                setSenders((cur) => {
                  if (cur[newMessage.user_id]) return cur;
                  return { ...cur, [newMessage.user_id]: data as SenderInfo };
                });
              }
            })();
            return prevSenders;
          });
          // 投票メッセージなら poll データも取得
          if (newMessage.message_type === "poll" && newMessage.poll_id) {
            fetchPolls([newMessage.poll_id]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as MessageRow;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const newReaction = payload.new as ReactionRow;
          setReactions((prev) => {
            if (prev.some((r) => r.id === newReaction.id)) return prev;
            return [...prev, newReaction];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const oldReaction = payload.old as { id: string };
          setReactions((prev) => prev.filter((r) => r.id !== oldReaction.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "poll_votes" },
        (payload) => {
          const vote = payload.new as { poll_id: string };
          if (vote.poll_id) fetchPolls([vote.poll_id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "poll_votes" },
        (payload) => {
          const vote = payload.old as { poll_id: string };
          if (vote.poll_id) fetchPolls([vote.poll_id]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // senders を依存に入れないこと（入れると受信のたびに再購読してフリーズする）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, supabase]);

  const reactionsByMessage = useMemo(() => {
    const map: Record<string, Record<string, { count: number; mine: boolean }>> = {};
    for (const r of reactions) {
      const forMessage = map[r.message_id] ?? {};
      const entry = forMessage[r.emoji] ?? { count: 0, mine: false };
      entry.count++;
      if (r.user_id === currentUserId) entry.mine = true;
      forMessage[r.emoji] = entry;
      map[r.message_id] = forMessage;
    }
    return map;
  }, [reactions, currentUserId]);

  const pollsById = useMemo(() => {
    const map: Record<string, PollData> = {};
    for (const p of polls) map[p.id] = p;
    return map;
  }, [polls]);

  // PollBubble からの楽観更新コールバック
  const handleVoteChange = (pollId: string, newOptionId: string | null) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const counts = { ...p.voteCounts };
        // 旧票を減らす
        if (p.myVoteOptionId) {
          counts[p.myVoteOptionId] = Math.max(0, (counts[p.myVoteOptionId] ?? 0) - 1);
        }
        // 新票を増やす
        if (newOptionId) {
          counts[newOptionId] = (counts[newOptionId] ?? 0) + 1;
        }
        return {
          ...p,
          myVoteOptionId: newOptionId,
          voteCounts: counts,
        };
      })
    );
  };

  // 投票削除
  const handleDeletePoll = (pollId: string) => {
    if (!confirm("この投票を削除します。よろしいですか？")) return;
    startTransition(async () => {
      const result = await deletePollAction(pollId, roomId);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleSend = () => {
    const content = input.trim();
    const hasMedia = !!uploadPreview;
    if ((!content && !hasMedia) || isPending) return;
    setError(null);

    if (editingId) {
      const targetId = editingId;
      const newContent = content;
      setInput("");
      setEditingId(null);
      startTransition(async () => {
        const result = await editMessageAction(targetId, newContent, roomId);
        if (!result.success) setError(result.error);
      });
      return;
    }

    const optimisticInput = input;
    const optimisticReply = replyTo?.id ?? null;
    const optimisticMedia = uploadPreview;
    setInput("");
    setReplyTo(null);
    setUploadPreview(null);

    startTransition(async () => {
      const result = await sendMessageAction(roomId, content, {
        replyToMessageId: optimisticReply,
        mediaUrl: optimisticMedia?.url ?? null,
        mediaType: optimisticMedia?.mediaType ?? null,
      });
      if (!result.success) {
        setError(result.error);
        setInput(optimisticInput);
        if (optimisticMedia) setUploadPreview(optimisticMedia);
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMenuAction = (msg: MessageRow, action: MessageMenuAction) => {
    if (action === "react") {
      setPickerFor(msg);
    } else if (action === "reply") {
      setReplyTo(msg);
      setEditingId(null);
    } else if (action === "copy") {
      navigator.clipboard?.writeText(msg.content).catch(() => {});
    } else if (action === "edit") {
      setEditingId(msg.id);
      setInput(msg.content);
      setReplyTo(null);
    } else if (action === "delete") {
      if (confirm("このメッセージの送信を取り消しますか？")) {
        startTransition(async () => {
          const result = await deleteMessageAction(msg.id, roomId);
          if (!result.success) setError(result.error);
        });
      }
    }
  };

  // 長押し時の分岐：管理者かつ他人のメッセージなら admin 削除確認を出す。
  // それ以外（自分のメッセージ or 一般ユーザー）は通常の MessageMenu を出す。
  const handleLongPress = (msg: MessageRow) => {
    if (isAdmin && msg.user_id !== currentUserId && !msg.deleted_at) {
      setAdminDeleteFor(msg);
    } else {
      setMenuFor(msg);
    }
  };

  // アバタータップ時の分岐：管理者かつ他人なら管理パネル、それ以外はプロフィール。
  // 自分自身のアバターは常にプロフィール。tour room 以外は従来どおり無効。
  const handleAvatarClick = (userId: string) => {
    if (isAdmin && userId !== currentUserId) {
      setAdminPanelUserId(userId);
    } else {
      setProfileUserId(userId);
    }
  };

  // 管理者の他人メッセージ削除を実行
  const runAdminDelete = (msg: MessageRow) => {
    setAdminDeleteFor(null);
    startTransition(async () => {
      const result = await adminDeleteMessageAction(msg.id, roomId);
      if (!result.success) setError(result.error);
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!pickerFor) return;
    const targetId = pickerFor.id;
    const existing = reactionsByMessage[targetId]?.[emoji];
    startTransition(async () => {
      if (existing?.mine) {
        await removeReactionAction(targetId, emoji, roomId);
      } else {
        await addReactionAction(targetId, emoji, roomId);
      }
    });
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    const existing = reactionsByMessage[messageId]?.[emoji];
    startTransition(async () => {
      if (existing?.mine) {
        await removeReactionAction(messageId, emoji, roomId);
      } else {
        await addReactionAction(messageId, emoji, roomId);
      }
    });
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    const result = await uploadChatMediaAction(formData);
    setIsUploading(false);
    if (result.success) {
      setUploadPreview({ url: result.url, mediaType: result.mediaType });
    } else {
      setError(result.error);
    }
  };

  const jumpToMessage = (messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(messageId);
      setTimeout(() => setHighlightId(null), 1500);
    }
  };

  // プロフィールモーダル用：表示対象の自己紹介と送信者情報を求める
  const profileIntro = profileUserId
    ? intros.find((i) => i.user_id === profileUserId) ?? null
    : null;
  const profileSender = profileUserId ? senders[profileUserId] : undefined;
  const profileFallbackName =
    profileSender?.display_name ?? "ユーザー";

  // 管理パネル用：対象ユーザーの表示名
  const adminPanelName = adminPanelUserId
    ? senders[adminPanelUserId]?.display_name ?? "ユーザー"
    : "ユーザー";

  return (
    <div
      className={`fixed left-0 w-full flex flex-col overflow-hidden ${theme.chatBg} ${font.className}`}
      style={{
        top: `${viewportTop + 64}px`,
        height:
          typeof viewportHeight === "number"
            ? `${viewportHeight - 64}px`
            : `calc(${viewportHeight} - 64px)`,
      }}
    >
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-paper-100 border-b border-[#E5E0D8] px-5 py-4 z-10">
        <Link
          href="/chat"
          className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 hover:text-coral-700 transition-colors"
        >
          ← Lounges
        </Link>
        <h1 className="font-serif text-xl text-ink-900 mt-1.5 tracking-wide">
          {roomName}
        </h1>
      </div>

      {/* ツアー限定プロフィールの上部バー（tour room のみ） */}
      {tourId && (
        <IntroPanel
          tourId={tourId}
          roomId={roomId}
          currentUserId={currentUserId}
          intros={intros}
          senders={senders}
        />
      )}

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 overscroll-contain">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-ink-500 font-light mt-12 tracking-wide leading-loose">
            まだメッセージはありません。
            <br />
            最初の投稿をしてみよう。
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.user_id === currentUserId;
            const sender = senders[msg.user_id];
            const prevMsg = messages[idx - 1];
            const showSender = !prevMsg || prevMsg.user_id !== msg.user_id;
            const isDeleted = !!msg.deleted_at;
            const isEdited = !!msg.edited_at && !isDeleted;
            const msgReactions = reactionsByMessage[msg.id] ?? {};
            const replyToMsg = msg.reply_to_message_id
              ? messages.find((m) => m.id === msg.reply_to_message_id) ?? null
              : null;
            const replyToSender = replyToMsg
              ? senders[replyToMsg.user_id]
              : undefined;

            // 日付が変わったらセパレーターを挿入する
            const showDateSeparator =
              !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

            // 投票メッセージは PollBubble を表示
            if (msg.message_type === "poll" && msg.poll_id && !isDeleted) {
              const poll = pollsById[msg.poll_id];
              if (!poll) return null;
              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <DateSeparator iso={msg.created_at} />
                  )}
                  <div
                    ref={(el) => {
                      messageRefs.current[msg.id] = el;
                    }}
                  >
                    <PollBubble
                      poll={poll}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      onDeleteRequest={() => handleDeletePoll(poll.id)}
                      onVoteChange={handleVoteChange}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id}>
                {showDateSeparator && <DateSeparator iso={msg.created_at} />}
                <MessageBubble
                  refSetter={(el) => {
                    messageRefs.current[msg.id] = el;
                  }}
                  isMine={isMine}
                  sender={sender}
                  showSender={showSender}
                  message={msg}
                  isDeleted={isDeleted}
                  isEdited={isEdited}
                  reactions={msgReactions}
                  replyToMsg={replyToMsg}
                  replyToSender={replyToSender}
                  highlighted={highlightId === msg.id}
                  themeMyBubble={`${theme.myBubbleBg} ${theme.myBubbleText}`}
                  onLongPress={() => handleLongPress(msg)}
                  onReactionClick={(emoji) => toggleReaction(msg.id, emoji)}
                  onReplyClick={() => replyToMsg && jumpToMessage(replyToMsg.id)}
                  onAvatarClick={
                    tourId || isAdmin
                      ? () => handleAvatarClick(msg.user_id)
                      : undefined
                  }
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* 入力欄エリア */}
      <div className="flex-shrink-0 bg-paper-100 border-t border-[#E5E0D8] z-10 relative pb-safe">
        {/* 返信プレビュー */}
        {replyTo && (
          <div className="bg-paper-50 border-b border-[#E5E0D8] px-3 py-2 flex items-start gap-2">
            <div className={`w-0.5 self-stretch ${theme.accentBorder}`} />
            <div className="flex-1 min-w-0">
              <p className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500">
                Reply to {senders[replyTo.user_id]?.display_name ?? "ユーザー"}
              </p>
              <p className="text-xs text-ink-900 font-light truncate mt-0.5">
                {replyTo.deleted_at
                  ? "（削除されたメッセージ）"
                  : replyTo.content || (replyTo.media_type ? "[メディア]" : "")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-ink-500 hover:text-ink-900 text-lg leading-none px-1 transition-colors"
              aria-label="返信キャンセル"
            >
              ×
            </button>
          </div>
        )}

        {/* 編集プレビュー */}
        {editingId && (
          <div className="bg-coral-500/10 border-b border-coral-500/40 px-3 py-2 flex items-center justify-between">
            <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
              Editing message
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setInput("");
              }}
              className="text-coral-700 hover:text-coral-500 text-xs font-light transition-colors"
            >
              キャンセル
            </button>
          </div>
        )}

        {/* メディアプレビュー */}
        {uploadPreview && (
          <div className="bg-paper-50 border-b border-[#E5E0D8] px-3 py-2">
            <div className="relative inline-block">
              {uploadPreview.mediaType === "video" ? (
                <video
                  src={uploadPreview.url}
                  className="max-h-32 rounded-lg"
                  controls={false}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploadPreview.url}
                  alt="preview"
                  className="max-h-32 rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={() => setUploadPreview(null)}
                className="absolute -top-2 -right-2 bg-ink-900 text-paper-50 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 入力フォーム本体 */}
        <div className="px-3 py-2">
          {error && (
            <p className="text-xs text-coral-700 font-light mb-2 px-1">{error}</p>
          )}
          <div className="flex items-end gap-2">
            {!editingId && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isPending}
                  className="flex-shrink-0 h-10 w-10 rounded-full bg-paper-50 hover:bg-[#E5E0D8] transition-colors flex items-center justify-center disabled:opacity-40 border border-[#E5E0D8]"
                  aria-label="メディアを添付"
                >
                  {isUploading ? (
                    <span className="text-xs text-ink-500">…</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5 text-ink-500"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPollComposer(true)}
                  disabled={isPending}
                  className="flex-shrink-0 h-10 w-10 rounded-full bg-paper-50 hover:bg-[#E5E0D8] transition-colors flex items-center justify-center disabled:opacity-40 border border-[#E5E0D8]"
                  aria-label="投票を作る"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-ink-500"
                  >
                    <rect x="3" y="12" width="4" height="9" />
                    <rect x="10" y="6" width="4" height="15" />
                    <rect x="17" y="9" width="4" height="12" />
                  </svg>
                </button>
              </>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={editingId ? "編集内容を入力" : "メッセージを入力"}
              rows={1}
              className={`flex-1 resize-none rounded-2xl border border-[#E5E0D8] bg-paper-50 px-4 py-2 text-base text-ink-900 placeholder:text-ink-500/60 focus:outline-none focus:ring-2 ${theme.focusRing} max-h-32 transition-colors`}
              style={{ minHeight: "40px", fontSize: "16px" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={(!input.trim() && !uploadPreview) || isPending}
              className={`flex-shrink-0 h-10 w-10 rounded-full ${theme.myBubbleBg} ${theme.myBubbleText} text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center`}
              aria-label="送信"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuFor && (
        <MessageMenu
          isMine={menuFor.user_id === currentUserId}
          isDeleted={!!menuFor.deleted_at}
          hasContent={!!menuFor.content}
          onAction={(action) => handleMenuAction(menuFor, action)}
          onClose={() => setMenuFor(null)}
        />
      )}

      {pickerFor && (
        <ReactionPicker
          onSelect={handleEmojiSelect}
          onClose={() => setPickerFor(null)}
        />
      )}

      {showPollComposer && (
        <PollComposer
          roomId={roomId}
          onClose={() => setShowPollComposer(false)}
          onCreated={() => setShowPollComposer(false)}
        />
      )}

      {/* アバタータップで開く単体プロフィール（一般ユーザー or 自分） */}
      {profileUserId && (
        <ProfileModal
          intro={profileIntro}
          sender={profileSender}
          fallbackName={profileFallbackName}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {/* 管理者がアバターをタップしたときの管理パネル */}
      {adminPanelUserId && (
        <AdminUserPanel
          userId={adminPanelUserId}
          displayName={adminPanelName}
          onClose={() => setAdminPanelUserId(null)}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* 管理者による他人メッセージ削除の確認 */}
      {adminDeleteFor && (
        <AdminDeleteConfirm
          message={adminDeleteFor}
          senderName={senders[adminDeleteFor.user_id]?.display_name ?? "ユーザー"}
          onConfirm={() => runAdminDelete(adminDeleteFor)}
          onClose={() => setAdminDeleteFor(null)}
        />
      )}
    </div>
  );
}

type MessageBubbleProps = {
  refSetter: (el: HTMLDivElement | null) => void;
  isMine: boolean;
  sender: SenderInfo | undefined;
  showSender: boolean;
  message: MessageRow;
  isDeleted: boolean;
  isEdited: boolean;
  reactions: Record<string, { count: number; mine: boolean }>;
  replyToMsg: MessageRow | null;
  replyToSender: SenderInfo | undefined;
  highlighted: boolean;
  themeMyBubble: string;
  onLongPress: () => void;
  onReactionClick: (emoji: string) => void;
  onReplyClick: () => void;
  onAvatarClick?: () => void;
};

function MessageBubble({
  refSetter,
  isMine,
  sender,
  showSender,
  message,
  isDeleted,
  isEdited,
  reactions,
  replyToMsg,
  replyToSender,
  highlighted,
  themeMyBubble,
  onLongPress,
  onReactionClick,
  onReplyClick,
  onAvatarClick,
}: MessageBubbleProps) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTriggeredRef = useRef(false);

  const handlePointerDown = (_e: ReactPointerEvent<HTMLDivElement>) => {
    pressTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      pressTriggeredRef.current = true;
      onLongPress();
    }, 500);
  };

  const handlePointerEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (pressTriggeredRef.current) {
      pressTriggeredRef.current = false;
      return;
    }
  };

  const senderName = sender?.display_name ?? "（不明）";
  const avatarUrl = sender?.avatar_url;

  // アバター画像／プレースホルダの共通クラス。タップ可能なら少し押せる見た目に
  const avatarClickable = !!onAvatarClick;

  return (
    <div
      ref={refSetter}
      className={`flex gap-2 mb-1 ${isMine ? "flex-row-reverse" : ""} ${
        highlighted ? "bg-coral-500/10 -mx-3 px-3 py-1 transition-colors" : ""
      }`}
    >
      {/* アバター */}
      <div className="flex-shrink-0 w-8">
        {showSender &&
          (avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={senderName}
              onClick={onAvatarClick}
              className={`w-8 h-8 rounded-full object-cover bg-paper-200 ${
                avatarClickable ? "cursor-pointer active:opacity-70 transition-opacity" : ""
              }`}
            />
          ) : (
            <div
              onClick={onAvatarClick}
              className={`w-8 h-8 rounded-full bg-paper-200 ${
                avatarClickable ? "cursor-pointer active:opacity-70 transition-opacity" : ""
              }`}
            />
          ))}
      </div>

      {/* バブル */}
      <div className={`flex flex-col max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        {showSender && (
          <p className="text-[11px] text-ink-500 font-light mb-0.5 px-1 tracking-wide">
            {senderName}
          </p>
        )}

        {/* 返信プレビュー */}
        {replyToMsg && (
          <button
            type="button"
            onClick={onReplyClick}
            className="text-[10px] bg-paper-50 border-l-2 border-coral-500 px-2 py-1 mb-1 max-w-full text-left rounded"
          >
            <span className="text-ink-500 font-light">
              {(replyToSender?.display_name ?? "ユーザー") + "："}
            </span>
            <span className="text-ink-900 font-light">
              {replyToMsg.deleted_at
                ? "（削除されたメッセージ）"
                : replyToMsg.content || (replyToMsg.media_type ? "[メディア]" : "")}
            </span>
          </button>
        )}

        {/* 本体バブル */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClick={handleClick}
          className={`relative px-3.5 py-2 rounded-2xl text-[15px] leading-relaxed break-words whitespace-pre-wrap select-none ${
            isDeleted
              ? "bg-paper-200 text-ink-500 italic font-light"
              : isMine
                ? themeMyBubble
                : "bg-paper-50 text-ink-900 border border-[#E5E0D8]"
          }`}
        >
          {isDeleted ? (
            "送信を取り消しました"
          ) : (
            <>
              {message.media_url && message.media_type === "video" && (
                <video
                  src={message.media_url}
                  controls
                  className="max-w-full rounded-lg mb-1"
                />
              )}
              {message.media_url && message.media_type !== "video" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.media_url}
                  alt="media"
                  className="max-w-full rounded-lg mb-1"
                />
              )}
              {message.content}
            </>
          )}
        </div>

        {/* 時刻・編集済み */}
        <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-ink-500 font-light">
            {formatTime(message.created_at)}
          </span>
          {isEdited && (
            <span className="text-[10px] text-ink-500 font-light">編集済み</span>
          )}
        </div>

        {/* リアクション */}
        {Object.keys(reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
            {Object.entries(reactions).map(([emoji, info]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReactionClick(emoji)}
                className={`text-[12px] px-1.5 py-0.5 rounded-full border transition-colors ${
                  info.mine
                    ? "bg-coral-50 border-coral-300"
                    : "bg-paper-50 border-[#E5E0D8] hover:border-ink-500"
                }`}
              >
                {emoji} {info.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 管理者がアバターをタップしたときに開くパネル（チャットBAN・アクセスBAN）
function AdminUserPanel({
  userId,
  displayName,
  onClose,
  onError,
}: {
  userId: string;
  displayName: string;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"chatBan" | "accessBan" | null>(
    null
  );
  const [done, setDone] = useState<string | null>(null);

  const run = (
    key: "chatBan" | "accessBan",
    action: () => Promise<{ success: boolean; error?: string }>,
    doneText: string
  ) => {
    if (confirming !== key) {
      setConfirming(key);
      setDone(null);
      return;
    }
    setConfirming(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setDone(doneText);
        // BAN の効果（メンバー退出など）を確実に反映するため全リロード
        window.location.href = window.location.href;
      } else {
        onError(res.error ?? "操作に失敗しました");
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in">
      <div className="w-full sm:w-80 bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
        <div className="px-5 py-4 border-b border-[#E5E0D8]">
          <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
            Moderation
          </p>
          <p className="text-sm text-ink-900 mt-1 tracking-wide">{displayName}</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(
                "chatBan",
                () => chatBanAction(userId),
                "チャットBANしました"
              )
            }
            className="w-full text-[13px] tracking-[0.08em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-4 py-3 transition disabled:opacity-50"
          >
            {confirming === "chatBan"
              ? "もう一度押すと実行"
              : "チャットBAN（全チャット締め出し・予約は可）"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(
                "accessBan",
                () => accessBanAction(userId),
                "アクセスBANしました"
              )
            }
            className="w-full text-[13px] tracking-[0.08em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-4 py-3 transition disabled:opacity-50"
          >
            {confirming === "accessBan"
              ? "もう一度押すと実行"
              : "アクセスBAN（予約・チャットすべて不可）"}
          </button>

          {confirming && (
            <p className="text-[11px] text-coral-700 font-light">
              確認のためもう一度同じボタンを押してください。
            </p>
          )}
          {done && <p className="text-[12px] text-sage-700">{done}</p>}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="w-full px-4 py-3 text-sm text-ink-500 border-t border-[#E5E0D8] hover:bg-paper-50 transition disabled:opacity-50"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

// 管理者が他人のメッセージを削除する際の確認モーダル
function AdminDeleteConfirm({
  message,
  senderName,
  onConfirm,
  onClose,
}: {
  message: MessageRow;
  senderName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const preview =
    message.content || (message.media_type ? "[メディア]" : "（空のメッセージ）");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in">
      <div className="w-full sm:w-80 bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
        <div className="px-5 py-4 border-b border-[#E5E0D8]">
          <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
            Delete message
          </p>
          <p className="text-[11px] text-ink-500 mt-1 font-light">
            {senderName} の投稿
          </p>
          <p className="text-sm text-ink-900 mt-2 break-words whitespace-pre-wrap line-clamp-4">
            {preview}
          </p>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="w-full px-4 py-3.5 text-sm text-coral-700 hover:bg-coral-50 transition"
        >
          このメッセージを削除する
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3 text-sm text-ink-500 border-t border-[#E5E0D8] hover:bg-paper-50 transition"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

// 日付セパレーター（チャット中央に「6月4日」のような区切りを表示）
function DateSeparator({ iso }: { iso: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[10px] text-ink-500 font-light bg-paper-50 border border-[#E5E0D8] rounded-full px-3 py-0.5 tracking-wide">
        {formatDateLabel(iso)}
      </span>
    </div>
  );
}

// 同じ日（年月日）かどうかを判定する
function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// 「2026年6月4日（木）」のような日付ラベル。今年なら年を省く
function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("ja-JP", {
    year: sameYear ? undefined : "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
