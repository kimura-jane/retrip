"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "お名前を入力してください")
    .max(100, "お名前は100文字以内で入力してください"),
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  category: z.enum(
    ["general", "booking", "payment", "account", "trouble", "other"],
    { errorMap: () => ({ message: "カテゴリを選択してください" }) }
  ),
  subject: z
    .string()
    .trim()
    .min(1, "件名を入力してください")
    .max(200, "件名は200文字以内で入力してください"),
  message: z
    .string()
    .trim()
    .min(10, "お問い合わせ内容は10文字以上で入力してください")
    .max(4000, "お問い合わせ内容は4000文字以内で入力してください"),
});

const CATEGORY_LABEL: Record<
  z.infer<typeof contactSchema>["category"],
  string
> = {
  general: "サービス全般について",
  booking: "予約・ツアーについて",
  payment: "決済・返金について",
  account: "アカウント・本人確認について",
  trouble: "トラブル・不具合の報告",
  other: "その他",
};

export type ContactActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function submitContactAction(
  formData: FormData
): Promise<ContactActionResult> {
  // バリデーション
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    category: formData.get("category"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      success: false,
      error: "入力内容に不備があります",
      fieldErrors,
    };
  }

  const { name, email, category, subject, message } = parsed.data;

  // 環境変数
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL_TO;
  const fromEmail = process.env.CONTACT_EMAIL_FROM;

  if (!apiKey || !toEmail || !fromEmail) {
    console.error("Contact form: missing env vars", {
      hasApiKey: !!apiKey,
      hasTo: !!toEmail,
      hasFrom: !!fromEmail,
    });
    return {
      success: false,
      error:
        "送信環境が正しく設定されていません。時間をおいて再度お試しいただくか、直接メールでお問い合わせください。",
    };
  }

  const categoryLabel = CATEGORY_LABEL[category];

  // 運営宛メール本文
  const adminBody = [
    "Re:Trip お問い合わせフォームより送信がありました。",
    "",
    `お名前：${name}`,
    `メール：${email}`,
    `カテゴリ：${categoryLabel}`,
    `件名：${subject}`,
    "",
    "───────────────────",
    "お問い合わせ内容",
    "───────────────────",
    message,
    "",
  ].join("\n");

  // 送信者宛の自動返信本文
  const userBody = [
    `${name} 様`,
    "",
    "Re:Trip へお問い合わせいただき、誠にありがとうございます。",
    "以下の内容でお問い合わせを受け付けました。",
    "内容を確認の上、担当より順次ご返信いたします（通常2〜3営業日以内）。",
    "",
    "───────────────────",
    `カテゴリ：${categoryLabel}`,
    `件名：${subject}`,
    "───────────────────",
    "お問い合わせ内容",
    "───────────────────",
    message,
    "───────────────────",
    "",
    "本メールは自動送信です。ご返信いただいてもお答えできませんのでご了承ください。",
    "",
    "Re:Trip",
    "https://retrip-coral.vercel.app/",
  ].join("\n");

  try {
    // 運営宛
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `[Re:Trip お問い合わせ] ${categoryLabel} / ${subject}`,
        text: adminBody,
      }),
    });

    if (!adminRes.ok) {
      const errText = await adminRes.text();
      console.error("Resend admin send failed:", adminRes.status, errText);
      return {
        success: false,
        error:
          "メール送信に失敗しました。時間をおいて再度お試しください。問題が続く場合は直接メールでお問い合わせください。",
      };
    }

    // 自動返信（失敗しても運営側は届いているので致命的ではない）
    const userRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "【Re:Trip】お問い合わせを受け付けました",
        text: userBody,
      }),
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      // 自動返信失敗はログのみ
      console.warn("Resend auto-reply failed:", userRes.status, errText);
    }

    return { success: true };
  } catch (err) {
    console.error("Contact submit exception:", err);
    return {
      success: false,
      error:
        "送信中にエラーが発生しました。時間をおいて再度お試しください。",
    };
  }
}
