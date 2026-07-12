"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function toggleWaitlistAction(formData: FormData): Promise<void> {
  const tourId = String(formData.get("tourId") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  const nextPath = nextRaw.startsWith("/") ? nextRaw : "/";

  if (!tourId) redirect(nextPath);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const client = supabase as unknown as SupabaseClient;

  const { data: existing, error: selErr } = await client
    .from("waitlists")
    .select("id, status")
    .eq("user_id", user!.id)
    .eq("tour_id", tourId)
    .maybeSingle();

  if (selErr) {
    console.error("[waitlists] select error", selErr.message);
    redirect(nextPath);
  }

  if (existing) {
    const { error: delErr } = await client
      .from("waitlists")
      .delete()
      .eq("id", (existing as { id: string }).id);
    if (delErr) console.error("[waitlists] delete error", delErr.message);
  } else {
    const { error: insErr } = await client
      .from("waitlists")
      .insert({ user_id: user!.id, tour_id: tourId, status: "waiting" });
    if (insErr) console.error("[waitlists] insert error", insErr.message);
  }

  revalidatePath("/mypage");
  revalidatePath(`/tours/${tourId}`);
  redirect(nextPath);
}
