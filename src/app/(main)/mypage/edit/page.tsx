import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";
import type { Gender } from "@/types/database";

type ProfileRow = {
  display_name: string | null;
  bio: string | null;
  gender: Gender | null;
  birth_date: string | null;
};

export default async function MyPageEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("display_name,bio,gender,birth_date")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-serif text-3xl text-neutral-800">プロフィール編集</h1>
      <ProfileEditForm
        initialValues={{
          displayName: profile?.display_name ?? "",
          bio: profile?.bio ?? "",
          gender: profile?.gender ?? "",
          birthDate: profile?.birth_date ?? "",
        }}
      />
    </div>
  );
}
