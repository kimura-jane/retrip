"use client";

import { useState, useTransition } from "react";
import {
  accessBanAction,
  accessUnbanAction,
  chatBanAction,
  chatUnbanAction,
} from "@/features/admin/ban-actions";

type Props = {
  userId: string;
  isBanned: boolean;
  isChatBanned: boolean;
};

export function BanControls({ userId, isBanned, isChatBanned }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = (
    action: () => Promise<{ success: boolean; error?: string }>,
    confirmText: string,
    doneText: string
  ) => {
    if (!confirm(confirmText)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(doneText);
      } else {
        setError(res.error ?? "操作に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* チャットBAN */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[13px] text-ink-900">チャットBAN</p>
          <p className="text-[11px] text-ink-500 font-light">
            全チャットから締め出します（予約は可能）
          </p>
        </div>
        {isChatBanned ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(
                () => chatUnbanAction(userId),
                "チャットBANを解除しますか？",
                "チャットBANを解除しました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-sage-700 border border-line bg-paper-100 hover:bg-sage-50 px-4 py-2 transition disabled:opacity-50"
          >
            チャットBAN解除
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending || isBanned}
            onClick={() =>
              run(
                () => chatBanAction(userId),
                "このユーザーを全チャットから締め出します。よろしいですか？",
                "チャットBANしました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-4 py-2 transition disabled:opacity-50"
          >
            チャットBAN
          </button>
        )}
      </div>

      {/* アクセスBAN */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-t border-line pt-4">
        <div>
          <p className="text-[13px] text-ink-900">アクセスBAN</p>
          <p className="text-[11px] text-ink-500 font-light">
            予約・チャットすべてを不可にします
          </p>
        </div>
        {isBanned ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(
                () => accessUnbanAction(userId),
                "アクセスBANを解除しますか？",
                "アクセスBANを解除しました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-sage-700 border border-line bg-paper-100 hover:bg-sage-50 px-4 py-2 transition disabled:opacity-50"
          >
            アクセスBAN解除
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(
                () => accessBanAction(userId),
                "このユーザーの予約・チャットをすべて不可にします。よろしいですか？",
                "アクセスBANしました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-4 py-2 transition disabled:opacity-50"
          >
            アクセスBAN
          </button>
        )}
      </div>

      {message && <p className="text-[12px] text-sage-700">{message}</p>}
      {error && <p className="text-[12px] text-coral-700">{error}</p>}
    </div>
  );
}
