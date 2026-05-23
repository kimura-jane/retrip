"use client";

import { useState, useTransition } from "react";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Props = {
  userId: string;
  displayName: string | null;
  birthDate: string | null;
  gender: string | null;
  createdAt: string;
  signedUrl: string | null;
};

export function VerificationRow({
  userId,
  displayName,
  birthDate,
  gender,
  createdAt,
  signedUrl,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  const name = displayName ?? "(名前未設定)";

  const handleApprove = () => {
    if (!confirm(`${name} さんを承認しますか？`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await approveVerificationAction(userId);
      if (result.success) {
        setMessage("承認しました");
        setDone(true);
      } else {
        setMessage(`エラー: ${result.error}`);
      }
    });
  };

  const handleRejectSubmit = () => {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      setMessage("却下理由を入力してください");
      return;
    }
    if (!confirm(`${name} さんを却下しますか？\n書類はクリアされ、再提出が必要になります。`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await rejectVerificationAction(userId, trimmed);
      if (result.success) {
        setMessage("却下しました");
        setDone(true);
      } else {
        setMessage(`エラー: ${result.error}`);
      }
    });
  };

  if (done) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-4">
          <p className="text-sm text-neutral-600">
            {name}: {message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-neutral-500">表示名</p>
            <p className="text-neutral-800">{name}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">生年月日</p>
            <p className="text-neutral-800">{birthDate ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">性別</p>
            <p className="text-neutral-800">{gender ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">提出日</p>
            <p className="text-neutral-800">
              {new Date(createdAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-2">本人確認書類</p>
          {signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signedUrl}
              alt="本人確認書類"
              className="max-w-full max-h-96 rounded border border-neutral-200"
            />
          ) : (
            <p className="text-xs text-red-600">書類URLの読み込みに失敗しました</p>
          )}
        </div>

        {showRejectForm ? (
          <div className="space-y-2 rounded border border-neutral-200 p-3 bg-neutral-50">
            <Label htmlFor={`reason-${userId}`} className="text-xs text-neutral-600">
              却下理由（ユーザーに表示されます・500文字以内）
            </Label>
            <textarea
              id={`reason-${userId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
              placeholder="例：書類の文字が不鮮明です。明るい場所で再撮影をお願いします。"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                onClick={handleRejectSubmit}
                disabled={isPending}
                size="sm"
                variant="destructive"
              >
                却下を確定
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowRejectForm(false);
                  setReason("");
                  setMessage(null);
                }}
                disabled={isPending}
                size="sm"
                variant="ghost"
              >
                キャンセル
              </Button>
              {message && (
                <span className="text-xs text-red-600 ml-2">{message}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              size="sm"
            >
              承認する
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowRejectForm(true);
                setMessage(null);
              }}
              disabled={isPending}
              size="sm"
              variant="outline"
            >
              却下する
            </Button>
            {message && (
              <span className="text-xs text-neutral-600 ml-2">{message}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
