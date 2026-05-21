"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/features/chat/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

type Props = {
  roomId: string;
  currentUserId: string;
  initialMessages: MessageWithUser[];
};

export function ChatRoomView({ roomId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<MessageWithUser[]>(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 初回・新着メッセージ時に最下部へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime 購読
  useEffect(() => {
    const supabase = createClient();

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
          const newMsg = payload.new as {
            id: string;
            content: string;
            created_at: string;
            user_id: string;
          };

          // 投稿ユーザー情報を取得
          const { data } = await supabase
            .from("users")
            .select("display_name,avatar_url")
            .eq("id", newMsg.user_id)
            .maybeSingle();

          const userInfo = data as { display_name: string; avatar_url: string | null } | null;

          setMessages((prev) => {
            // 重複チェック
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                content: newMsg.content,
                created_at: newMsg.created_at,
                user_id: newMsg.user_id,
                users: userInfo,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const text = content;
    setContent("");
    setError(null);

    startTransition(async () => {
      const result = await sendMessageAction(roomId, text);
      if (!result.success) {
        setError(result.error);
        setContent(text); // 失敗時は入力を戻す
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] border border-neutral-200 rounded-lg bg-white">
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-8">
            まだメッセージはありません。最初の投稿をしてみよう
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {msg.users?.avatar_url ? (
                    <AvatarImage src={msg.users.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {msg.users?.display_name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isMine ? "items-end" : ""} max-w-[75%]`}>
                  <span className="text-xs text-neutral-500 mb-1">
                    {msg.users?.display_name ?? "不明"}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                      isMine
                        ? "bg-brand-500 text-white"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 投稿フォーム */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-neutral-200 p-3 space-y-2"
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 items-end">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="メッセージを入力..."
            rows={2}
            maxLength={2000}
            disabled={isPending}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isPending || !content.trim()}
            size="sm"
          >
            {isPending ? "..." : "送信"}
          </Button>
        </div>
        <p className="text-[10px] text-neutral-400">
          Ctrl/⌘ + Enter で送信
        </p>
      </form>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");

  if (sameDay) return `${hh}:${mm}`;

  const mo = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${mo}/${day} ${hh}:${mm}`;
}
