import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdUploadForm } from "./id-upload-form";

export default async function IdUploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-neutral-800">本人確認書類の提出</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          下記いずれかの書類を撮影し、画像をアップロードしてください。
        </p>
      </div>

      <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 space-y-2 text-sm text-neutral-700">
        <p className="font-medium">提出可能な書類</p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600">
          <li>運転免許証</li>
          <li>パスポート</li>
          <li>マイナンバーカード（表面のみ）</li>
        </ul>
        <p className="text-xs text-neutral-500 pt-2">
          ※ マイナンバーカードの裏面（個人番号）は絶対に撮影しないでください
        </p>
      </div>

      <IdUploadForm />

      <Link
        href="/mypage"
        className="inline-block text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← マイページに戻る
      </Link>
    </div>
  );
}
