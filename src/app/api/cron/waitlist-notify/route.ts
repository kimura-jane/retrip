import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CancelledBooking = {
  tour_id: string;
};

type WaitlistRow = {
  id: string;
  user_id: string;
};

type TourRow = {
  id: string;
  title: string;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getYesterdayJstRange(now = new Date()) {
  const nowInJst = new Date(now.getTime() + JST_OFFSET_MS);
  const todayStartUtcMs =
    Date.UTC(
      nowInJst.getUTCFullYear(),
      nowInJst.getUTCMonth(),
      nowInJst.getUTCDate()
    ) - JST_OFFSET_MS;

  return {
    start: new Date(todayStartUtcMs - DAY_MS).toISOString(),
    end: new Date(todayStartUtcMs).toISOString(),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[waitlist-notify] RESEND_API_KEY is not configured");
    return NextResponse.json(
      { ok: false, error: "Email service is not configured" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const client = admin as unknown as SupabaseClient;
  const { start, end } = getYesterdayJstRange();

  const { data: cancelledData, error: cancelledError } = await client
    .from("bookings")
    .select("tour_id")
    .eq("status", "cancelled")
    .gte("updated_at", start)
    .lt("updated_at", end);

  if (cancelledError) {
    console.error("[waitlist-notify] booking query failed", cancelledError.message);
    return NextResponse.json(
      { ok: false, error: "Failed to query cancelled bookings" },
      { status: 500 }
    );
  }

  const tourIds = new Set(
    ((cancelledData ?? []) as CancelledBooking[]).map((row) => row.tour_id)
  );

  let notified = 0;
  let failed = 0;
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://retrip-coral.vercel.app"
  ).replace(/\/$/, "");

  for (const tourId of tourIds) {
    const { data: tourData, error: tourError } = await client
      .from("tours")
      .select("id, title")
      .eq("id", tourId)
      .maybeSingle();

    if (tourError || !tourData) {
      failed += 1;
      console.error(
        "[waitlist-notify] tour query failed",
        tourId,
        tourError?.message
      );
      continue;
    }

    const tour = tourData as TourRow;
    const { data: waitlistData, error: waitlistError } = await client
      .from("waitlists")
      .select("id, user_id")
      .eq("tour_id", tourId)
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    if (waitlistError) {
      failed += 1;
      console.error(
        "[waitlist-notify] waitlist query failed",
        tourId,
        waitlistError.message
      );
      continue;
    }

    for (const row of (waitlistData ?? []) as WaitlistRow[]) {
      try {
        const { data: authData, error: userError } =
          await admin.auth.admin.getUserById(row.user_id);
        const email = authData.user?.email;

        if (userError || !email) {
          failed += 1;
          console.error(
            "[waitlist-notify] user email lookup failed",
            row.user_id,
            userError?.message
          );
          continue;
        }

        const tourUrl = `${siteUrl}/tours/${tourId}`;
        const text = [
          "Re:Trip キャンセル待ちのお知らせ",
          "",
          `「${tour.title}」に空きが出ました。`,
          "通常の予約フローから先着順でご予約いただけます。",
          "",
          tourUrl,
        ].join("\n");
        const html = `
          <p>Re:Trip キャンセル待ちのお知らせ</p>
          <p>「${escapeHtml(tour.title)}」に空きが出ました。</p>
          <p>通常の予約フローから先着順でご予約いただけます。</p>
          <p><a href="${escapeHtml(tourUrl)}">ツアー詳細を見る</a></p>
        `;

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Re:Trip <contact@jomonkusama.com>",
            to: [email],
            subject: "【Re:Trip】キャンセル待ちのツアーに空きが出ました",
            text,
            html,
          }),
        });

        if (!response.ok) {
          failed += 1;
          console.error(
            "[waitlist-notify] Resend failed",
            row.id,
            response.status,
            await response.text()
          );
          continue;
        }

        const { error: updateError } = await client
          .from("waitlists")
          .update({ status: "notified", notified_at: new Date().toISOString() })
          .eq("id", row.id);

        if (updateError) {
          failed += 1;
          console.error(
            "[waitlist-notify] waitlist update failed",
            row.id,
            updateError.message
          );
          continue;
        }

        notified += 1;
      } catch (error) {
        failed += 1;
        console.error("[waitlist-notify] notification exception", row.id, error);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    tours: tourIds.size,
    notified,
    failed,
  });
}
