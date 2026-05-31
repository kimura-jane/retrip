"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// ============================================
// 型
// ============================================

export type StartCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

type TourRow = {
  id: string;
  title: string;
  price: number;
  status: string;
  capacity_total: number;
  capacity_male: number | null;
  capacity_female: number | null;
  meeting_points: { id: string; label?: string; name?: string }[];
};

// ============================================
// startCheckoutAction
//
// ツアー予約の決済を開始する。
//   1. ログイン・本人確認チェック
//   2. ツアーの存在・募集中チェック
//   3. 集合場所の妥当性チェック
//   4. 既存予約（二重予約）チェック
//   5. 満席チェック
//   6. Stripe Checkout Session を作成し、決済ページ URL を返す
//
// この時点では bookings に書き込まない。
// 決済成功後の Webhook で初めて bookings を confirmed で作成する。
// ============================================

export async function startCheckoutAction(
  tourId: string,
  meetingPointId: string
): Promise<StartCheckoutResult> {
  const supabase = await createClient();

  // 1. ログインチェック
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  // 本人確認チェック（旅行予約は本人確認済みのみ）
  const { data: profile } = await supabase
    .from("users")
    .select("id_verified")
    .eq("id", user.id)
    .maybeSingle<{ id_verified: boolean }>();

  if (!profile?.id_verified) {
    return {
      success: false,
      error: "ご予約には本人確認が必要です。マイページから本人確認をお願いします。",
    };
  }

  // 2. ツアー取得・募集中チェック
  const { data: tourRaw, error: tourError } = await supabase
    .from("tours")
    .select(
      "id, title, price, status, capacity_total, capacity_male, capacity_female, meeting_points"
    )
    .eq("id", tourId)
    .maybeSingle();

  if (tourError || !tourRaw) {
    return { success: false, error: "ツアーが見つかりませんでした" };
  }

  const tour = tourRaw as unknown as TourRow;

  if (tour.status !== "recruiting") {
    return { success: false, error: "このツアーは現在予約を受け付けていません" };
  }

  // 3. 集合場所の妥当性チェック
  const validPoint = (tour.meeting_points ?? []).some(
    (mp) => mp.id === meetingPointId
  );
  if (!validPoint) {
    return { success: false, error: "集合場所の指定が正しくありません" };
  }

  // 4. 二重予約チェック（キャンセル済み以外の予約が既にあるか）
  const { data: existing } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("tour_id", tourId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; status: string }>();

  if (existing && existing.status !== "cancelled") {
    return { success: false, error: "このツアーは既に予約済みです" };
  }

  // 5. 満席チェック（confirmed / attended を有効予約として数える）
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("tour_id", tourId)
    .in("status", ["confirmed", "attended"]);

  const confirmedCount = count ?? 0;
  if (confirmedCount >= tour.capacity_total) {
    return { success: false, error: "申し訳ありません、このツアーは満席です" };
  }

  // 6. Stripe Checkout Session 作成
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://retrip-coral.vercel.app";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // 決済手段はダッシュボードの有効化設定に従う（card など）
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "jpy",
            unit_amount: tour.price, // JPY はそのまま円（最小単位が円）
            product_data: {
              name: tour.title,
              description: "Re:Trip ツアー参加費",
            },
          },
        },
      ],
      // Webhook 側で誰の・どのツアーの・どの集合場所の決済かを復元するための情報
      metadata: {
        tour_id: tour.id,
        user_id: user.id,
        meeting_point_id: meetingPointId,
      },
      // 顧客のメール宛に領収書を送る（テストモードでは送信されない場合あり）
      customer_email: user.email ?? undefined,
      success_url: `${origin}/booking/complete?tour=${tour.id}`,
      cancel_url: `${origin}/tours/${tour.id}?canceled=1`,
    });

    if (!session.url) {
      return { success: false, error: "決済ページの作成に失敗しました" };
    }

    return { success: true, url: session.url };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "決済の開始中にエラーが発生しました";
    return { success: false, error: message };
  }
}
