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

type PendingKey = "chatBan" | "chatUnban" | "accessBan" | "accessUnban" | null;

export function BanControls({ userId, isBanned, isChatBanned }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // 確認待ち中のボタン（もう一度押すと実行）
  const [confirming, setConfirming] = useState<PendingKey>(null);

  const run = (
    key: Exclude<PendingKey, null>,
    action: () => Promise<{ success: boolean; error?: string }>,
    doneText: string
  ) => {
    // 1回目のタップ：確認待ち状態にする
    if (confirming !== key) {
      setConfirming(key);
      setError(null);
      setMessage(null);
      return;
    }
    // 2回目のタップ：実行
    setConfirming(null);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        setMessage(doneText);
        // 一覧/詳細を最新化
        window.location.href = window.location.href;
      } else {
        setError(res.error ?? "操作に失敗しました");
      }
    });
  };

  const label = (key: Exclude<PendingKey, null>, normal: string) =>
    confirming === key ? "もう一度押すと実行" : normal;

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
                "chatUnban",
                () => chatUnbanAction(userId),
                "チャットBANを解除しました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-sage-700 border border-line bg-paper-100 hover:bg-sage-50 px-4 py-2 transition disabled:opacity-50"
          >
            {label("chatUnban", "チャットBAN解除")}
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending || isBanned}
            onClick={() =>
              run(
                "chatBan",
                () => chatBanAction(userId),
                "チャットBANしました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-4 py-2 transition disabled:opacity-50"
          >
            {label("chatBan", "チャットBAN")}
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
                "accessUnban",
                () => accessUnbanAction(userId),
                "アクセスBANを解除しました"
              )
            }
            className="text-[12px] tracking-[0.1em] text-sage-700 border border-line bg-paper-100 hover:bg-sage-50 px-4 py-2 transition disabled:opacity-50"
          >
            {label("accessUnban", "アクセスBAN解除")}
          </button>
        ) : (
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
            className="text-[12px] tracking-[0.1em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-4 py-2 transition disabled:opacity-50"
          >
            {label("accessBan", "アクセスBAN")}
          </button>
        )}
      </div>

      {confirming && (
        <p className="text-[11px] text-coral-700 font-light">
          確認のためもう一度同じボタンを押してください。
        </p>
      )}
      {message && <p className="text-[12px] text-sage-700">{message}</p>}
      {error && <p className="text-[12px] text-coral-700">{error}</p>}
    </div>
  );
}
