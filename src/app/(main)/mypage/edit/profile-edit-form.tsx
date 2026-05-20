"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateProfileAction, type ActionResult } from "@/features/user/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  initialValues: {
    displayName: string;
    bio: string;
    gender: string;
    birthDate: string;
  };
};

export function ProfileEditForm({ initialValues }: Props) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">ニックネーム</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialValues.displayName}
          required
          maxLength={30}
        />
        {fieldErrors?.displayName && (
          <p className="text-xs text-red-600">{fieldErrors.displayName[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">自己紹介</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initialValues.bio}
          rows={5}
          maxLength={500}
          placeholder="趣味や、最近行ってよかった旅先など..."
        />
        {fieldErrors?.bio && (
          <p className="text-xs text-red-600">{fieldErrors.bio[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">性別</Label>
        <Select name="gender" defaultValue={initialValues.gender}>
          <SelectTrigger id="gender">
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">男性</SelectItem>
            <SelectItem value="female">女性</SelectItem>
            <SelectItem value="other">その他</SelectItem>
            <SelectItem value="prefer_not_to_say">回答しない</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">生年月日</Label>
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={initialValues.birthDate}
        />
        {fieldErrors?.birthDate && (
          <p className="text-xs text-red-600">{fieldErrors.birthDate[0]}</p>
        )}
      </div>

      {state && !state.success && !fieldErrors && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "保存する"}
        </Button>
        <Link href="/mypage">
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </Link>
      </div>
    </form>
  );
}
