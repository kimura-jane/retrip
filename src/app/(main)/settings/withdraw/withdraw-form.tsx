"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { withdrawAction } from "@/features/settings/actions";

export function WithdrawForm() {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    // 1回目のタップ：確認待ち
    if (!confirming) {
      setConfirming(true);
      setError(null);
      return;
    }
    // 2回目のタップ：実行
    setError(null);
    startTransition(async () => {
      const res = await withdrawAction(reason);
      if (res.success) {
        // signOut 済みなのでトップへフルリロード
        window.location.href = "/";
      } else {
        setConfirming(false);
        setError(res.error ?? "退会処理に失敗しました");
      }
    });
  };

  return (
    <section className="space-y-6">
      <div>
        <label
          htmlFor="withdraw-reason"
          className="block font-display italic uppercase tracking-widest2 text-[11px] text-ink-500 mb-3"
        >
          退会理由（任意）
        </label>
        <textarea
          id="withdraw-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            // 入力を変えたら確認状態をリセット
            if (confirming) setConfirming(false);
          }}
          disabled={isPending}
          rows={5}
          maxLength={1000}
          placeholder="今後の改善のため、よければ理由をお聞かせください。"
          className="w-full border border-line bg-paper-100 px-4 py-3 text-[14px] text-ink-900 font-light leading-loose focus:outline-none focus:border-ink-500 transition-colors disabled:opacity-50"
        />
        <p className="text-[11px] text-ink-500 font-light mt-2 text-right">
          {reason.length} / 1000
        </p>
      </div>

      <div className="border border-coral-500/40 bg-coral-50 p-5">
        <p className="text-[13px] text-ink-900 font-light leading-loose">
          このボタンを押すと、アカウントが論理削除されます。
          <br />
          <span className="text-coral-700">この操作は取り消せません。</span>
        </p>
      </div>

      {error && (
        <p className="text-[12px] text-coral-700 leading-loose">{error}</p>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/settings"
          className="font-display italic text-xs text-ink-500 hover:text-coral-500 transition-colors"
        >
          ← 設定に戻る
        </Link>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="text-[12px] tracking-[0.1em] text-paper-100 bg-coral-700 hover:bg-coral-500 px-6 py-3 transition disabled:opacity-50"
        >
          {isPending
            ? "処理中..."
            : confirming
            ? "もう一度押すと退会します"
            : "退会する"}
        </button>
      </div>

      {confirming && !isPending && (
        <p className="text-[11px] text-coral-700 font-light text-right">
          確認のためもう一度同じボタンを押してください。
        </p>
      )}
    </section>
  );
}
