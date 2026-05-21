"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/features/chat/actions";

type MessageRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
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
  senders: Record<string, SenderInfo>;
};

export function ChatRoomView({
  roomId,
  roomName,
  roomDescription,
  currentUserId,
  initialMessages,
  senders: initialSenders,
}: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [senders, setSenders] = useState<Record<string, SenderInfo>>(initialSenders);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 新メッセージが来たら一番下にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime 購読
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
          // 送信者情報が未取得なら取得
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, senders, supabase]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || isPending) return;
    setError(null);
    const optimisticInput = input;
    setInput("");

    startTransition(async () => {
      const result = await sendMessageAction(roomId, content);
      if (!result.success) {
        setError(result.error);
        setInput(optimisticInput);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-[#F5F6F0]">
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
            const showSender =
              !isMine &&
              (!prevMsg || prevMsg.user_id !== msg.user_id);
            const isDeleted = !!msg.deleted_at;
            const isEdited = !!msg.edited_at && !isDeleted;

            return (
              <MessageBubble
                key={msg.id}
                isMine={isMine}
                sender={sender}
                showSender={showSender}
                content={msg.content}
                createdAt={msg.created_at}
                isDeleted={isDeleted}
                isEdited={isEdited}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="flex-shrink-0 bg-white border-t border-neutral-200 px-3 py-2">
        {error && (
          <p className="text-xs text-red-600 mb-2 px-1">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 max-h-32"
            style={{ minHeight: "40px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 transition flex items-center justify-center"
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
  );
}

// ===========================================
// メッセージ吹き出しコンポーネント
// ===========================================

type MessageBubbleProps = {
  isMine: boolean;
  sender: SenderInfo | undefined;
  showSender: boolean;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  isEdited: boolean;
};

function MessageBubble({
  isMine,
  sender,
  showSender,
  content,
  createdAt,
  isDeleted,
  isEdited,
}: MessageBubbleProps) {
  const time = formatTime(createdAt);

  if (isMine) {
    return (
      <div className="flex justify-end items-end gap-1.5 px-1 py-0.5">
        <span className="text-[10px] text-neutral-400 mb-1 select-none">
          {time}
        </span>
        <div
          className={`max-w-[75%] px-3.5 py-2 rounded-2xl rounded-br-md text-sm break-words ${
            isDeleted
              ? "bg-neutral-200 text-neutral-500 italic"
              : "bg-brand-500 text-white"
          }`}
        >
          {isDeleted ? (
            "メッセージの送信を取り消しました"
          ) : (
            <>
              {content}
              {isEdited && (
                <span className="text-[10px] opacity-70 ml-1">(編集済み)</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-end gap-2 px-1 py-0.5">
      {/* アバター（連続発言では非表示でスペースだけ確保） */}
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
      <div className="flex flex-col items-start max-w-[75%]">
        {showSender && (
          <span className="text-[11px] text-neutral-500 mb-0.5 ml-1">
            {sender?.display_name ?? "不明なユーザー"}
          </span>
        )}
        <div className="flex items-end gap-1.5">
          <div
            className={`px-3.5 py-2 rounded-2xl rounded-bl-md text-sm break-words ${
              isDeleted
                ? "bg-neutral-200 text-neutral-500 italic"
                : "bg-white text-neutral-800 border border-neutral-200"
            }`}
          >
            {isDeleted ? (
              "メッセージの送信を取り消しました"
            ) : (
              <>
                {content}
                {isEdited && (
                  <span className="text-[10px] text-neutral-400 ml-1">
                    (編集済み)
                  </span>
                )}
              </>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 mb-1 select-none flex-shrink-0">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// 時刻フォーマット
// ===========================================

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (isSameDay) {
    return `${hh}:${mm}`;
  }
  const mo = date.getMonth() + 1;
  const d = date.getDate();
  return `${mo}/${d} ${hh}:${mm}`;
}
