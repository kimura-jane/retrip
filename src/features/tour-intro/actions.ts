"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AgeGroup, Gender } from "@/types/database";

export type TourIntroResult =
  | { success: true }
  | { success: false; error: string };

const AGE_GROUPS: AgeGroup[] = [
  "twenties",
  "thirties",
  "forties",
  "fifties",
  "sixties_plus",
  "no_answer",
];

const GENDERS: Gender[] = ["male", "female", "other", "prefer_not_to_say"];

type IntroPayload = {
  tour_id: string;
  user_id: string;
  nickname: string;
  age_group: AgeGroup;
  gender: Gender;
  occupation: string | null;
  hobbies: string | null;
  spot: string | null;
  message: string | null;
  updated_at: string;
};

// 自己紹介の作成・更新（1ツアー1ユーザー1件。upsert）
export async function saveTourIntroAction(
  tourId: string,
  roomId: string,
  formData: FormData
): Promise<TourIntroResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  const nickname = String(formData.get("nickname") ?? "").trim();
  if (!nickname) {
    return { success: false, error: "ニックネームを入力してください" };
  }
  if (nickname.length > 40) {
    return { success: false, error: "ニックネームは40文字以下にしてください" };
  }

  const ageRaw = String(formData.get("age_group") ?? "no_answer");
  const genderRaw = String(formData.get("gender") ?? "prefer_not_to_say");
  const ageGroup: AgeGroup = AGE_GROUPS.includes(ageRaw as AgeGroup)
    ? (ageRaw as AgeGroup)
    : "no_answer";
  const gender: Gender = GENDERS.includes(genderRaw as Gender)
    ? (genderRaw as Gender)
    : "prefer_not_to_say";

  const occupation = String(formData.get("occupation") ?? "").trim();
  const hobbies = String(formData.get("hobbies") ?? "").trim();
  const spot = String(formData.get("spot") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (occupation.length > 100 || hobbies.length > 300 || spot.length > 200 || message.length > 500) {
    return { success: false, error: "入力が長すぎる項目があります" };
  }

  const payload: IntroPayload = {
    tour_id: tourId,
    user_id: user.id,
    nickname,
    age_group: ageGroup,
    gender,
    occupation: occupation || null,
    hobbies: hobbies || null,
    spot: spot || null,
    message: message || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("tour_introductions")
    .upsert(payload as never, { onConflict: "tour_id,user_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}
