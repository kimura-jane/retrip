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

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select("id, title, destination, departure_date, price, cover_image_url, theme_tags")
    .eq("status", "recruiting")
    .order("departure_date", { ascending: true });

  const tours: Tour[] = (data ?? []) as Tour[];

  return (
    <>
      {/* タイトルブロック（旧ヒーロー：画像なし・縦短め） */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 md:py-20 text-center">
          <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
            Upcoming Journeys
          </p>
          <h1 className="mt-5 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink-900">
            現在の募集ツアー
          </h1>
          <p className="mt-6 text-[13px] md:text-[14px] font-light tracking-[0.08em] leading-loose2 text-ink-500">
            週末のバス旅で、ちいさな共同生活を。
          </p>
        </div>
      </section>

      {/* ツアー一覧 */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {tours.length === 0 ? (
            <p className="text-center text-[13px] font-light text-ink-500 leading-loose2">
              現在、募集中のツアーはありません。
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
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
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 font-display text-xl text-ink-900">
                        ¥{(t.price ?? 0).toLocaleString()}
                        <span className="ml-1 text-[10px] tracking-widest2 text-ink-500 uppercase">
                          / seat
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
    </>
  );
}
