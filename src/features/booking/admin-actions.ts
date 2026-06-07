"use server";

import { createClient } from "@/lib/supabase/server";
import type { BookingStatus, MeetingPoint } from "@/types/database";

export type BookingWithUser = {
  bookingId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  idVerified: boolean;
  status: BookingStatus;
  meetingPointId: string;
  meetingPointName: string;
  amountPaid: number;
  bookedAt: string;
};

export type TourBookingsResult =
  | {
      success: true;
      tourTitle: string;
      bookings: BookingWithUser[];
    }
  | { success: false; error: string };

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "ログインが必要です" };
  const role = (user.user_metadata?.role as string | undefined) ?? null;
  if (role !== "admin") return { ok: false as const, error: "権限がありません" };
  return { ok: true as const, supabase };
}

export async function getTourBookingsAction(
  tourId: string
): Promise<TourBookingsResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = guard.supabase;

  // ツアー本体（タイトルと meeting_points）
  const { data: tourData, error: tourError } = await supabase
    .from("tours")
    .select("title, meeting_points")
    .eq("id", tourId)
    .maybeSingle<{ title: string; meeting_points: MeetingPoint[] }>();

  if (tourError || !tourData) {
    return { success: false, error: tourError?.message ?? "ツアーが見つかりません" };
  }

  const mpNameById: Record<string, string> = {};
  for (const mp of tourData.meeting_points ?? []) {
    mpNameById[mp.id] = mp.name;
  }

  // 予約一覧（cancelled も含めて全件。並びは予約日時の新しい順）
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      "id, user_id, meeting_point_id, status, amount_paid, booked_at"
    )
    .eq("tour_id", tourId)
    .order("booked_at", { ascending: false });

  if (bookingsError) {
    return { success: false, error: bookingsError.message };
  }

  type BookingRow = {
    id: string;
    user_id: string;
    meeting_point_id: string;
    status: BookingStatus;
    amount_paid: number;
    booked_at: string;
  };
  const rows = (bookingsData as BookingRow[] | null) ?? [];

  // 予約者のユーザー情報をまとめて取得
  const userIds = Array.from(new Set(rows.map((b) => b.user_id)));
  const userById: Record<
    string,
    { display_name: string; avatar_url: string | null; id_verified: boolean }
  > = {};

  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, display_name, avatar_url, id_verified")
      .in("id", userIds);
    type UserRow = {
      id: string;
      display_name: string;
      avatar_url: string | null;
      id_verified: boolean;
    };
    for (const u of (usersData as UserRow[] | null) ?? []) {
      userById[u.id] = {
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        id_verified: u.id_verified,
      };
    }
  }

  const bookings: BookingWithUser[] = rows.map((b) => {
    const u = userById[b.user_id];
    return {
      bookingId: b.id,
      userId: b.user_id,
      displayName: u?.display_name ?? "（不明なユーザー）",
      avatarUrl: u?.avatar_url ?? null,
      idVerified: u?.id_verified ?? false,
      status: b.status,
      meetingPointId: b.meeting_point_id,
      meetingPointName: mpNameById[b.meeting_point_id] ?? b.meeting_point_id,
      amountPaid: b.amount_paid,
      bookedAt: b.booked_at,
    };
  });

  return {
    success: true,
    tourTitle: tourData.title,
    bookings,
  };
}
