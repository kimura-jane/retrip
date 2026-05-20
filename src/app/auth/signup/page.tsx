"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signUpAction,
    null
  );

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl text-neutral-800">はじめまして</h1>
        <p className="text-sm text-neutral-600">
          アカウントを作成して、旅へ出かけましょう
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="displayName">ニックネーム</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="たろう"
            required
            maxLength={30}
            autoComplete="nickname"
          />
          {fieldErrors?.displayName && (
            <p className="text-xs text-red-600">{fieldErrors.displayName[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          {fieldErrors?.email && (
            <p className="text-xs text-red-600">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="8文字以上"
            required
            minLength={8}
            autoComplete="new-password"
          />
          {fieldErrors?.password && (
            <p className="text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        {state && !state.success && !fieldErrors && (
          <p className="text-sm text-red-600 text-center">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "送信中..." : "アカウントを作成する"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600">
        すでにアカウントをお持ちですか？{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
