import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Re:Trip",
  description:
    "特定商取引法に基づく事業者情報の表記。事業者名、所在地、代金の支払時期、返品・キャンセル、動作環境等を記載しています。",
};

type Row = {
  label: string;
  value: React.ReactNode;
};

const ROWS: Row[] = [
  { label: "販売事業者", value: "株式会社○○○" },
  { label: "代表責任者", value: "○○ ○○" },
  {
    label: "所在地",
    value: (
      <>
        〒○○○-○○○○
        <br />
        東京都○○区○○ ○-○-○
      </>
    ),
  },
  { label: "電話番号", value: "03-○○○○-○○○○" },
  {
    label: "電話受付時間",
    value: "平日 10:00 – 18:00（土日祝を除く）",
  },
  { label: "メールアドレス", value: "jomon@jomonkusama.com" },
  {
    label: "旅行業登録番号",
    value: "○○知事登録旅行業 第○○-○○○○号（取得予定）",
  },
  {
    label: "旅行業務取扱管理者",
    value: "○○ ○○（取得予定）",
  },
  {
    label: "販売URL",
    value: "https://retrip-coral.vercel.app/",
  },
  { label: "販売価格", value: "各ツアーページに表示（消費税込み）" },
  {
    label: "商品代金以外の必要料金",
    value: (
      <>
        インターネット接続料金、通信料金は会員のご負担となります。
        <br />
        現地での飲食代、任意参加のオプション費用等は、原則としてツアー代金に含まれません（各ツアーページに個別に明記）。
      </>
    ),
  },
  {
    label: "支払方法",
    value: "クレジットカード決済（Visa、Mastercard、JCB、American Express、Diners Club）",
  },
  { label: "支払時期", value: "ご予約時に一括でお支払いいただきます。" },
  {
    label: "サービス提供時期",
    value: "各ツアーページに記載の出発日にサービスを提供します。",
  },
  {
    label: "返品・交換・キャンセル",
    value: (
      <>
        通信販売の性質上、特定商取引法上のクーリング・オフ制度は適用されません。
        <br />
        ご予約のキャンセルは、マイページよりお申し込みいただけます。ツアー出発日を基準とした取消料規定は以下のとおりです。
        <br />
        <br />
        ・出発日の21日前まで：無料
        <br />
        ・出発日の20日前から8日前まで：旅行代金の20%
        <br />
        ・出発日の7日前から2日前まで：旅行代金の50%
        <br />
        ・出発日の前日：旅行代金の80%
        <br />
        ・出発日当日および無連絡不参加：旅行代金の100%
        <br />
        <br />
        本規定は暫定のものであり、旅行業登録取得後、旅行業法および標準旅行業約款に準拠した正式な取消料規定に変更いたします。
      </>
    ),
  },
  {
    label: "不良品の取扱い",
    value:
      "ツアーの実施内容に瑕疵があった場合は、お問い合わせ窓口までご連絡ください。事実関係を確認の上、旅行業法および標準旅行業約款に準じて対応いたします。",
  },
  {
    label: "動作環境",
    value: (
      <>
        推奨ブラウザ：最新版の Google Chrome、Safari、Firefox、Microsoft Edge
        <br />
        JavaScript および Cookie を有効にしてご利用ください。
      </>
    ),
  },
];

export default function TokushohoPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 md:py-20 text-center">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Commercial Transactions Act
          </p>
          <h1 className="mt-5 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            特定商取引法に基づく表記
          </h1>
          <p className="mt-6 text-[13px] font-light tracking-[0.08em] leading-loose2 text-ink-500">
            特定商取引に関する法律 第11条に基づく表示
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <dl className="border-t border-line">
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 border-b border-line py-5"
              >
                <dt className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700 sm:pt-1">
                  {row.label}
                </dt>
                <dd className="text-[14px] font-light leading-loose2 tracking-[0.04em] text-ink-700">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-[12px] text-ink-500 font-light leading-loose2">
            本表記は特定商取引に関する法律に基づき記載しております。ご不明な点は、上記お問い合わせ窓口までご連絡ください。
          </p>
        </div>
      </section>
    </>
  );
}
