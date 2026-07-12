import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteTourIds } from "@/features/favorites/queries";
import { FavoriteButton } from "@/app/(main)/_components/favorite-button";

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

// ==========================================
// ヒーロー用 editorial 画像プール（Unsplash License / 商用可）
// ページアクセスごとにランダムで 1 枚選ぶ
// ==========================================
const HERO_POOL: {
  src: string;
  alt: string;

}[] = [
  {
    src: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1920&q=80&auto=format&fit=crop",
    alt: "朝霧の湖と山",

  },
  {
    src: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=80&auto=format&fit=crop",
    alt: "京都の路地と提灯",

  },
  {
    src: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1920&q=80&auto=format&fit=crop",
    alt: "バスの窓辺と旅の景色",

  },
  {
    src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1920&q=80&auto=format&fit=crop",
    alt: "富士山と湖のリフレクション",

  },
  {
    src: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1920&q=80&auto=format&fit=crop",
    alt: "温泉宿の縁側と光",

  },
  {
    src: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1920&q=80&auto=format&fit=crop",
    alt: "秋の山道",

  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawTag = Array.isArray(sp.tag) ? sp.tag[0] : sp.tag;
  const selectedTag = rawTag?.trim() || null;
  const favoriteIds = await getFavoriteTourIds();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select(
      "id, title, destination, departure_date, price, cover_image_url, theme_tags"
    )
    .eq("status", "recruiting")
    .order("departure_date", { ascending: true });

  const allTours: Tour[] = (data ?? []) as Tour[];

  // タグ集計（「サンプル」は除外）
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

  const tours: Tour[] = selectedTag === "__favorites__"
    ? allTours.filter((t) => favoriteIds.has(t.id))
    : selectedTag
    ? allTours.filter((t) => (t.theme_tags ?? []).includes(selectedTag))
    : allTours;

  // ヒーロー：ページアクセスごとにランダム
  const hero =
    HERO_POOL[Math.floor(Math.random() * HERO_POOL.length)] ?? HERO_POOL[0]!;

  return (
    <>
      {/* =========================================
          Hero — フルビューポート + 日本語主役
          ========================================= */}
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink-900 text-paper-100">
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ animation: "retripHeroZoom 18s ease-out forwards" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/45 via-ink-900/20 to-ink-900/65" />

        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center px-6 py-8 md:py-10">
          <span className="font-display text-2xl font-light italic tracking-[0.18em] text-paper-100">
            Re:Trip
          </span>
        </div>

        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
          style={{ animation: "retripFadeIn 1.8s ease-out both" }}
        >
          <h1 className="font-serif text-[clamp(2rem,6vw,4.5rem)] font-light leading-[1.8] tracking-[0.18em] text-paper-100">
            <span className="block">知らない場所で、</span>
            <span className="block">知らない誰かと、</span>
            <span className="block">知らない自分に。</span>
          </h1>
        </div>

        <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
          <span className="caption-en mb-4 text-[10px] text-paper-100/75">
            Scroll
          </span>
          <span className="h-16 w-px bg-paper-100/70 [animation:retripScrollHint_2.4s_ease-in-out_infinite]" />
        </div>

        <style>{`
          @keyframes retripFadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes retripHeroZoom {
            from { transform: scale(1.08); }
            to   { transform: scale(1.0); }
          }
          @keyframes retripScrollHint {
            0%   { transform: scaleY(0); transform-origin: top; opacity: 0.2; }
            50%  { transform: scaleY(1); transform-origin: top; opacity: 0.8; }
            51%  { transform: scaleY(1); transform-origin: bottom; }
            100% { transform: scaleY(0); transform-origin: bottom; opacity: 0.2; }
          }
        `}</style>
      </section>

      {/* =========================================
          Intro
          ========================================= */}
      <section className="border-b border-line bg-paper-100">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24 lg:px-10">
          <h2 className="heading-editorial text-ink-900">
            少人数だから、
            <br />
            物語は深くなる。
          </h2>
          <p className="mt-6 text-[13px] font-light leading-[2.4] tracking-[0.1em] text-ink-500 md:text-sm">
            週末のバス旅で、ちいさな共同生活を。
            <br />
            事前のチャットで顔合わせ、旅の後もつながる。
          </p>
        </div>
      </section>


      {/* =========================================
          Tag Filter
          ========================================= */}
      {tagList.length > 0 && (
        <section className="border-b border-line bg-paper-50">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
            <p className="text-center font-serif text-sm tracking-[0.18em] text-coral-700">
              テーマで絞る
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <TagChip href="/" label="すべて" active={selectedTag === null} />
              <TagChip
                href="/?tag=__favorites__"
                label="♡ お気に入り"
                count={favoriteIds.size || undefined}
                active={selectedTag === "__favorites__"}
              />
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
      <section className="bg-paper-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {selectedTag && (
            <div className="mb-8 text-center">
              <h2 className="font-serif text-2xl text-ink-900">
                {selectedTag === "__favorites__"
                  ? "気になるリスト"
                  : `#${selectedTag}`}
              </h2>
              <p className="mt-3 text-xs font-light text-ink-500">
                {tours.length} 件のツアー
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-[11px] uppercase tracking-[0.15em] text-coral-700 hover:underline"
              >
                ← すべてのツアーを見る
              </Link>
            </div>
          )}

          {tours.length === 0 ? (
            <p className="text-center text-[13px] font-light leading-loose text-ink-500">
              {selectedTag
                ? selectedTag === "__favorites__"
                  ? "気になるツアーはまだありません。"
                  : `「${selectedTag}」に該当するツアーは現在ありません。`
                : "現在、募集中のツアーはありません。"}
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((t, idx) => {
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
                const num = String(idx + 1).padStart(3, "0");
                return (
                  <div key={t.id} className="group relative block">
                    <FavoriteButton
                      tourId={t.id}
                      isFavorite={favoriteIds.has(t.id)}
                      nextPath={
                        selectedTag
                          ? `/?tag=${encodeURIComponent(selectedTag)}`
                          : "/"
                      }
                      variant="card"
                    />
                    <Link href={`/tours/${t.id}`} className="block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-paper-200">
                        {t.cover_image_url && (
                          <Image
                            src={t.cover_image_url}
                            alt={t.title}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                          />
                        )}
                        {isSample && (
                          <span className="caption-en absolute left-4 top-4 bg-coral-500 px-3 py-1.5 text-paper-100">
                            sample
                          </span>
                        )}
                        <span className="caption-en absolute bottom-4 right-4 bg-paper-100/90 px-3 py-1.5 text-ink-900 backdrop-blur-sm">
                          № {num}
                        </span>
                      </div>
                      <div className="mt-6">
                        <p className="caption-en text-ink-500">
                          {t.destination ?? ""}
                          {dateLabel && ` ／ ${dateLabel}`}
                        </p>
                        <h3 className="mt-3 font-serif text-xl leading-snug text-ink-900">
                          {t.title}
                        </h3>
                        {tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-light tracking-[0.15em] text-ink-500">
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
                          <span className="font-display text-3xl font-light text-ink-900">
                            ¥{(t.price ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          Editorial Banner — 日本語主役
          ========================================= */}
      <section className="relative min-h-[70svh] w-full overflow-hidden bg-ink-900 text-paper-100">
        <Image
          src={hero.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-ink-900/55" />
        <div className="relative flex min-h-[70svh] flex-col items-center justify-center px-6 py-16 text-center lg:px-10">
          <span className="rule-thin mx-auto w-10 text-paper-100" />
          <p className="mt-6 font-serif text-[clamp(1.8rem,5vw,3.75rem)] font-light leading-[1.8] tracking-[0.14em] text-paper-100">
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
          ? "border-coral-500 bg-coral-500 text-paper-100"
          : "border-line bg-paper-50 text-ink-900 hover:border-coral-500 hover:text-coral-700"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span className={active ? "text-paper-100/70" : "text-ink-500"}>
          {count}
        </span>
      )}
    </Link>
  );
}
