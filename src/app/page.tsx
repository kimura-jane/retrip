import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";

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

function formatDateRange(
  departure: string,
  returnDate: string,
  tourType: "day_trip" | "overnight"
): string {
  const dep = new Date(departure);
  const month = dep.getMonth() + 1;
  const day = dep.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][dep.getDay()];
  if (tourType === "day_trip") {
    return `${month}/${day}(${weekday}) 日帰り`;
  }
  const ret = new Date(returnDate);
  const retMonth = ret.getMonth() + 1;
  const retDay = ret.getDate();
  return `${month}/${day}(${weekday}) 〜 ${retMonth}/${retDay} 1泊2日`;
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

  const tours = (data as TourRow[] | null) ?? [];

  return (
    <div className="min-h-screen bg-[#FAFBF7] flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="font-serif text-3xl text-neutral-800">募集中のツアー</h1>
          <p className="text-sm text-neutral-600">
            関東発、少人数のバスツアー。気になる旅をタップして、詳細をご覧ください。
          </p>
        </div>

        {tours.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-16">
            現在募集中のツアーはありません。
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/tours/${tour.id}`}
                className="group rounded-lg overflow-hidden bg-white border border-neutral-200 hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                  {tour.cover_image_url ? (
                    <Image
                      src={tour.cover_image_url}
                      alt={tour.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : null}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {tour.theme_tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="font-serif text-xl text-neutral-800">
                    {tour.title}
                  </h2>
                  <div className="space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{tour.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDateRange(
                          tour.departure_date,
                          tour.return_date,
                          tour.tour_type
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>定員 {tour.capacity_total}名</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-lg font-medium text-brand-700">
                      ¥{tour.price.toLocaleString()}
                      <span className="text-xs text-neutral-500 ml-1">/ 人</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="px-6 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Re:Trip
      </footer>
    </div>
  );
}
