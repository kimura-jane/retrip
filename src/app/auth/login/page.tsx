"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null
  );

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl text-neutral-800">おかえりなさい</h1>
        <p className="text-sm text-neutral-600">
          メールアドレスとパスワードでログイン
        </p>
      </div>

      <form action={formAction} className="space-y-5">
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
            required
            autoComplete="current-password"
          />
          {fieldErrors?.password && (
            <p className="text-xs text-red-600">{fieldErrors.password[0]}</p>
          )}
        </div>

        {state && !state.success && !fieldErrors && (
          <p className="text-sm text-red-600 text-center">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "ログイン中..." : "ログインする"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="text-brand-600 hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
