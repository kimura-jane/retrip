import Link from "next/link";

export default function SignUpConfirmPage() {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <h1 className="font-serif text-3xl text-neutral-800">
          確認メールを送信しました
        </h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          ご登録のメールアドレス宛に確認メールをお送りしました。
          <br />
          メール内のリンクをタップして、登録を完了してください。
        </p>
      </div>

      <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 text-left">
        <p className="text-xs text-neutral-600 leading-relaxed">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
          数分経っても届かない場合は、メールアドレスをご確認のうえ再度お試しください。
        </p>
      </div>

      <Link
        href="/login"
        className="inline-block text-sm text-brand-600 hover:underline"
      >
        ログイン画面へ
      </Link>
    </div>
  );
}
