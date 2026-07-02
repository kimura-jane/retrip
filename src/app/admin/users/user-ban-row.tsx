"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  accessUnbanAction,
  chatUnbanAction,
} from "@/features/admin/ban-actions";

type Props = {
  userId: string;
  displayName: string | null;
  banType: "access" | "chat";
  bannedAt: string | null;
};

export function UserBanRow({ userId, displayName, banType, bannedAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const name = displayName ?? "(名前未設定)";
  const banLabel = banType === "access" ? "アクセスBAN" : "チャットBAN";

  const handleUnban = () => {
    if (!confirming) {
      setConfirming(true);
      setMessage(null);
      return;
    }
    setConfirming(false);
    setMessage(null);
    startTransition(async () => {
      const result =
        banType === "access"
          ? await accessUnbanAction(userId)
          : await chatUnbanAction(userId);
      if (result.success) {
        setDone(true);
        setMessage(`${banLabel}を解除しました`);
        // サーバー側の一覧を再取得
        router.refresh();
      } else {
        setMessage(`エラー: ${result.error}`);
      }
    });
  };

  if (done) {
    return (
      <li className="border border-line bg-paper-50 p-4 opacity-60">
        <p className="text-[13px] text-sage-700 font-light">
          {name}: {message}
        </p>
      </li>
    );
  }

  return (
    <li className="border border-line bg-paper-50 p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
            {banType === "access" ? "Access banned" : "Chat banned"}
          </p>
          <p className="mt-1 font-serif text-[16px] tracking-[0.04em] text-ink-900 truncate">
            {name}
          </p>
          {bannedAt && (
            <p className="mt-1 text-[11px] text-ink-500 font-light">
              BAN 日時: {new Date(bannedAt).toLocaleString("ja-JP")}
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleUnban}
            disabled={isPending}
            className={`text-[12px] tracking-[0.08em] uppercase px-4 py-2 border transition disabled:opacity-50 ${
              confirming
                ? "border-coral-500 bg-coral-500 text-paper-50 hover:bg-coral-700"
                : "border-line bg-paper-100 text-coral-700 hover:bg-coral-50"
            }`}
          >
            {confirming ? "もう一度押すと解除" : "BAN を解除する"}
          </button>
          {confirming && (
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setMessage(null);
              }}
              disabled={isPending}
              className="text-[11px] text-ink-500 hover:text-ink-900 font-light transition"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
      {message && (
        <p className="mt-3 text-[12px] text-coral-700 font-light">{message}</p>
      )}
    </li>
  );
}
