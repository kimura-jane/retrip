import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TourForm } from "../../tour-form";
import type { TourInput } from "@/features/tour/admin-actions";
import type { Database, MeetingPoint } from "@/types/database";

export const dynamic = "force-dynamic";

type TourRow = Database["public"]["Tables"]["tours"]["Row"];

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .single();

  if (error || !data) {
    notFound();
  }

  const tour = data as unknown as TourRow;

  const initial: TourInput = {
    title: tour.title,
    description: tour.description,
    tour_type: tour.tour_type,
    destination: tour.destination,
    departure_date: tour.departure_date,
    return_date: tour.return_date,
    meeting_points: (tour.meeting_points as MeetingPoint[]) ?? [],
    price: tour.price,
    capacity_total: tour.capacity_total,
    capacity_male: tour.capacity_male,
    capacity_female: tour.capacity_female,
    age_range_min: tour.age_range_min,
    age_range_max: tour.age_range_max,
    theme_tags: tour.theme_tags ?? [],
    status: tour.status,
    cover_image_url: tour.cover_image_url,
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* パンくず */}
      <div>
        <Link
          href="/admin/tours"
          className="text-[11px] tracking-[0.15em] uppercase text-ink-500 hover:text-coral-700 transition"
        >
          ← Tours
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="border-b border-line pb-6">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          Edit Tour
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900 line-clamp-2">
          {tour.title}
        </h1>
        <p className="mt-3 text-[13px] font-light text-ink-500 leading-loose2">
          ID: {tour.id}
        </p>
      </div>

      <TourForm mode="edit" tourId={tour.id} initial={initial} />
    </div>
  );
}
