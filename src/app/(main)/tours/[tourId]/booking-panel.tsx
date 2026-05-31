"use client";

import { useState } from "react";
import { startCheckoutAction } from "@/features/booking/actions";
import type { MeetingPoint } from "@/types/database";

type Props = {
  tourId: string;
  meetingPoints: MeetingPoint[];
};

export default function BookingPanel({ tourId, meetingPoints }: Props) {
  // 初期選択は先頭（メイン集合場所）
  const [selectedId, setSelectedId] = useState<string>(
    meetingPoints[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedId) {
      setError("集合場所を選択してください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await startCheckoutAction(tourId, selectedId);
      if (result.success) {
        // Stripe Checkout へリダイレクト
        window.location.href = result.url;
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError("予約処理中にエラーが発生しました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  };

  return (
    <div className="mt-10">
      {/* 集合場所の選択 */}
      {meetingPoints.length > 0 && (
        <div className="mb-6">
          <label className="block font-display italic text-[11px] tracking-widest2 uppercase text-coral-700 mb-3">
            Meeting Point
          </label>
          <div className="space-y-2">
            {meetingPoints.map((p, i) => {
              const checked = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  disabled={loading}
                  className={`w-full text-left border px-4 py-3 transition-colors ${
                    checked
                      ? "border-coral-500 bg-coral-50"
                      : "border-line bg-paper-100 hover:border-ink-500"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[14px] text-ink-900">
                      {p.name}
                    </span>
                    <span className="font-display italic text-[11px] tracking-widest2 text-ink-500">
                      {p.time}
                    </span>
                  </div>
                  {i === 0 && (
                    <span className="mt-1 inline-block text-[10px] tracking-widest2 uppercase text-coral-700 font-display italic">
                      Main
                    </span
