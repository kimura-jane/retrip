import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";
import { AvatarUploadForm } from "./avatar-upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Gender } from "@/types/database";

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
  avatar_url: string | null;
};

export default async function MyPageEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("display_name,bio,gender,birth_date,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-serif text-3xl text-neutral-800">プロフィール編集</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">アイコン画像</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploadForm
            currentAvatarUrl={profile?.avatar_url ?? null}
            displayName={profile?.display_name ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm
            initialValues={{
              displayName: profile?.display_name ?? "",
              bio: profile?.bio ?? "",
              gender: profile?.gender ?? "",
              birthDate: profile?.birth_date ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
