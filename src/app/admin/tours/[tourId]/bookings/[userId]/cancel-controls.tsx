"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCancelBookingAction } from "@/features/booking/admin-actions";
import type { BookingStatus } from "@/types/database";

type Props = {
  tourId: string;
  userId: string;
  bookingId: string;
  status: BookingStatus;
  amountPaid: number;
  hasPaymentIntent: boolean;
};

type RefundType = "full" | "partial" | "none";

export function CancelControls({
  tourId,
  userId,
  bookingId,
  status,
  amountPaid,
  hasPaymentIntent,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [refundType, setRefundType] = useState<RefundType>("full");
  const [partialAmount, setPartialAmount] = useState<string>(
    String(amountPaid)
  );
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status === "cancelled") {
    return (
      <div className="border border-line bg-paper-100 p-4">
        <p className="text-[13px] text-ink-500 font-light">
          この予約はキャンセル済みです。
        </p>
      </div>
    );
  }

  const openModal = () => {
    setOpen(true);
    setRefundType("full");
    setPartialAmount(String(amountPaid));
    setReason("");
    setConfirming(false);
    setError(null);
  };

  const closeModal = () => {
    if (isPending) return;
    setOpen(false);
  };

  const handleConfirm = () => {
    setError(null);
    // 一度目のクリックは確認ステップに入るだけ
    if (!confirming) {
      // 入力バリデーション
      if (!reason.trim()) {
        setError("キャンセル理由を入力してください");
        return;
      }
      if (refundType === "partial") {
        const n = Number(partialAmount);
        if (!Number.isFinite(n) || n <= 0 || n > amountPaid) {
          setError(
            `返金額は 1〜${amountPaid.toLocaleString()} 円の範囲で指定してください`
          );
          return;
        }
      }
      setConfirming(true);
      return;
    }

    // 二度目のクリックで実行
    startTransition(async () => {
      const res = await adminCancelBookingAction({
        tourId,
        userId,
        bookingId,
        refundType,
        refundAmount:
          refundType === "partial" ? Number(partialAmount) : undefined,
        reason: reason.trim(),
      });
      if (!res.success) {
        setError(res.error);
        setConfirming(false);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  const refundLabel: Record<RefundType, string> = {
    full: `全額返金（¥${amountPaid.toLocaleString()}）`,
    partial: "一部返金",
    none: "返金なし",
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-[13px] tracking-[0.08em] text-coral-700 border border-coral-300 bg-coral-50 hover:bg-coral-100 px-4 py-3 transition"
      >
        予約をキャンセルする
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeModal}
        >
          <div
            className="bg-paper-50 w-full sm:max-w-md border border-line shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="px-5 py-4 border-b border-line">
              <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
                Cancel Booking
              </p>
              <h3 className="mt-1 font-serif text-lg tracking-[0.04em] text-ink-900">
                予約をキャンセル
              </h3>
              <p className="mt-2 text-[12px] text-ink-500 font-light leading-relaxed">
                支払額: ¥{amountPaid.toLocaleString()}
                {!hasPaymentIntent && (
                  <>
                    <br />
                    <span className="text-coral-700">
                      ⚠ Stripe 決済情報がないため、返金なしのみ選択可能です。
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* 本体 */}
            <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* 返金方法 */}
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light mb-2">
                  返金方法
                </p>
                <div className="space-y-2">
                  {(["full", "partial", "none"] as RefundType[]).map((t) => {
                    const disabled = !hasPaymentIntent && t !== "none";
                    const active = refundType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={disabled || isPending || confirming}
                        onClick={() => setRefundType(t)}
                        className={`w-full text-left border px-4 py-3 text-[13px] transition ${
                          active
                            ? "border-coral-500 bg-coral-500/10 text-ink-900"
                            : "border-line bg-paper-100 text-ink-600 hover:border-coral-300"
                        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <span className="font-serif">{refundLabel[t]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 部分返金額入力 */}
              {refundType === "partial" && (
                <div>
                  <p className="text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light mb-2">
                    返金額（円）
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={amountPaid}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    disabled={isPending || confirming}
                    className="w-full bg-paper-100 border border-line px-3 py-2 text-[14px] text-ink-900 focus:outline-none focus:border-coral-500 transition"
                  />
                  <p className="mt-1 text-[11px] text-ink-500 font-light">
                    最大 ¥{amountPaid.toLocaleString()} まで
                  </p>
                </div>
              )}

              {/* 理由 */}
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light mb-2">
                  キャンセル理由（内部記録用）
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isPending || confirming}
                  rows={3}
                  className="w-full bg-paper-100 border border-line px-3 py-2 text-[14px] text-ink-900 focus:outline-none focus:border-coral-500 transition resize-y"
                  placeholder="例：ユーザーからのキャンセル依頼、体調不良のため"
                />
              </div>

              {/* エラー */}
              {error && (
                <div className="border border-coral-300 bg-coral-50 px-3 py-2">
                  <p className="text-[12px] text-coral-700">{error}</p>
                </div>
              )}

              {/* 確認メッセージ */}
              {confirming && (
                <div className="border border-coral-500 bg-coral-500/10 px-3 py-3">
                  <p className="text-[12px] text-coral-700 leading-relaxed">
                    以下の内容でキャンセルを実行します。この操作は取り消せません。
                  </p>
                  <ul className="mt-2 text-[12px] text-ink-900 font-light space-y-1">
                    <li>返金方法: {refundLabel[refundType]}</li>
                    {refundType === "partial" && (
                      <li>返金額: ¥{Number(partialAmount).toLocaleString()}</li>
                    )}
                    <li>チャットルームからも自動退出させます</li>
                  </ul>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="px-5 py-4 border-t border-line flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900 transition"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="bg-coral-500 hover:bg-coral-700 text-paper-100 text-[12px] tracking-[0.15em] uppercase px-5 py-2 transition disabled:opacity-50"
              >
                {isPending
                  ? "実行中..."
                  : confirming
                  ? "もう一度押して実行"
                  : "次へ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
