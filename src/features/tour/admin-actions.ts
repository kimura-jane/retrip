"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  TourType,
  TourStatus,
  MeetingPoint,
  Database,
} from "@/types/database";

// ============================================
// 型
// ============================================

export type TourInput = {
  title: string;
  description: string;
  tour_type: TourType;
  destination: string;
  departure_date: string; // ISO string
  return_date: string;    // ISO string
  meeting_points: MeetingPoint[];
  price: number;
  capacity_total: number;
  capacity_male: number | null;
  capacity_female: number | null;
  age_range_min: number | null;
  age_range_max: number | null;
  theme_tags: string[];
  status: TourStatus;
  cover_image_url: string | null;
};

export type ActionResult =
  | { success: true; tourId: string }
  | { success: false; error: string };

type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
type TourUpdate = Database["public"]["Tables"]["tours"]["Update"];
type TourRow = Database["public"]["Tables"]["tours"]["Row"];

// ============================================
// 共通：admin チェック
// ============================================

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "ログインが必要です" };
  const role = (user.user_metadata?.role as string | undefined) ?? null;
  if (role !== "admin") return { ok: false as const, error: "権限がありません" };
  return { ok: true as const, supabase, userId: user.id };
}

// ============================================
// createTourAction
// ============================================

export async function createTourAction(
  input: TourInput
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const payload: TourInsert = {
    title: input.title,
    description: input.description,
    tour_type: input.tour_type,
    destination: input.destination,
    departure_date: input.departure_date,
    return_date: input.return_date,
    meeting_points: input.meeting_points,
    price: input.price,
    capacity_total: input.capacity_total,
    capacity_male: input.capacity_male,
    capacity_female: input.capacity_female,
    age_range_min: input.age_range_min,
    age_range_max: input.age_range_max,
    theme_tags: input.theme_tags,
    status: input.status,
    cover_image_url: input.cover_image_url,
  };

  const { data, error } = await guard.supabase
    .from("tours")
    .insert(payload as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return { success: false, error: error?.message ?? "作成に失敗しました" };
  }

  revalidatePath("/admin/tours");
  revalidatePath("/");
  return { success: true, tourId: data.id };
}

// ============================================
// updateTourAction
// ============================================

export async function updateTourAction(
  tourId: string,
  input: TourInput
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const payload: TourUpdate = {
    title: input.title,
    description: input.description,
    tour_type: input.tour_type,
    destination: input.destination,
    departure_date: input.departure_date,
    return_date: input.return_date,
    meeting_points: input.meeting_points,
    price: input.price,
    capacity_total: input.capacity_total,
    capacity_male: input.capacity_male,
    capacity_female: input.capacity_female,
    age_range_min: input.age_range_min,
    age_range_max: input.age_range_max,
    theme_tags: input.theme_tags,
    status: input.status,
    cover_image_url: input.cover_image_url,
  };

  const { error } = await guard.supabase
    .from("tours")
    .update(payload as never)
    .eq("id", tourId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${tourId}/edit`);
  revalidatePath(`/tours/${tourId}`);
  revalidatePath("/");
  return { success: true, tourId };
}

// ============================================
// deleteTourAction
// ============================================

export async function deleteTourAction(
  tourId: string
): Promise<{ success: boolean; error?: string }> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const { error } = await guard.supabase
    .from("tours")
    .delete()
    .eq("id", tourId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/tours");
  revalidatePath("/");
  return { success: true };
}

// ============================================
// duplicateTourAction（既存ツアーを複製して draft で作る）
// ============================================

export async function duplicateTourAction(
  tourId: string
): Promise<ActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const { data: originalRaw, error: fetchError } = await guard.supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .single();

  if (fetchError || !originalRaw) {
    return {
      success: false,
      error: fetchError?.message ?? "複製元が見つかりません",
    };
  }

  const original = originalRaw as unknown as TourRow;

  const payload: TourInsert = {
    title: `${original.title}（複製）`,
    description: original.description,
    tour_type: original.tour_type,
    destination: original.destination,
    departure_date: original.departure_date,
    return_date: original.return_date,
    meeting_points: original.meeting_points,
    price: original.price,
    capacity_total: original.capacity_total,
    capacity_male: original.capacity_male,
    capacity_female: original.capacity_female,
    age_range_min: original.age_range_min,
    age_range_max: original.age_range_max,
    theme_tags: original.theme_tags,
    status: "draft",
    cover_image_url: original.cover_image_url,
  };

  const { data: created, error: insertError } = await guard.supabase
    .from("tours")
    .insert(payload as never)
    .select("id")
    .single<{ id: string }>();

  if (insertError || !created) {
    return {
      success: false,
      error: insertError?.message ?? "複製に失敗しました",
    };
  }

  revalidatePath("/admin/tours");
  return { success: true, tourId: created.id };
}

// ============================================
// redirect helpers（フォーム submit 後の遷移用）
// ============================================

export async function redirectToTourEdit(tourId: string): Promise<never> {
  redirect(`/admin/tours/${tourId}/edit`);
}

export async function redirectToTourList(): Promise<never> {
  redirect("/admin/tours");
}
