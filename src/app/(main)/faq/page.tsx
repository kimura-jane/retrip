import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Re:Trip",
  description:
    "Re:Trip のよくある質問。参加条件、集合場所、本人確認、キャンセルポリシー、支払い方法などをまとめました。",
};

type QA = {
  q: string;
  a: string; // 改行は \n で
};

type Section = {
  eyebrow: string;
  title: string;
  items: QA[];
};

const SECTIONS: Section[] = [
  {
    eyebrow: "About Re:Trip",
    title: "サービスについて",
    items: [
      {
        q: "Re:Trip はどんなサービスですか？",
        a: "週末のバス旅で、少人数の「ちいさな共同生活」を過ごすツアーサービスです。日帰りから1泊2日まで、ゆるやかに繋がれる旅の場をつくっています。",
      },
      {
        q: "どんな人が参加していますか？",
        a: "20代後半〜40代を中心に、ひとりで参加される方が多いです。旅先での出会いや、静かな時間、写真、食、自然などを大切にしたい方が集まっています。",
      },
      {
        q: "ひとりでも参加できますか？",
        a: "はい、むしろ多くの方がおひとりでのご参加です。少人数のため、はじめての方も自然と会話が生まれます。",
      },
    ],
  },
  {
    eyebrow: "Booking",
    title: "予約について",
    items: [
      {
        q: "予約にはアカウント登録が必要ですか？",
        a: "はい、アカウント登録とプロフィール入力、そして本人確認書類のアップロードが必要です。安全な旅の場をつくるための仕組みです。",
      },
      {
        q: "本人確認って何をしますか？",
        a: "運転免許証やパスポート、マイナンバーカード等の写真をアップロードいただきます。運営が確認し、承認されるとご予約が可能になります。書類は暗号化して保管し、確認以外の目的には使いません。",
      },
      {
        q: "定員はどのくらいですか？",
        a: "ツアーごとに異なりますが、基本は6〜10名程度です。男女比のバランスも見ながら募集しています。",
      },
    ],
  },
  {
    eyebrow: "Meeting & Transportation",
    title: "集合・交通について",
    items: [
      {
        q: "集合場所はどこですか？",
        a: "メインは新宿西口です。ツアーによっては途中のサービスエリアでの乗車や、現地合流も可能です。詳しくは各ツアーページの「集合場所」をご確認ください。",
      },
      {
        q: "現地集合・現地解散はできますか？",
        a: "はい、多くのツアーで対応しています。ツアー詳細ページで各集合場所の下に「現地合流OK」と表示されているものが対象です。",
      },
    ],
  },
  {
    eyebrow: "Payment & Cancellation",
    title: "支払い・キャンセル",
    items: [
      {
        q: "支払い方法は何がありますか？",
        a: "クレジットカード（Stripe決済）に対応しています。予約確定と同時にお支払いいただきます。",
      },
      {
        q: "キャンセルはできますか？",
        a: "マイページからキャンセルのご依頼をいただけます。返金額はツアー出発日までの日数に応じて変わります。詳細は利用規約およびキャンセルポリシーをご確認ください。",
      },
    ],
  },
  {
    eyebrow: "Chat",
    title: "旅のチャットについて",
    items: [
      {
        q: "予約後のチャットはどう使いますか？",
        a: "予約したツアーごとに、参加者だけのグループチャットが自動で作られます。集合前の顔合わせ、当日の連絡、旅のあとのアルバム共有などにご活用ください。",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      {/* ヘッダー */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-16 md:py-20 text-center">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Frequently Asked
          </p>
          <h1 className="mt-5 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            よくあるご質問
          </h1>
          <p className="mt-6 text-[13px] font-light tracking-[0.08em] leading-loose2 text-ink-500">
            はじめての方も、リピーターの方も。
            <br className="hidden sm:block" />
            旅の前によく聞かれることをまとめました。
          </p>
        </div>
      </section>

      {/* 本体 */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 space-y-20">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="border-b border-line pb-4 mb-8">
                <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
                  {section.eyebrow}
                </p>
                <h2 className="mt-2 font-serif text-2xl tracking-[0.04em] text-ink-900">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-6">
                {section.items.map((item, idx) => (
                  <details
                    key={idx}
                    className="group border-b border-line pb-6"
                  >
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="font-display italic text-coral-700 text-[13px] tracking-widest2 mt-0.5 flex-shrink-0">
                          Q
                        </span>
                        <span className="font-serif text-[16px] text-ink-900 tracking-[0.04em] leading-relaxed">
                          {item.q}
                        </span>
                      </div>
                      <span className="text-ink-500 font-display italic text-[18px] leading-none mt-0.5 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="mt-4 pl-7 flex items-start gap-3">
                      <span className="font-display italic text-ink-500 text-[13px] tracking-widest2 mt-0.5 flex-shrink-0">
                        A
                      </span>
                      <p className="text-[14px] font-light leading-loose2 tracking-[0.04em] text-ink-600 whitespace-pre-line">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* お問い合わせ導線 */}
          <div className="border-t border-line pt-12 text-center">
            <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
              Still have questions?
            </p>
            <h2 className="mt-2 font-serif text-xl tracking-[0.04em] text-ink-900">
              解決しなかった場合
            </h2>
            <p className="mt-4 text-[13px] font-light leading-loose2 text-ink-500">
              上記に該当する回答がない場合は、お気軽にお問い合わせください。
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block px-6 py-3 border border-ink-900 text-ink-900 text-[12px] tracking-[0.15em] uppercase hover:bg-ink-900 hover:text-paper-100 transition-colors"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
