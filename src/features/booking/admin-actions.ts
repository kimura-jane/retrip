"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
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
  return { ok: true as const, supabase, adminUserId: user.id };
}

// ============================================
// 予約一覧取得（既存）
// ============================================

export async function getTourBookingsAction(
  tourId: string
): Promise<TourBookingsResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = guard.supabase;

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

// ============================================
// 予約情報取得（詳細ページ用・単体）
// ============================================

export type BookingDetail = {
  bookingId: string;
  tourId: string;
  tourTitle: string;
  status: BookingStatus;
  meetingPointName: string;
  amountPaid: number;
  bookedAt: string;
  stripePaymentIntentId: string | null;
};

export type BookingDetailResult =
  | { success: true; booking: BookingDetail | null }
  | { success: false; error: string };

export async function getBookingByTourAndUserAction(
  tourId: string,
  userId: string
): Promise<BookingDetailResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = guard.supabase;

  const { data: tourData } = await supabase
    .from("tours")
    .select("title, meeting_points")
    .eq("id", tourId)
    .maybeSingle<{ title: string; meeting_points: MeetingPoint[] }>();

  if (!tourData) {
    return { success: false, error: "ツアーが見つかりません" };
  }

  const mpNameById: Record<string, string> = {};
  for (const mp of tourData.meeting_points ?? []) {
    mpNameById[mp.id] = mp.name;
  }

  // このユーザー × このツアー の予約（キャンセル済みも含む・複数あれば最新）
  const { data: bookingData } = await supabase
    .from("bookings")
    .select(
      "id, meeting_point_id, status, amount_paid, booked_at, stripe_payment_intent_id"
    )
    .eq("tour_id", tourId)
    .eq("user_id", userId)
    .order("booked_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      meeting_point_id: string;
      status: BookingStatus;
      amount_paid: number;
      booked_at: string;
      stripe_payment_intent_id: string | null;
    }>();

  if (!bookingData) {
    return { success: true, booking: null };
  }

  return {
    success: true,
    booking: {
      bookingId: bookingData.id,
      tourId,
      tourTitle: tourData.title,
      status: bookingData.status,
      meetingPointName:
        mpNameById[bookingData.meeting_point_id] ?? bookingData.meeting_point_id,
      amountPaid: bookingData.amount_paid,
      bookedAt: bookingData.booked_at,
      stripePaymentIntentId: bookingData.stripe_payment_intent_id,
    },
  };
}

// ============================================
// キャンセル実行（admin 用）
//
// - refundType: "full" | "partial" | "none"
// - partial の場合は refundAmount（円）を指定
// - Stripe refund 実行 → bookings.status を cancelled に → chat_members から退出 → admin_logs に記録
// ============================================

export type AdminCancelInput = {
  tourId: string;
  userId: string;
  bookingId: string;
  refundType: "full" | "partial" | "none";
  refundAmount?: number; // partial のときのみ使用（円）
  reason: string;
};

export type AdminCancelResult =
  | { success: true; refundedAmount: number }
  | { success: false; error: string };

export async function adminCancelBookingAction(
  input: AdminCancelInput
): Promise<AdminCancelResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = guard.supabase;
  const adminUserId = guard.adminUserId;

  // 予約取得
  const { data: bookingData } = await supabase
    .from("bookings")
    .select(
      "id, tour_id, user_id, status, amount_paid, stripe_payment_intent_id"
    )
    .eq("id", input.bookingId)
    .maybeSingle<{
      id: string;
      tour_id: string;
      user_id: string;
      status: BookingStatus;
      amount_paid: number;
      stripe_payment_intent_id: string | null;
    }>();

  if (!bookingData) {
    return { success: false, error: "予約が見つかりません" };
  }

  if (bookingData.tour_id !== input.tourId || bookingData.user_id !== input.userId) {
    return { success: false, error: "予約情報が一致しません" };
  }

  if (bookingData.status === "cancelled") {
    return { success: false, error: "この予約はすでにキャンセルされています" };
  }

  // 返金額の決定
  let refundedAmount = 0;
  if (input.refundType === "full") {
    refundedAmount = bookingData.amount_paid;
  } else if (input.refundType === "partial") {
    const a = input.refundAmount ?? 0;
    if (a <= 0 || a > bookingData.amount_paid) {
      return {
        success: false,
        error: `返金額は 1〜${bookingData.amount_paid.toLocaleString()} 円の範囲で指定してください`,
      };
    }
    refundedAmount = a;
  } else {
    refundedAmount = 0;
  }

  // Stripe refund 実行
  if (refundedAmount > 0) {
    if (!bookingData.stripe_payment_intent_id) {
      return {
        success: false,
        error:
          "この予約には Stripe の決済情報がないため、返金できません。返金なしで続行してください。",
      };
    }
    try {
      await stripe.refunds.create({
        payment_intent: bookingData.stripe_payment_intent_id,
        // JPY は最小単位が円なので amount はそのまま渡す
        // full の場合は amount を省略しても同じだが、明示的に渡しておく
        amount: refundedAmount,
        reason: "requested_by_customer",
        metadata: {
          booking_id: bookingData.id,
          admin_user_id: adminUserId,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Stripe 返金でエラーが発生しました";
      return { success: false, error: `Stripe 返金失敗: ${message}` };
    }
  }

  // bookings.status を cancelled に更新
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" } as never)
    .eq("id", bookingData.id);

  if (updateError) {
    return {
      success: false,
      error: `予約ステータス更新失敗: ${updateError.message}（Stripe 返金は完了している可能性があります）`,
    };
  }

  // チャットルームから退出させる（該当ツアーの chat_room を探す）
  const { data: chatRoomData } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("tour_id", bookingData.tour_id)
    .maybeSingle<{ id: string }>();

  if (chatRoomData) {
    await supabase
      .from("chat_members")
      .update({ left_at: new Date().toISOString() } as never)
      .eq("room_id", chatRoomData.id)
      .eq("user_id", bookingData.user_id)
      .is("left_at", null);
  }

  // admin_logs に記録
  await supabase.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action: "cancel_booking",
    target_type: "booking",
    target_id: bookingData.id,
    note: JSON.stringify({
      refund_type: input.refundType,
      refunded_amount: refundedAmount,
      reason: input.reason,
    }),
  } as never);

  revalidatePath(`/admin/tours/${input.tourId}/bookings`);
  revalidatePath(`/admin/tours/${input.tourId}/bookings/${input.userId}`);

  return { success: true, refundedAmount };
}
