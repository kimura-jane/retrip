"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { uploadIdDocumentAction, type ActionResult } from "@/features/user/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IdUploadForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    uploadIdDocumentAction,
    null
  );

  if (state?.success) {
    setTimeout(() => router.push("/mypage"), 1500);
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="idDocument">画像ファイル</Label>
        <Input
          id="idDocument"
          name="idDocument"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          required
        />
        <p className="text-xs text-neutral-500">
          JPEG, PNG, WebP, HEIC（10MB以下）
        </p>
      </div>

      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-brand-600">
          {state.message ?? "送信しました"}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "アップロード中..." : "提出する"}
      </Button>
    </form>
  );
}
