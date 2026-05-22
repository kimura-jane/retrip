"use client";

import { useState, useTransition } from "react";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  userId: string;
  displayName: string;
  birthDate: string;
  gender: string;
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

  const handleApprove = () => {
    if (!confirm(`${displayName} さんを承認しますか？`)) return;
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

  const handleReject = () => {
    if (!confirm(`${displayName} さんを却下しますか？\n書類はクリアされ、再提出が必要になります。`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await rejectVerificationAction(userId);
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
            {displayName}: {message}
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
            <p className="text-neutral-800">{displayName}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">生年月日</p>
            <p className="text-neutral-800">{birthDate}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">性別</p>
            <p className="text-neutral-800">{gender}</p>
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

        <div className="flex items-center gap-2">
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
            onClick={handleReject}
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
      </CardContent>
    </Card>
  );
}
