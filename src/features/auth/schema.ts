import { z } from "zod";

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "正しいメールアドレスの形式で入力してください" }),
  password: z
    .string()
    .min(8, { message: "パスワードは8文字以上で入力してください" })
    .max(72, { message: "パスワードは72文字以下で入力してください" }),
  displayName: z
    .string()
    .min(1, { message: "ニックネームを入力してください" })
    .max(30, { message: "ニックネームは30文字以下で入力してください" }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "正しいメールアドレスの形式で入力してください" }),
  password: z
    .string()
    .min(1, { message: "パスワードを入力してください" }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
