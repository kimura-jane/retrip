import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MeetingPoint = {
  id: string;
  name: string;
  time: string;
};

type TourRow = {
  id: string;
  title: string;
  description: string;
  tour_type: "day_trip" | "overnight";
  destination: string;
  departure_date: string;
  return_date: string;
  meeting_points: MeetingPoint[];
  price: number;
  capacity_total: number;
  capacity_male: number | null;
  capacity_female: number | null;
  age_range_min: number | null;
  age_range_max: number | null;
  theme_tags: string[];
  cover_image_url: string | null;
  status: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const hour = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}(${weekday}) ${hour}:${min}`;
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("tours")
    .select(
      "id,title,description,tour_type,destination,departure_date,return_date,meeting_points,price,capacity_total,capacity_male,capacity_female,age_range_min,age_range_max,theme_tags,cover_image_url,status"
    )
    .eq("id", tourId)
    .maybeSingle();

  const tour = data as TourRow | null;
  if (!tour) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ageRange =
    tour.age_range_min && tour.age_range_max
      ? `${tour.age_range_min}〜${tour.age_range_max}歳`
      : null;

  const genderBalance =
    tour.capacity_male && tour.capacity_female
      ? `男性${tour.capacity_male}名 / 女性${tour.capacity_female}名`
      : null;

  return (
    <div className="min-h-screen bg-[#FAFBF7] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
        <div className="relative aspect-[4/3] md:aspect-[16/9] rounded-lg overflow-hidden bg-neutral-100">
          {tour.cover_image_url ? (
            <Image
              src={tour.cover_image_url}
              alt={tour.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {tour.theme_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="font-serif text-3xl text-neutral-800">{tour.title}</h1>
          <p className="text-sm text-neutral-500">{tour.destination}</p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-neutral-600">料金</span>
            <span className="text-2xl font-medium text-brand-700">
              ¥{tour.price.toLocaleString()}
              <span className="text-sm text-neutral-500 ml-1">/ 人</span>
            </span>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-neutral-800">このツアーについて</h2>
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {tour.description}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-neutral-800">日程</h2>
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-neutral-500 shrink-0" />
              <div>
                <p className="text-neutral-700">出発：{formatDate(tour.departure_date)}</p>
                <p className="text-neutral-700">帰着：{formatDate(tour.return_date)}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {tour.tour_type === "day_trip" ? "日帰り" : "1泊2日"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-neutral-800">集合場所</h2>
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3 text-sm">
            {tour.meeting_points.map((mp) => (
              <div key={mp.id} className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-neutral-500 shrink-0" />
                <div>
                  <p className="text-neutral-700">{mp.name}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {mp.time} 集合
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-neutral-800">定員</h2>
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-500" />
              <span className="text-neutral-700">全{tour.capacity_total}名</span>
            </div>
            {genderBalance && (
              <p className="text-xs text-neutral-600 pl-6">{genderBalance}</p>
            )}
            {ageRange && (
              <p className="text-xs text-neutral-600 pl-6">対象年齢：{ageRange}</p>
            )}
          </div>
        </section>

        <div className="sticky bottom-4 pt-4">
          {user ? (
            <Button
              size="lg"
              className="w-full bg-brand-400 text-white hover:bg-brand-600"
              disabled
            >
              申し込む（決済機能は準備中）
            </Button>
          ) : (
            <Link href={`/login?redirect=/tours/${tour.id}`}>
              <Button
                size="lg"
                className="w-full bg-brand-400 text-white hover:bg-brand-600"
              >
                ログインして申し込む
              </Button>
            </Link>
          )}
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Re:Trip
      </footer>
    </div>
  );
}
