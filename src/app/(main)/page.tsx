import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Tour = {
  id: string;
  title: string;
  destination: string | null;
  departure_date: string | null;
  price: number | null;
  cover_image_url: string | null;
  theme_tags: string[] | null;
};

// ヒーロー・編集写真は Unsplash 仮埋め。後で自前画像に差し替え可。
const HERO_IMG =
  "https://images.unsplash.com/photo-1502301103665-0b95cc738daf?auto=format&fit=crop&w=1400&q=80";
const CONCEPT_IMGS = [
  "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496318447583-f524534e9ce1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1473662712933-baadb22ee0fa?auto=format&fit=crop&w=900&q=80",
];
const VOICE_IMGS = [
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1485518882345-15568b007407?auto=format&fit=crop&w=900&q=80",
];
const CLOSING_IMG =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select("id, title, destination, departure_date, price, cover_image_url, theme_tags")
    .eq("status", "recruiting")
    .order("departure_date", { ascending: true })
    .limit(6);

  const tours: Tour[] = (data ?? []) as Tour[];

  return (
    <>
      {/* 1. HERO */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-2 gap-10 lg:gap-20 pt-10 lg:pt-20 pb-24">
          <div className="relative aspect-[3/4] lg:aspect-[4/5] overflow-hidden">
            <Image
              src={HERO_IMG}
              alt=""
              fill
              priority
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700 mb-8">
              A Journey to Meet Yourself.
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.5] tracking-[0.04em] text-ink-900">
              その人を知ることは、<br />
              じぶんを知ること。
            </h1>
            <p className="mt-10 text-[13px] md:text-[14px] leading-loose2 tracking-[0.08em] text-ink-600 font-light">
              週末のバス旅で、ちいさな共同生活を。<br />
              出会うのは、誰か。そして、まだ知らない自分。
            </p>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href="#journeys"
                className="px-8 py-4 bg-ink-900 text-paper-100 text-[12px] tracking-widest2 uppercase hover:bg-coral-700 transition-colors"
              >
                旅の一覧を見る
              </Link>
              <Link
                href="#concept"
                className="px-8 py-4 border border-ink-900 text-ink-900 text-[12px] tracking-widest2 uppercase hover:bg-ink-900 hover:text-paper-100 transition-colors"
              >
                コンセプトを読む
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex justify-center pb-10">
          <span className="font-display italic text-[11px] tracking-widest2 text-ink-500">scroll</span>
        </div>
      </section>

      {/* 2. CONCEPT */}
      <section id="concept" className="bg-paper-50 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700 text-center">
            Why Travel, Together.
          </p>
          <h2 className="mt-6 text-center font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            なぜ、旅なのか。
          </h2>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {CONCEPT_IMGS.map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden ${
                  i % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/5] mt-10"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-20 max-w-2xl mx-auto text-ink-600 font-light leading-loose2 tracking-[0.08em] text-[14px]">
            <p>プロフィール写真では、わからないことばかり。</p>
            <p className="mt-6">
              朝、どんな顔で起きるのか。<br />
              待ち時間に何を話すのか。<br />
              予定が崩れたとき、どう笑うのか。
            </p>
            <p className="mt-6">
              生活を少しだけ共にすると、<br />
              ちゃんと「人」が見えてくる。
            </p>
            <p className="mt-6">
              そして気づくのです。<br />
              わたしはこんなところに惹かれるんだ。<br />
              こういうことは、意外と平気なんだ。
            </p>
            <p className="mt-10 font-serif text-ink-900">
              ── 誰かを知る旅は、自分を知る旅でもある。
            </p>
          </div>

          <div className="mt-24 grid md:grid-cols-3 gap-12">
            {[
              { n: "01", t: "体験でしかわからないこと", b: "写真や言葉のかわりに、同じ空気を吸う時間を。" },
              { n: "02", t: "一度きりじゃない関係", b: "旅のあとも続く、ちいさなコミュニティ。" },
              { n: "03", t: "自分の輪郭を、見つける", b: "他人を知ることは、自分を知ること。" },
            ].map((item) => (
              <div key={item.n} className="border-t border-line pt-8">
                <div className="font-display text-[13px] tracking-widest2 text-coral-700">{item.n}</div>
                <h3 className="mt-4 font-serif text-xl text-ink-900 tracking-[0.04em]">{item.t}</h3>
                <p className="mt-4 text-[13px] font-light leading-loose2 text-ink-500">{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. VOICES */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700 text-center">
            Voices
          </p>
          <h2 className="mt-6 text-center font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            こんな人と、出かけてみませんか。
          </h2>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              { q: "アプリ疲れしたけど、人とは出会いたい。", p: "32歳・編集者" },
              { q: "結婚相手を探す前に、ちゃんと友達みたいに話せる人がいい。", p: "35歳・看護師" },
              { q: "映画も外食もひとりで平気。でも、誰かと景色を共有したい夜がある。", p: "29歳・デザイナー" },
            ].map((v) => (
              <figure key={v.p} className="bg-paper-50 p-10 border-t border-coral-500">
                <blockquote className="font-serif text-lg md:text-xl leading-[2.0] tracking-[0.04em] text-ink-900">
                  「{v.q}」
                </blockquote>
                <figcaption className="mt-8 font-display italic text-[12px] tracking-widest2 text-ink-500">
                  — {v.p}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 4. JOURNEYS */}
      <section id="journeys" className="bg-paper-50 py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col items-center text-center">
            <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
              Upcoming Journeys
            </p>
            <h2 className="mt-6 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
              次の週末、どこへ行きますか。
            </h2>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {tours.map((t) => {
              const isSample = (t.theme_tags ?? []).includes("サンプル");
              const tags = (t.theme_tags ?? []).filter((x) => x !== "サンプル").slice(0, 3);
              const dateLabel = t.departure_date
                ? new Date(t.departure_date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "";
              return (
                <Link key={t.id} href={`/tours/${t.id}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-paper-200">
                    {t.cover_image_url && (
                      <Image
                        src={t.cover_image_url}
                        alt={t.title}
                        fill
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                      />
                    )}
                    {isSample && (
                      <span className="absolute top-4 left-4 bg-paper-100/90 text-ink-500 text-[10px] tracking-widest2 uppercase px-3 py-1 font-display italic">
                        sample
                      </span>
                    )}
                  </div>
                  <div className="mt-6">
                    <div className="font-display italic text-[11px] tracking-widest2 uppercase text-ink-500">
                      {t.destination ?? ""} {dateLabel && `· ${dateLabel}`}
                    </div>
                    <h3 className="mt-3 font-serif text-xl tracking-[0.04em] text-ink-900 leading-snug">
                      {t.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tracking-[0.15em] text-ink-500 font-light">
                      {tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                    <div className="mt-5 font-display text-xl text-ink-900">
                      ¥{(t.price ?? 0).toLocaleString()}
                      <span className="ml-1 text-[10px] tracking-widest2 text-ink-500 uppercase">/ seat</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. TIMELINE */}
      <section className="py-28">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700 text-center">
            How it works
          </p>
          <h2 className="mt-6 text-center font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            旅の、流れ。
          </h2>
          <ol className="mt-16 space-y-12">
            {[
              { n: "01", t: "申し込み", b: "気になる旅を見つけて、ひと席分の予約を。" },
              { n: "02", t: "チャットがひらく", b: "出発の2週間前、参加者だけのチャットルームへ。" },
              { n: "03", t: "当日、出発", b: "バスに乗り込んだ瞬間から、旅ははじまっています。" },
              { n: "04", t: "旅のあと", b: "アルバムを共有して、また会う約束を、ゆるやかに。" },
            ].map((s) => (
              <li key={s.n} className="grid grid-cols-[80px_1fr] gap-6 border-t border-line pt-8">
                <div className="font-display italic text-2xl text-coral-700">{s.n}</div>
                <div>
                  <h3 className="font-serif text-xl tracking-[0.04em] text-ink-900">{s.t}</h3>
                  <p className="mt-3 text-[13px] font-light leading-loose2 text-ink-500">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. SMALL VOICE / EDITORIAL */}
      <section className="bg-paper-50 py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-4">
            {VOICE_IMGS.map((src) => (
              <div key={src} className="relative aspect-[3/4] overflow-hidden">
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
          <div>
            <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
              A Letter
            </p>
            <p className="mt-6 font-serif text-xl md:text-2xl leading-[2.0] tracking-[0.04em] text-ink-900">
              「同じバスに乗っていた、それだけのことが、<br />
              ずっとあとまで残るのが、不思議です。」
            </p>
            <p className="mt-8 font-display italic text-[12px] tracking-widest2 text-ink-500">
              — 過去の参加者から
            </p>
          </div>
        </div>
      </section>

      {/* 7. CLOSING */}
      <section className="relative h-[80vh] min-h-[560px] overflow-hidden">
        <Image src={CLOSING_IMG} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-ink-900/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-paper-100/80">
            Re:Trip
          </p>
          <h2 className="mt-8 font-serif text-3xl md:text-5xl leading-[1.6] tracking-[0.04em] text-paper-100">
            まだ知らない景色と、<br />
            まだ知らない自分に、会いに行く。
          </h2>
          <Link
            href="#journeys"
            className="mt-12 px-10 py-4 bg-paper-100 text-ink-900 text-[12px] tracking-widest2 uppercase hover:bg-coral-500 hover:text-paper-100 transition-colors"
          >
            次の旅をさがす
          </Link>
        </div>
      </section>
    </>
  );
}
