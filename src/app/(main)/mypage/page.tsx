import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GENDER_LABELS } from "@/features/user/schema";
import { ChatThemeForm } from "./chat-theme-form";
import type { Gender, ChatThemeColor, ChatFont } from "@/types/database";

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
  avatar_url: string | null;
  id_document_url: string | null;
  id_verified: boolean | null;
  chat_theme_color: ChatThemeColor | null;
  chat_font: ChatFont | null;
};

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select(
      "display_name,bio,gender,birth_date,avatar_url,id_document_url,id_verified,chat_theme_color,chat_font"
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;

  const hasSubmittedId = !!profile?.id_document_url;
  const isVerified = profile?.id_verified === true;

  let verificationLabel: { text: string; variant: "default" | "secondary" | "outline" };
  if (isVerified) {
    verificationLabel = { text: "承認済み", variant: "default" };
  } else if (hasSubmittedId) {
    verificationLabel = { text: "審査中", variant: "secondary" };
  } else {
    verificationLabel = { text: "未提出", variant: "outline" };
  }

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
          <Badge variant={verificationLabel.variant}>
            {verificationLabel.text}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            ツアー参加には本人確認書類のご提出が必要です。
            運転免許証、パスポート、マイナンバーカード（表面のみ）などをご提出ください。
          </p>
          {!isVerified && !hasSubmittedId && (
            <Link href="/mypage/id-upload">
              <Button size="sm">本人確認書類を提出する</Button>
            </Link>
          )}
          {!isVerified && hasSubmittedId && (
            <p className="text-xs text-neutral-500">
              書類を確認中です。承認まで1〜3営業日いただきます。
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャットの見た目</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatThemeForm
            initialColor={profile?.chat_theme_color ?? "green"}
            initialFont={profile?.chat_font ?? "sans"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
