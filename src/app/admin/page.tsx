import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 未審査件数（id_document_url あり、id_verified = false、id_rejected_at は null）
  const { count: pendingCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .not("id_document_url", "is", null)
    .eq("id_verified", false)
    .is("id_rejected_at", null);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-neutral-800">管理ダッシュボード</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/verifications">
          <Card className="hover:bg-neutral-50 transition cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base">本人確認</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-light text-brand-600">
                {pendingCount ?? 0}
                <span className="text-sm text-neutral-500 ml-2">件 審査待ち</span>
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
