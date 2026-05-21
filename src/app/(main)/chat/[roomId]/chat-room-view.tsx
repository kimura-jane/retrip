"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
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
} from "@/features/chat/actions";
import { ReactionPicker } from "@/features/chat/reaction-picker";
import { MessageMenu, type MessageMenuAction } from "@/features/chat/message-menu";
import { getTheme, getFont } from "@/features/chat/theme";
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
  initialMessages: MessageRow[];
  initialReactions: ReactionRow[];
  senders: Record<string, SenderInfo>;
  themeColor: ChatThemeColor;
  chatFont: ChatFont;
};

export function ChatRoomView({
  roomId,
  roomName,
  roomDescription,
  currentUserId,
  initialMessages,
  initialReactions,
  senders: initialSenders,
  themeColor,
  chatFont,
}: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [reactions, setReactions] = useState<ReactionRow[]>(initialReactions);
  const [senders, setSenders] = useState<Record<string, SenderInfo>>(initialSenders);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [menuFor, setMenuFor] = useState<MessageRow | null>(null);
  const [pickerFor, setPickerFor] = useState<MessageRow | null>(null);
  const [uploadPreview, setUploadPreview] = useState<{
    url: string;
    mediaType: "image" | "video" | "gif";
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const supabase = useMemo(() => createClient(), []);

  const theme = getTheme(themeColor);
  const font = getFont(chatFont);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
          if (!senders[newMessage.user_id]) {
            const { data } = await supabase
              .from("users")
              .select("display_name,avatar_url")
              .eq("id", newMessage.user_id)
              .maybeSingle();
            if (data) {
              setSenders((prev) => ({
                ...prev,
                [newMessage.user_id]: data as SenderInfo,
              }));
            }
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, senders, supabase]);

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

  return (
    <div
      className={`flex flex-col h-[calc(100dvh-57px)] ${theme.chatBg} ${font.className}`}
    >
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 py-3">
        <Link
          href="/chat"
          className="text-xs text-neutral-500 hover:text-neutral-800"
        >
          ← チャット一覧
        </Link>
        <h1 className="font-serif text-xl text-neutral-800 mt-1">{roomName}</h1>
        {roomDescription && (
          <p className="text-xs text-neutral-500 mt-0.5">{roomDescription}</p>
        )}
      </div>

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 mt-8">
            まだメッセージはありません。最初の投稿をしてみよう
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

            return (
              <MessageBubble
                key={msg.id}
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
                onLongPress={() => setMenuFor(msg)}
                onReactionClick={(emoji) => toggleReaction(msg.id, emoji)}
                onReplyClick={() => replyToMsg && jumpToMessage(replyToMsg.id)}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 返信プレビュー */}
      {replyTo && (
        <div className="flex-shrink-0 bg-neutral-100 border-t border-neutral-200 px-3 py-2 flex items-start gap-2">
          <div className={`w-1 self-stretch rounded-full ${theme.accentBorder}`} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-neutral-500">
              {senders[replyTo.user_id]?.display_name ?? "ユーザー"} に返信
            </p>
            <p className="text-xs text-neutral-700 truncate">
              {replyTo.deleted_at
                ? "（削除されたメッセージ）"
                : replyTo.content || (replyTo.media_type ? "[メディア]" : "")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-neutral-400 hover:text-neutral-700 text-lg leading-none px-1"
            aria-label="返信キャンセル"
          >
            ×
          </button>
        </div>
      )}

      {/* 編集プレビュー */}
      {editingId && (
        <div className="flex-shrink-0 bg-amber-50 border-t border-amber-200 px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-amber-800">メッセージを編集中</p>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setInput("");
            }}
            className="text-amber-700 hover:text-amber-900 text-xs"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* メディアプレビュー */}
      {uploadPreview && (
        <div className="flex-shrink-0 bg-neutral-100 border-t border-neutral-200 px-3 py-2">
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
              className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              aria-label="削除"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 入力欄 */}
      <div className="flex-shrink-0 bg-white border-t border-neutral-200 px-3 py-2">
        {error && <p className="text-xs text-red-600 mb-2 px-1">{error}</p>}
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
                className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-100 hover:bg-neutral-200 transition flex items-center justify-center disabled:opacity-40"
                aria-label="メディアを添付"
              >
                {isUploading ? (
                  <span className="text-xs">…</span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5 text-neutral-600"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                )}
              </button>
            </>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingId ? "編集内容を入力" : "メッセージを入力"}
            rows={1}
            className={`flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-base focus:outline-none focus:ring-2 ${theme.focusRing} max-h-32`}
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
}: MessageBubbleProps) {
  const time = formatTime(message.created_at);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const handlePointerDown = (_e: ReactPointerEvent) => {
    if (isDeleted) return;
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      if ("vibrate" in navigator) navigator.vibrate(30);
      onLongPress();
    }, 300);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerCancel = handlePointerUp;
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const avatar = (
    <div className="flex-shrink-0 w-8">
      {showSender && (
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs text-neutral-600 overflow-hidden">
          {sender?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sender.avatar_url}
              alt={sender.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            sender?.display_name?.[0] ?? "?"
          )}
        </div>
      )}
    </div>
  );

  const bubbleClass = isMine
    ? `${isDeleted ? "bg-neutral-200 text-neutral-500 italic" : themeMyBubble} rounded-br-md`
    : `${isDeleted ? "bg-neutral-200 text-neutral-500 italic" : "bg-white text-neutral-800 border border-neutral-200"} rounded-bl-md`;

  const bubbleContent = (
    <div
      ref={refSetter}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onContextMenu={handleContextMenu}
      className={`px-3.5 py-2 rounded-2xl text-sm break-words select-none transition-all ${bubbleClass} ${
        highlighted ? "ring-2 ring-amber-400 ring-offset-1" : ""
      }`}
      style={{ touchAction: "manipulation" }}
    >
      {replyToMsg && !isDeleted && (
        <button
          type="button"
          onClick={onReplyClick}
          className={`block w-full text-left mb-1.5 pl-2 border-l-2 ${
            isMine ? "border-white/60" : "border-neutral-400"
          } opacity-80 hover:opacity-100 transition`}
        >
          <p className={`text-[10px] ${isMine ? "text-white/80" : "text-neutral-500"}`}>
            {replyToSender?.display_name ?? "ユーザー"}
          </p>
          <p className={`text-xs truncate ${isMine ? "text-white/90" : "text-neutral-600"}`}>
            {replyToMsg.deleted_at
              ? "（削除されたメッセージ）"
              : replyToMsg.content || (replyToMsg.media_type ? "[メディア]" : "")}
          </p>
        </button>
      )}

      {!isDeleted && message.media_url && (
        <div className="mb-1 -mx-1">
          {message.media_type === "video" ? (
            <video
              src={message.media_url}
              className="max-w-full max-h-64 rounded-lg"
              controls
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.media_url}
              alt="送信画像"
              className="max-w-full max-h-64 rounded-lg"
            />
          )}
        </div>
      )}

      {isDeleted ? (
        "メッセージの送信を取り消しました"
      ) : (
        <>
          {message.content}
          {isEdited && (
            <span
              className={`text-[10px] ml-1 ${
                isMine ? "opacity-70" : "text-neutral-400"
              }`}
            >
              (編集済み)
            </span>
          )}
        </>
      )}
    </div>
  );

  const reactionChips = Object.keys(reactions).length > 0 && (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
      {Object.entries(reactions).map(([emoji, info]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReactionClick(emoji)}
          className={`px-1.5 py-0.5 rounded-full text-xs border transition ${
            info.mine
              ? "bg-brand-50 border-brand-300 text-neutral-800"
              : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <span className="mr-0.5">{emoji}</span>
          <span className="text-[10px]">{info.count}</span>
        </button>
      ))}
    </div>
  );

  if (isMine) {
    return (
      <div className="flex justify-end items-end gap-2 px-1 py-0.5">
        <div className="flex flex-col items-end max-w-[75%]">
          {showSender && (
            <span className="text-[11px] text-neutral-500 mb-0.5 mr-1">
              {sender?.display_name ?? "自分"}
            </span>
          )}
          <div className="flex items-end gap-1.5">
            <span className="text-[10px] text-neutral-400 mb-1 select-none flex-shrink-0">
              {time}
            </span>
            {bubbleContent}
          </div>
          {reactionChips}
        </div>
        {avatar}
      </div>
    );
  }

  return (
    <div className="flex justify-start items-end gap-2 px-1 py-0.5">
      {avatar}
      <div className="flex flex-col items-start max-w-[75%]">
        {showSender && (
          <span className="text-[11px] text-neutral-500 mb-0.5 ml-1">
            {sender?.display_name ?? "不明なユーザー"}
          </span>
        )}
        <div className="flex items-end gap-1.5">
          {bubbleContent}
          <span className="text-[10px] text-neutral-400 mb-1 select-none flex-shrink-0">
            {time}
          </span>
        </div>
        {reactionChips}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
