"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { uploadAvatarAction, type ActionResult } from "@/features/user/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  currentAvatarUrl: string | null;
  displayName: string;
};

export function AvatarUploadForm({ currentAvatarUrl, displayName }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    uploadAvatarAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      // 成功したらページ全体をリロード（router.refresh だとクラッシュする場合があるため）
      window.location.href = "/mypage/edit";
    }
  }, [state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      setSelectedFileName(null);
      return;
    }
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const initial = displayName.length > 0 ? displayName.charAt(0) : "?";
  const displayUrl = previewUrl ?? currentAvatarUrl;

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {displayUrl ? <AvatarImage src={displayUrl} alt={displayName} /> : null}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileChange}
            className="block w-full text-xs text-neutral-600 file:mr-2 file:rounded file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1 file:text-xs file:text-neutral-700"
          />
          <p className="text-xs text-neutral-500">
            JPEG, PNG, WebP, HEIC（5MB以下）
          </p>
        </div>
      </div>

      {selectedFileName && (
        <p className="text-xs text-neutral-600">選択中: {selectedFileName}</p>
      )}

      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-green-700">{state.message ?? "更新しました"}</p>
      )}

      <Button type="submit" size="sm" disabled={isPending || !selectedFileName}>
        {isPending ? "アップロード中..." : "アイコンを変更する"}
      </Button>
    </form>
  );
}
