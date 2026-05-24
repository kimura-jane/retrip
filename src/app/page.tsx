import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";

type TourRow = {
  id: string;
  title: string;
  description: string;
  tour_type: "day_trip" | "overnight";
  destination: string;
  departure_date: string;
  return_date: string;
  price: number;
  capacity_total: number;
  theme_tags: string[];
  cover_image_url: string | null;
};

function formatDateRange(dep: string, ret: string, type: "day_trip" | "overnight"): string {
  const d = new Date(dep);
  const r = new Date(ret);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  if (type === "day_trip") {
    return `${m}.${day} ${weekday}`;
  }
  return `${m}.${day} ${weekday} → ${r.getMonth() + 1}.${r.getDate()}`;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select(
      "id,title,description,tour_type,destination,departure_date,return_date,price,capacity_total,theme_tags,cover_image_url"
    )
    .eq("status", "recruiting")
    .order("departure_date", { ascending: true });

  const tours = (data ?? []) as TourRow[];

  return (
    <div className="min-h-screen bg-[#FAFBF7] flex flex-col">
      <Header />

      {/* ===== ヒーロー ===== */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28">
          <p className="text-[11px] tracking-[0.4em] text-neutral-500 uppercase mb-6">
            small trips, quiet hearts
          </p>
          <h1 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.4] text-neutral-800 tracking-wide">
            すこし遠くへ、<br />
            <span className="text-brand-700">しずかな</span>週末を。
          </h1>
          <p className="mt-8 text-sm md:text-base text-neutral-600 leading-relaxed max-w-md">
            関東発、少人数のバス旅。<br />
            出発前から、もう旅がはじまっています。
          </p>
        </div>
      </section>

      {/* ===== ツアー一覧 ===== */}
      <section className="max-w-6xl mx-auto w-full px-6 md:px-10 pb-24">
        <div className="flex items-baseline justify-between mb-10 md:mb-14 border-b border-neutral-200 pb-4">
          <div>
            <p className="text-[11px] tracking-[0.4em] text-neutral-500 uppercase mb-2">
              upcoming
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-neutral-800">
              いま募集中の旅
            </h2>
          </div>
          <p className="text-xs text-neutral-500">{tours.length} trips</p>
        </div>

        {tours.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-20">
            現在募集中の旅はありません。
          </p>
        ) : (
          <div className="grid gap-12 md:gap-16 md:grid-cols-2">
            {tours.map((tour, i) => (
              <TourCard key={tour.id} tour={tour} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ===== フッター ===== */}
      <footer className="border-t border-neutral-200 mt-auto">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
          <p className="font-serif text-xl tracking-widest text-neutral-700">Re:Trip</p>
          <p className="mt-2 text-[11px] text-neutral-500">
            © {new Date().getFullYear()} Re:Trip. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function TourCard({ tour, index }: { tour: TourRow; index: number }) {
  const isSample = tour.theme_tags.includes("サンプル");
  const visibleTags = tour.theme_tags.filter((t) => t !== "サンプル").slice(0, 3);
  const dateLabel = formatDateRange(tour.departure_date, tour.return_date, tour.tour_type);
  const typeLabel = tour.tour_type === "day_trip" ? "day trip" : "1 night";

  return (
    <Link
      href={`/tours/${tour.id}`}
      className="group block"
    >
      <article className="space-y-5">
        {/* 写真：縦長ポスター風 */}
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 rounded-sm">
          {tour.cover_image_url ? (
            <Image
              src={tour.cover_image_url}
              alt={tour.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            />
          ) : null}

          {/* SAMPLEバッジ（写真の左上） */}
          {isSample && (
            <div className="absolute top-4 left-4">
              <span className="bg-white/95 backdrop-blur-sm text-[10px] tracking-[0.25em] text-neutral-700 px-2.5 py-1 uppercase">
                Sample
              </span>
            </div>
          )}

          {/* インデックス番号（雑誌風） */}
          <div className="absolute bottom-4 left-4">
            <span className="font-serif text-white/90 text-sm tracking-widest drop-shadow">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* テキスト部分 */}
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-neutral-500 uppercase">
            <span>{typeLabel}</span>
            <span className="text-neutral-300">/</span>
            <span>{dateLabel}</span>
          </div>

          <h3 className="font-serif text-2xl md:text-[1.7rem] text-neutral-800 leading-snug tracking-wide transition-colors group-hover:text-brand-700">
            {tour.title}
          </h3>

          <p className="text-xs text-neutral-500 tracking-wide">{tour.destination}</p>

          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2 pt-1">
            {tour.description}
          </p>

          {/* タグ */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] tracking-wider text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 価格と定員 */}
          <div className="flex items-end justify-between pt-4 border-t border-neutral-100 mt-4">
            <p className="text-[11px] tracking-widest text-neutral-500 uppercase">
              定員 {tour.capacity_total}名
            </p>
            <p className="font-serif text-lg text-neutral-800">
              ¥{tour.price.toLocaleString()}
              <span className="text-[10px] tracking-widest text-neutral-500 ml-1">/ person</span>
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
