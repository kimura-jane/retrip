import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================
// Stripe Webhook ハンドラ
//
//   1. 署名検証（STRIPE_WEBHOOK_SECRET）
//   2. checkout.session.completed のみ処理
//   3. metadata から tour_id / user_id / meeting_point_id を復元
//   4. bookings を confirmed で upsert（unique(tour_id,user_id) 対応）
//   5. payments にログ記録（stripe_event_id unique で冪等性確保）
//   6. 対象ツアーの chat_rooms に chat_members として参加登録
//
// 認証セッションを持たないため、RLS をバイパスする
// service_role クライアント（createAdminClient）を使う。
// ============================================

// Stripe 署名検証には生のリクエストボディが必要なので、
// Next.js のボディパースを無効化する。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET が設定されていません");
    return NextResponse.json(
      { error: "webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  // 生のボディ（文字列）を取得
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("Webhook 署名検証に失敗:", message);
    return NextResponse.json(
      { error: `signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // 決済完了イベントのみ処理。それ以外は 200 で受け流す。
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const tourId = session.metadata?.tour_id;
  const userId = session.metadata?.user_id;
  const meetingPointId = session.metadata?.meeting_point_id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const amount = session.amount_total ?? 0;

  if (!tourId || !userId || !meetingPointId) {
    console.error("metadata が不足:", session.metadata);
    // Stripe に再送させても直らないので 200 で確定させる
    return NextResponse.json({ received: true, skipped: "missing metadata" });
  }

  const supabase = createAdminClient();

  // --- 冪等性チェック：このイベントを既に処理済みか ---
  const { data: alreadyProcessed } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    // 二重配信。何もせず成功扱い。
    return NextResponse.json({ received: true, duplicate: true });
  }

  // --- 1. bookings を confirmed で upsert ---
  // unique(tour_id, user_id) があるため、キャンセル済み行があっても
  // onConflict で更新して再予約に対応する。
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .upsert(
      {
        tour_id: tourId,
        user_id: userId,
        meeting_point_id: meetingPointId,
        status: "confirmed",
        stripe_payment_intent_id: paymentIntentId,
        amount_paid: amount,
      } as never,
      { onConflict: "tour_id,user_id" }
    )
    .select("id")
    .maybeSingle<{ id: string }>();

  if (bookingError || !booking) {
    console.error("bookings upsert 失敗:", bookingError);
    // 失敗時は 500 を返し Stripe に再送させる
    return NextResponse.json(
      { error: "booking upsert failed" },
      { status: 500 }
    );
  }

  // --- 2. payments にログ記録（冪等性キー = stripe_event_id） ---
  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id: booking.id,
    stripe_event_id: event.id,
    event_type: event.type,
    amount,
    status: session.payment_status ?? "paid",
    raw_payload: event as unknown as Record<string, unknown>,
  } as never);

  if (paymentError) {
    console.error("payments insert 失敗:", paymentError);
    return NextResponse.json(
      { error: "payment log failed" },
      { status: 500 }
    );
  }

  // --- 3. 対象ツアーのチャット部屋に参加登録 ---
  // tours 作成時にトリガで chat_rooms(type='tour') が1つだけ作られている。
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("tour_id", tourId)
    .maybeSingle<{ id: string }>();

  if (room) {
    // (room_id, user_id) が主キー。再予約時の重複に備えて upsert。
    const { error: memberError } = await supabase.from("chat_members").upsert(
      {
        room_id: room.id,
        user_id: userId,
        role: "member",
        left_at: null,
      } as never,
      { onConflict: "room_id,user_id" }
    );

    if (memberError) {
      // チャット参加は失敗してもログだけ残し、決済自体は成功扱い。
      console.error("chat_members upsert 失敗:", memberError);
    }
  } else {
    console.error("対象ツアーのチャット部屋が見つかりません:", tourId);
  }

  return NextResponse.json({ received: true });
}
