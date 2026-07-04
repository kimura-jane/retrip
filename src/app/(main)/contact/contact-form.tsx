"use client";

import { useState, useTransition } from "react";
import { submitContactAction } from "@/features/contact/actions";

type FormState = {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  category: "general",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof FormState>(key: K, v: FormState[K]) => {
    setValues((s) => ({ ...s, [key]: v }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const { [key as string]: _removed, ...rest } = e;
      return rest;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("email", values.email);
    formData.set("category", values.category);
    formData.set("subject", values.subject);
    formData.set("message", values.message);

    startTransition(async () => {
      const result = await submitContactAction(formData);
      if (result.success) {
        setDone(true);
        setValues(INITIAL);
      } else {
        setMessage(result.error);
        setErrors(result.fieldErrors ?? {});
      }
    });
  };

  if (done) {
    return (
      <div className="border border-line bg-paper-50 p-8 text-center space-y-4">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Thank you
        </p>
        <p className="font-serif text-xl tracking-[0.04em] text-ink-900">
          お問い合わせを受け付けました
        </p>
        <p className="text-[13px] font-light leading-loose2 text-ink-500">
          ご入力いただいたメールアドレス宛に受付確認のメールをお送りしました。
          <br />
          担当より順次ご返信いたします（通常2〜3営業日以内）。
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setMessage(null);
          }}
          className="mt-4 inline-block px-6 py-3 border border-ink-900 text-ink-900 text-[12px] tracking-[0.15em] uppercase hover:bg-ink-900 hover:text-paper-100 transition-colors"
        >
          もう一度送る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field
        label="お名前"
        required
        error={errors.name}
        input={
          <input
            type="text"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="山田 太郎"
            className="w-full border border-line bg-paper-50 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
            disabled={isPending}
          />
        }
      />

      <Field
        label="メールアドレス"
        required
        error={errors.email}
        input={
          <input
            type="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-line bg-paper-50 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
            disabled={isPending}
          />
        }
      />

      <Field
        label="カテゴリ"
        required
        error={errors.category}
        input={
          <select
            value={values.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full border border-line bg-paper-50 px-4 py-3 text-[14px] text-ink-900 focus:outline-none focus:border-coral-500 transition"
            disabled={isPending}
          >
            <option value="general">サービス全般について</option>
            <option value="booking">予約・ツアーについて</option>
            <option value="payment">決済・返金について</option>
            <option value="account">アカウント・本人確認について</option>
            <option value="trouble">トラブル・不具合の報告</option>
            <option value="other">その他</option>
          </select>
        }
      />

      <Field
        label="件名"
        required
        error={errors.subject}
        input={
          <input
            type="text"
            value={values.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="例：予約のキャンセルについて"
            className="w-full border border-line bg-paper-50 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
            disabled={isPending}
          />
        }
      />

      <Field
        label="お問い合わせ内容"
        required
        error={errors.message}
        input={
          <textarea
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            rows={8}
            placeholder="お問い合わせ内容をご記入ください（10文字以上）"
            className="w-full border border-line bg-paper-50 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition resize-y"
            disabled={isPending}
          />
        }
        hint={`${values.message.length} / 4000 文字`}
      />

      <p className="text-[12px] text-ink-500 font-light leading-loose2">
        送信いただいた内容は
        <a href="/privacy" className="underline hover:text-coral-700">
          プライバシーポリシー
        </a>
        に従って取り扱います。
      </p>

      {message && (
        <p className="text-[13px] text-coral-700 font-light">{message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto px-8 py-3 bg-ink-900 text-paper-100 text-[12px] tracking-[0.15em] uppercase hover:bg-coral-700 transition-colors disabled:opacity-50"
      >
        {isPending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  input,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  input: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-baseline justify-between">
        <span className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
          {label}
          {required && <span className="ml-1 text-coral-500">*</span>}
        </span>
        {hint && (
          <span className="text-[11px] text-ink-500 font-light">{hint}</span>
        )}
      </label>
      {input}
      {error && (
        <p className="text-[12px] text-coral-700 font-light">{error}</p>
      )}
    </div>
  );
}
