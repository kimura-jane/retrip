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

type SearchParams = Promise<{ tag?: string | string[] }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawTag = Array.isArray(sp.tag) ? sp.tag[0] : sp.tag;
  const selectedTag = rawTag?.trim() || null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select(
      "id, title, destination, departure_date, price, cover_image_url, theme_tags"
    )
    .eq("status", "recruiting")
    .order("departure_date", { ascending: true });

  const allTours: Tour[] = (data ?? []) as Tour[];

  // タグ集計（「サンプル」は集計から除外、出現頻度順、同数なら名前順）
  const tagCountMap = new Map<string, number>();
  for (const t of allTours) {
    for (const tag of t.theme_tags ?? []) {
      if (tag === "サンプル") continue;
      tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1);
    }
  }
  const tagList: { tag: string; count: number }[] = Array.from(
    tagCountMap.entries()
  )
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag, "ja");
    });

  // 選択中タグでフィルタ
  const tours: Tour[] = selectedTag
    ? allTours.filter((t) => (t.theme_tags ?? []).includes(selectedTag))
    : allTours;

  // ヒーロー画像は cover を持つ最初のツアーから拝借
  const heroImage =
    allTours.find((t) => t.cover_image_url)?.cover_image_url ?? null;

  return (
    <>
      {/* =========================================
          Hero — 全幅ビジュアル + 英字コピー + 日本語
          ========================================= */}
      <section className="relative w-full overflow-hidden bg-paper-200">
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/8]">
          {heroImage && (
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              className="object-cover"
              style={{
                animation: "retripHeroZoom 12000ms ease-out forwards",
              }}
            />
          )}
          {/* 可読性のための暗幕 */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/20 via-ink-900/10 to-ink-900/50" />

          {/* コピー */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            style={{
              animation: "retripFadeIn 1600ms ease-out both",
            }}
          >
            <p className="font-display italic text-paper-100/90 text-[18px] sm:text-[22px] md:text-[28px] tracking-[0.02em] leading-[1.35] max-w-3xl">
              Somewhere new.
              <br className="sm:hidden" /> Someone new.
              <br className="sm:hidden" /> Someone you.
            </p>
            <div className="mt-8 h-px w-10 bg-paper-100/60" />
            <p className="mt-8 text-paper-100/95 text-[13px] sm:text-[14px] md:text-[15px] font-light tracking-[0.18em] leading-[2.2]">
              知らない場所で、
              <br className="sm:hidden" />
              知らない誰かと、
              <br className="sm:hidden" />
              知らない自分に。
            </p>
          </div>
        </div>

        {/* インラインで簡易 keyframes を注入（globals.css を触らないため） */}
        <style>{`
          @keyframes retripFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes retripHeroZoom {
            from { transform: scale(1.06); }
            to   { transform: scale(1.0); }
          }
        `}</style>
      </section>

      {/* =========================================
          Intro — 短いエディトリアル導入
          ========================================= */}
      <section className="border-b border-line bg-paper-100">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 py-20 md:py-28 text-center">
          <p className="font-display italic text-coral-700 text-[13px] sm:text-[14px] tracking-[0.12em] leading-loose">
            A small group. A real story. Yours.
          </p>
          <p className="mt-6 font-serif text-ink-900 text-lg md:text-xl tracking-[0.06em] leading-[2.1]">
            少人数だから、物語は深くなる。
          </p>
          <p className="mt-10 text-[13px] md:text-[14px] font-light tracking-[0.08em] leading-loose2 text-ink-500">
            週末のバス旅で、ちいさな共同生活を。
            <br />
            事前のチャットで顔合わせ、旅の後もつながる。
          </p>
        </div>
      </section>

      {/* =========================================
          Section Head — Upcoming Journeys
          ========================================= */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 md:py-20 text-center">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Upcoming Journeys
          </p>
          <h1 className="mt-5 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            現在の募集ツアー
          </h1>
          <div className="mt-8 mx-auto h-px w-10 bg-line" />
        </div>
      </section>

      {/* =========================================
          Tag Filter
          ========================================= */}
      {tagList.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10">
            <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700 text-center">
              Filter by Theme
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <TagChip href="/" label="すべて" active={selectedTag === null} />
              {tagList.map(({ tag, count }) => (
                <TagChip
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  label={`#${tag}`}
                  count={count}
                  active={selectedTag === tag}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================
          Tours Grid
          ========================================= */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {selectedTag && (
            <div className="mb-12 text-center">
              <p className="font-display italic text-[11px] tracking-widest2 uppercase text-ink-500">
                Tagged
              </p>
              <h2 className="mt-2 font-serif text-2xl tracking-[0.04em] text-ink-900">
                #{selectedTag}
              </h2>
              <p className="mt-3 text-[12px] font-light text-ink-500">
                {tours.length} 件のツアー
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-[11px] tracking-[0.15em] uppercase text-coral-700 hover:underline"
              >
                ← すべて表示
              </Link>
            </div>
          )}

          {tours.length === 0 ? (
            <p className="text-center text-[13px] font-light text-ink-500 leading-loose2">
              {selectedTag
                ? `「${selectedTag}」に該当するツアーは現在ありません。`
                : "現在、募集中のツアーはありません。"}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
              {tours.map((t) => {
                const isSample = (t.theme_tags ?? []).includes("サンプル");
                const tags = (t.theme_tags ?? [])
                  .filter((x) => x !== "サンプル")
                  .slice(0, 3);
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
                        <span className="absolute top-4 left-4 bg-coral-500 text-paper-100 text-[11px] tracking-widest2 uppercase px-3 py-1.5 font-display italic">
                          sample
                        </span>
                      )}
                    </div>
                    <div className="mt-6">
                      <div className="font-display italic text-[11px] tracking-widest2 uppercase text-ink-500">
                        {t.destination ?? ""}
                        {dateLabel && ` · ${dateLabel}`}
                      </div>
                      <h3 className="mt-3 font-serif text-xl tracking-[0.04em] text-ink-900 leading-snug">
                        {t.title}
                      </h3>
                      {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tracking-[0.15em] text-ink-500 font-light">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className={
                                tag === selectedTag ? "text-coral-700" : ""
                              }
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 flex items-baseline gap-2">
                        <span className="font-display text-xl text-ink-900">
                          ¥{(t.price ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] tracking-[0.15em] text-ink-500 font-light">
                          / ひとり
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          Editorial Banner — "You're not watching anymore."
          ========================================= */}
      <section className="relative w-full overflow-hidden bg-ink-900 text-paper-100">
        {heroImage && (
          <>
            <Image
              src={heroImage}
              alt=""
              fill
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-ink-900/50" />
          </>
        )}
        <div className="relative mx-auto max-w-4xl px-6 lg:px-10 py-24 md:py-32 text-center">
          <p className="font-display italic text-paper-100 text-[22px] sm:text-[28px] md:text-[34px] tracking-[0.02em] leading-[1.4]">
            You&rsquo;re not watching anymore.
          </p>
          <div className="mt-8 mx-auto h-px w-10 bg-paper-100/50" />
          <p className="mt-8 text-paper-100/90 text-[13px] sm:text-[14px] md:text-[15px] font-light tracking-[0.2em] leading-[2.2]">
            もう、観ている側じゃない。
            <br />
            今度は、あなたが主役。
          </p>
        </div>
      </section>
    </>
  );
}

// ============================================
// タグチップ
// ============================================

function TagChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[12px] tracking-[0.08em] transition ${
        active
          ? "bg-coral-500 text-paper-100 border-coral-500"
          : "bg-paper-50 text-ink-900 border-line hover:border-coral-500 hover:text-coral-700"
      }`}
    >
      <span className="font-light">{label}</span>
      {typeof count === "number" && (
        <span
          className={`text-[10px] ${
            active ? "text-paper-100/70" : "text-ink-500"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
