import { z } from "zod";

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(1, { message: "ニックネームを入力してください" })
    .max(30, { message: "ニックネームは30文字以下で入力してください" }),
  bio: z
    .string()
    .max(500, { message: "自己紹介は500文字以下で入力してください" })
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    message: "性別を選択してください",
  }),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "正しい日付を入力してください" }),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  prefer_not_to_say: "回答しない",
};
