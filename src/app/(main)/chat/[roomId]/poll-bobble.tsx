"use client";

import { useState, useTransition } from "react";
import { castVoteAction, removeVoteAction } from "@/features/poll/actions";
import type { PollOption } from "@/types/database";

export type PollData = {
  id: string;
  question: string;
  options: PollOption[];
  voteCounts: Record<string, number>; // option_id → 票数
  myVoteOptionId: string | null;       // 自分が投票した option_id（未投票なら null）
  createdBy: string;
};

type Props = {
  poll: PollData;
  currentUserId: string;
  isAdmin: boolean;
  onDeleteRequest?: () => void;
  onVoteChange: (pollId: string, newOptionId: string | null) => void;
};

export function PollBubble({
  poll,
  currentUserId,
  isAdmin,
  onDeleteRequest,
  onVoteChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalVotes = Object.values(poll.voteCounts).reduce(
    (sum, n) => sum + n,
    0
  );

  const isOwner = poll.createdBy === currentUserId;
  const canDelete = isOwner || isAdmin;

  const handleVote = (optionId: string) => {
    if (isPending) return;
    setError(null);

    // すでにこれに入れていたら取り消し、そうでなければ付け替え
    const isCurrentVote = poll.myVoteOptionId === optionId;
    const nextOptionId = isCurrentVote ? null : optionId;

    // 楽観更新
    onVoteChange(poll.id, nextOptionId);

    startTransition(async () => {
      const result = isCurrentVote
        ? await removeVoteAction(poll.id)
        : await castVoteAction(poll.id, optionId);
      if (!result.success) {
        setError(result.error);
        // ロールバック
        onVoteChange(poll.id, poll.myVoteOptionId);
      }
    });
  };

  return (
    <div className="my-3 w-full max-w-md mx-auto bg-paper-50 border border-[#E5E0D8] px-4 py-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
          Poll
        </p>
        {canDelete && onDeleteRequest && (
          <button
            type="button"
            onClick={onDeleteRequest}
            disabled={isPending}
            className="text-[10px] tracking-[0.1em] text-ink-500 hover:text-coral-700 transition-colors"
          >
            削除
          </button>
        )}
      </div>

      {/* 質問 */}
      <h3 className="mt-2 font-serif text-base text-ink-900 leading-snug">
        {poll.question}
      </h3>

      {/* 選択肢 */}
      <div className="mt-4 space-y-2">
        {poll.options.map((opt) => {
          const count = poll.voteCounts[opt.id] ?? 0;
          const ratio = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isMine = poll.myVoteOptionId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              disabled={isPending}
              className={`relative w-full text-left border transition overflow-hidden ${
                isMine
                  ? "border-coral-500 bg-paper-100"
                  : "border-[#E5E0D8] bg-paper-100 hover:border-coral-300"
              } disabled:opacity-60`}
            >
              {/* 投票率のバー（背景） */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  isMine ? "bg-coral-100" : "bg-paper-200"
                }`}
                style={{ width: `${ratio}%` }}
              />
              {/* 中身（前面） */}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[11px] tracking-[0.1em] flex-shrink-0 ${
                      isMine ? "text-coral-700" : "text-ink-500"
                    }`}
                  >
                    {isMine ? "●" : "○"}
                  </span>
                  <span className="text-[13px] text-ink-900 font-light truncate">
                    {opt.label}
                  </span>
                </div>
                <span
                  className={`flex-shrink-0 text-[11px] font-display italic tracking-widest2 ml-3 ${
                    isMine ? "text-coral-700" : "text-ink-500"
                  }`}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* フッター */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px] font-display italic uppercase tracking-widest2 text-ink-500">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} · anonymous
        </p>
        {poll.myVoteOptionId && (
          <button
            type="button"
            onClick={() => handleVote(poll.myVoteOptionId!)}
            disabled={isPending}
            className="text-[10px] tracking-[0.1em] text-ink-500 hover:text-coral-700 transition-colors"
          >
            投票を取り消す
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-coral-700 font-light">{error}</p>
      )}
    </div>
  );
}
