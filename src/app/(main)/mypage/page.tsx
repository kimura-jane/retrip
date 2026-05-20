import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GENDER_LABELS } from "@/features/user/schema";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const verificationStatus = profile?.id_verification_status as
    | "unverified"
    | "pending"
    | "approved"
    | "rejected"
    | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-neutral-800">マイページ</h1>
        <Link href="/mypage/edit">
          <Button variant="outline" size="sm">
            編集する
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} />
              ) : null}
              <AvatarFallback>
                {profile?.display_name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-neutral-800">
                {profile?.display_name ?? "未設定"}
              </p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm">
            <div>
              <p className="text-xs text-neutral-500 mb-1">自己紹介</p>
              <p className="text-neutral-700 whitespace-pre-wrap">
                {profile?.bio || "未設定"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">性別</p>
                <p className="text-neutral-700">
                  {profile?.gender ? GENDER_LABELS[profile.gender] : "未設定"}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">生年月日</p>
                <p className="text-neutral-700">
                  {profile?.birth_date ?? "未設定"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">本人確認</CardTitle>
          {verificationStatus === "approved" && (
            <Badge variant="default">承認済み</Badge>
          )}
          {verificationStatus === "pending" && (
            <Badge variant="secondary">審査中</Badge>
          )}
          {verificationStatus === "rejected" && (
            <Badge variant="destructive">却下</Badge>
          )}
          {(!verificationStatus || verificationStatus === "unverified") && (
            <Badge variant="outline">未提出</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            ツアー参加には本人確認書類のご提出が必要です。
            運転免許証、パスポート、マイナンバーカード（表面のみ）などをご提出ください。
          </p>
          {(verificationStatus === "unverified" ||
            !verificationStatus ||
            verificationStatus === "rejected") && (
            <Link href="/mypage/id-upload">
              <Button size="sm">本人確認書類を提出する</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
