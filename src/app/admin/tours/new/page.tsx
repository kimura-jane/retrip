import Link from "next/link";
import { TourForm } from "../tour-form";

export default function NewTourPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* パンくず */}
      <div>
        <Link
          href="/admin/tours"
          className="text-[11px] tracking-[0.15em] uppercase text-ink-500 hover:text-coral-700 transition"
        >
          ← Tours
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="border-b border-line pb-6">
        <p className="font-display italic text-[12px] tracking-widest2 uppercase text-coral-700">
          New Tour
        </p>
        <h1 className="mt-2 font-serif text-2xl sm:text-3xl tracking-[0.04em] text-ink-900">
          ツアーを作成
        </h1>
        <p className="mt-3 text-[13px] font-light text-ink-500 leading-loose2">
          下書き状態で保存すると、サイト上には公開されません。
        </p>
      </div>

      <TourForm mode="create" />
    </div>
  );
}
