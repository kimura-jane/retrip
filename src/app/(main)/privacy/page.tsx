import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Re:Trip",
  description:
    "Re:Trip における個人情報の取扱いについて。取得情報、利用目的、第三者提供、安全管理措置、開示請求などを定めています。",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 md:py-20 text-center">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Privacy Policy
          </p>
          <h1 className="mt-5 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            プライバシーポリシー
          </h1>
          <p className="mt-6 text-[13px] font-light tracking-[0.08em] leading-loose2 text-ink-500">
            制定日：2026年4月1日
            <br className="hidden sm:block" />
            最終改定日：2026年4月1日
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 space-y-10 text-[14px] font-light leading-loose2 tracking-[0.04em] text-ink-700">
          <p>
            株式会社○○○（以下「当社」といいます。）は、当社が提供する少人数国内グループ旅行サービス「Re:Trip」（以下「本サービス」といいます。）における個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
          </p>

          <Article title="第1条（取得する個人情報）">
            <p>当社は、本サービスの提供にあたり、以下の個人情報を取得します。</p>
            <List
              items={[
                "氏名、生年月日、性別、居住地域",
                "メールアドレス、電話番号",
                "本人確認書類の画像（運転免許証、パスポート、マイナンバーカード等）",
                "プロフィール情報（自己紹介文、アバター画像）",
                "予約履歴、決済情報（Stripe を通じて処理し、当社ではカード番号は保持しません）",
                "本サービス上のチャット、投稿、その他のコンテンツ",
                "IPアドレス、Cookie、閲覧履歴、デバイス情報等のアクセスログ",
              ]}
            />
          </Article>

          <Article title="第2条（利用目的）">
            <p>当社は、取得した個人情報を以下の目的で利用します。</p>
            <List
              items={[
                "本サービスの提供、運営、および会員間コミュニケーションの円滑化",
                "本人確認および会員資格の審査",
                "旅行代金の決済、返金処理",
                "ツアーの実施に必要な参加者情報の管理（当日の集合確認、緊急連絡等）",
                "本サービスに関する重要なお知らせ、ご案内、キャンペーン情報等の配信",
                "お問い合わせ、ご相談への対応",
                "本サービスの改善、新機能の開発、統計データの作成",
                "利用規約に違反する行為への対応、トラブルの調査、防止",
                "法令に基づく開示、報告等の対応",
              ]}
            />
          </Article>

          <Article title="第3条（第三者提供）">
            <p>
              当社は、以下のいずれかに該当する場合を除き、あらかじめ会員の同意を得ることなく、個人情報を第三者に提供しません。
            </p>
            <List
              items={[
                "法令に基づく場合",
                "人の生命、身体または財産の保護のために必要がある場合",
                "公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合",
                "国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合",
              ]}
            />
          </Article>

          <Article title="第4条（業務委託先への提供）">
            <p>
              当社は、利用目的の達成に必要な範囲内において、個人情報の取扱いを外部の業務委託先に委託することがあります。この場合、当社は委託先との間で個人情報の適正な取扱いを確保するために必要な契約を締結し、監督を行います。主な業務委託先および外部サービスは以下のとおりです。
            </p>
            <List
              items={[
                "Stripe, Inc.（決済処理）",
                "Supabase, Inc.（サーバー・データベース・ファイルストレージ）",
                "Vercel Inc.（Webアプリケーションのホスティング）",
                "Resend, Inc.（メール配信）",
                "MapTiler AG（地図情報の表示）",
              ]}
            />
            <p className="text-[12px] text-ink-500">
              ※ 上記のうち一部は日本国外にサーバーを設置しています。会員は本サービスの利用にあたり、個人情報が日本国外へ移転される可能性があることに同意するものとします。
            </p>
          </Article>

          <Article title="第5条（Cookie の使用）">
            <p>
              本サービスは、利便性向上、認証状態の維持、アクセス解析等の目的で Cookie を使用します。会員はブラウザの設定により Cookie の受入れを拒否することができますが、その場合、本サービスの一部機能が利用できなくなることがあります。
            </p>
          </Article>

          <Article title="第6条（安全管理措置）">
            <p>
              当社は、個人情報の漏えい、滅失または毀損の防止その他の安全管理のため、以下の措置を講じます。
            </p>
            <List
              items={[
                "組織的安全管理措置：個人情報取扱責任者の設置、取扱規程の整備、従業者の監督",
                "人的安全管理措置：従業者に対する教育および秘密保持義務の徹底",
                "物理的安全管理措置：個人情報を取り扱う区域の管理、機器および電子媒体の盗難等の防止",
                "技術的安全管理措置：アクセス制御、通信の暗号化（TLS）、保存データの暗号化、脆弱性対策",
                "外的環境の把握：業務委託先が国外にある場合、当該国の個人情報保護制度を把握したうえで安全管理を講じます。",
              ]}
            />
          </Article>

          <Article title="第7条（保有個人データの開示、訂正、利用停止等）">
            <p>
              会員は、当社に対し、自己の保有個人データについて、開示、訂正、追加、削除、利用停止、消去または第三者提供の停止（以下「開示等」といいます。）を請求することができます。
            </p>
            <p>
              開示等のご請求は、本ポリシー末尾に記載のお問い合わせ窓口までご連絡ください。当社は、ご請求内容および本人確認の結果を踏まえ、法令に従い遅滞なく対応いたします。
            </p>
          </Article>

          <Article title="第8条（退会および個人情報の削除）">
            <p>
              会員は、いつでもマイページから退会することができます。退会後、当社は当該会員の個人情報を、法令に基づく保存義務のある情報を除き、合理的な期間内に削除または匿名化します。
            </p>
            <p>
              退会後も、当該会員が本サービス上に投稿したコンテンツは、他の会員のコミュニケーションの継続性を確保する観点から、投稿者を匿名表示に置き換えた上で残存する場合があります。
            </p>
          </Article>

          <Article title="第9条（本ポリシーの変更）">
            <p>
              当社は、法令の変更、本サービスの内容変更その他の事情により、本ポリシーを変更することがあります。変更後の本ポリシーは、本サービス上に掲示された時点から効力を生じます。
            </p>
          </Article>

          <Article title="第10条（お問い合わせ窓口）">
            <p>本ポリシーおよび個人情報の取扱いに関するお問い合わせは、以下の窓口までお願いいたします。</p>
            <div className="border border-line bg-paper-50 p-5 space-y-1 text-[13px]">
              <p>株式会社○○○ 個人情報お問い合わせ窓口</p>
              <p>所在地：東京都○○区○○</p>
              <p>電話：03-○○○○-○○○○</p>
              <p>メール：jomon@jomonkusama.com</p>
            </div>
          </Article>

          <p className="pt-8 text-[12px] text-ink-500 text-right">以上</p>
        </div>
      </section>
    </>
  );
}

function Article({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-serif text-[17px] tracking-[0.04em] text-ink-900 border-b border-line pb-2">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 pl-5 list-decimal marker:text-coral-700 marker:font-display marker:italic">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ol>
  );
}
