"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type ActionResult } from "@/features/auth/actions";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    signUpAction,
    null
  );

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;

  return (
    <div className="space-y-12">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700">
          Join us
        </p>
        <h1 className="font-serif text-3xl text-ink-900 leading-loose2">
          はじめまして
        </h1>
        <div className="mx-auto h-px w-10 bg-coral-500" />
        <p className="text-[13px] text-ink-500 font-light tracking-wide leading-loose">
          アカウントを作成して、旅へ出かけましょう
        </p>
      </div>

      {/* フォーム */}
      <form action={formAction} className="space-y-8">
        <div className="space-y-2">
          <label
            htmlFor="displayName"
            className="block font-display italic uppercase tracking-widest2 text-[10px] text-ink-500"
          >
            Nickname
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="たろう"
            required
            maxLength={30}
            autoComplete="nickname"
            className="w-full border-0 border-b border-[#E5E0D8] bg-transparent px-0 py-2.5 text-ink-900 font-light placeholder:text-ink-500/50 focus:outline-none focus:border-ink-900 transition-colors"
          />
          {fieldErrors?.displayName && (
            <p className="text-xs text-coral-700 font-light">{fieldErrors.displayName[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block font-display italic uppercase tracking-widest2 text-[10px] text-ink-500"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full border-0 border-b border-[#E5E0D8] bg-transparent px-0 py-2.5 text-ink-900 font-light placeholder:text-ink-500/50 focus:outline-none focus:border-ink-900 transition-colors"
          />
          {fieldErrors?.email && (
            <p className="text-xs text-coral-700 font-light">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block font-display italic uppercase tracking-widest2 text-[10px] text-ink-500"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="8文字以上"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border-0 border-b border-[#E5E0D8] bg-transparent px-0 py-2.5 text-ink-900 font-light placeholder:text-ink-500/50 focus:outline-none focus:border-ink-900 transition-colors"
          />
          {fieldErrors?.password && (
            <p className="text-xs text-coral-700 font-light">{fieldErrors.password[0]}</p>
          )}
        </div>

        {state && !state.success && !fieldErrors && (
          <p className="text-xs text-coral-700 font-light text-center">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-coral-500 hover:bg-coral-700 disabled:opacity-50 text-paper-50 transition-colors py-3.5 font-display italic uppercase tracking-widest2 text-xs"
        >
          {isPending ? "Creating..." : "Create account"}
        </button>
      </form>

      {/* フッターリンク */}
      <div className="text-center">
        <p className="text-[13px] text-ink-500 font-light tracking-wide">
          すでにアカウントをお持ちですか？{" "}
          <Link
            href="/login"
            className="text-coral-700 hover:text-coral-500 transition-colors border-b border-coral-700/40 hover:border-coral-500"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
