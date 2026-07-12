import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getWaitlistTourIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const client = supabase as unknown as SupabaseClient;
  const { data } = await client
    .from("waitlists")
    .select("tour_id")
    .eq("user_id", user.id)
    .in("status", ["waiting", "notified"]);

  return new Set(
    ((data ?? []) as Array<{ tour_id: string }>).map((r) => r.tour_id)
  );
}
