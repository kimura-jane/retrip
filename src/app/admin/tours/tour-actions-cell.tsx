"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deleteTourAction,
  duplicateTourAction,
} from "@/features/tour/admin-actions";

export function TourActionsCell({ tourId }: { tourId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = () => {
    setError(null);
    startTransition(async () => {
      const res = await duplicateTourAction(tourId);
      if (!res.success) setError(res.error);
    });
  };

  const handleDelete = () => {
    if (!confirm("このツアーを削除します。元に戻せません。よろしいですか？")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteTourAction(tourId);
      if (!res.success) setError(res.error ?? "削除に失敗しました");
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/admin/tours/${tourId}/edit`}
          className="flex-1 sm:flex-none text-center text-[12px] tracking-[0.1em] text-ink-600 border border-line bg-paper-100 hover:bg-paper-200 px-3 py-2 transition"
        >
          編集
        </Link>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isPending}
          className="flex-1 sm:flex-none text-[12px] tracking-[0.1em] text-ink-600 border border-line bg-paper-100 hover:bg-paper-200 px-3 py-2 transition disabled:opacity-50"
        >
          複製
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex-1 sm:flex-none text-[12px] tracking-[0.1em] text-coral-700 border border-line bg-paper-100 hover:bg-coral-50 px-3 py-2 transition disabled:opacity-50"
        >
          削除
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-coral-700">{error}</p>
      )}
    </div>
  );
}
