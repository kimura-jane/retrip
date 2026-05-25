import Link from "next/link";

export default function SignUpConfirmPage() {
  return (
    <div className="space-y-12">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <p className="font-display italic uppercase tracking-widest2 text-[11px] text-coral-700">
          Almost there
        </p>
        <h1 className="font-serif text-3xl text-ink-900 leading-loose2">
          確認メールを送信しました
        </h1>
        <div className="mx-auto h-px w-10 bg-coral-500" />
        <p className="text-[13px] text-ink-500 font-light tracking-wide leading-loose">
          ご登録のメールアドレス宛に確認メールをお送りしました。
          <br />
          メール内のリンクをタップして、登録を完了してください。
        </p>
      </div>

      {/* 注意書き */}
      <div className="border-l-2 border-[#E5E0D8] pl-5 py-2">
        <p className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-2">
          Note
        </p>
        <p className="text-xs text-ink-900 font-light leading-loose">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。数分経っても届かない場合は、メールアドレスをご確認のうえ再度お試しください。
        </p>
      </div>

      {/* フッターリンク */}
      <div className="text-center">
        <Link
          href="/login"
          className="font-display italic uppercase tracking-widest2 text-xs text-coral-700 hover:text-coral-500 transition-colors border-b border-coral-700/40 hover:border-coral-500 pb-0.5"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
