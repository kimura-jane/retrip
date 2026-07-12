import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SupportChatEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // database.ts の再生成までは新規RPCだけ untyped client で呼び出す。
  const client = supabase as unknown as SupabaseClient;
  const { data, error } = await client.rpc("get_or_create_support_room");
  if (error || !data) {
    console.error("[support] get_or_create_support_room failed", error?.message);
    redirect("/mypage");
  }

  redirect(`/chat/${data as string}`);
}
