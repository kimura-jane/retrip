"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTourAction,
  updateTourAction,
  type TourInput,
} from "@/features/tour/admin-actions";
import type {
  TourType,
  TourStatus,
  MeetingPoint,
} from "@/types/database";

// ============================================
// Props
// ============================================

type Props = {
  mode: "create" | "edit";
  tourId?: string;
  initial?: TourInput;
};

// ============================================
// 初期値
// ============================================

const EMPTY_INITIAL: TourInput = {
  title: "",
  description: "",
  tour_type: "day_trip",
  destination: "",
  departure_date: "",
  return_date: "",
  meeting_points: [
    { id: "mp1", name: "", time: "", note: "" },
  ],
  price: 0,
  capacity_total: 6,
  capacity_male: 3,
  capacity_female: 3,
  age_range_min: 28,
  age_range_max: 42,
  theme_tags: [],
  status: "draft",
  cover_image_url: null,
};

// ISO 文字列 → datetime-local の value（YYYY-MM-DDTHH:mm）
function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local の value → ISO 文字列
function localToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

// ランダム ID（meeting_point 用）
function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// 本体
// ============================================

export function TourForm({ mode, tourId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<TourInput>(initial ?? EMPTY_INITIAL);
  const [tagsInput, setTagsInput] = useState<string>(
    (initial ?? EMPTY_INITIAL).theme_tags.join(", ")
  );

  // ----- フィールド更新ヘルパー -----
  const update = <K extends keyof TourInput>(key: K, value: TourInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ----- meeting_points 操作 -----
  const updateMeetingPoint = (
    index: number,
    key: keyof MeetingPoint,
    value: string
  ) => {
    setForm((prev) => {
      const next = prev.meeting_points.map((mp, i) =>
        i === index ? { ...mp, [key]: value } : mp
      );
      return { ...prev, meeting_points: next };
    });
  };

  const addMeetingPoint = () => {
    setForm((prev) => ({
      ...prev,
      meeting_points: [
        ...prev.meeting_points,
        {
          id: genId(),
          name: "",
          time: "",
          note: "",
        },
      ],
    }));
  };

  const removeMeetingPoint = (index: number) => {
    setForm((prev) => ({
      ...prev,
      meeting_points: prev.meeting_points.filter((_, i) => i !== index),
    }));
  };

  // ----- submit -----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // tags の string → array
    const tags = tagsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: TourInput = {
      ...form,
      theme_tags: tags,
      departure_date: form.departure_date,
      return_date: form.return_date,
    };

    // バリデーション（最低限）
    if (!payload.title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (!payload.destination.trim()) {
      setError("目的地を入力してください");
      return;
    }
    if (!payload.departure_date || !payload.return_date) {
      setError("出発日時・帰着日時を入力してください");
      return;
    }
    if (payload.meeting_points.length === 0) {
      setError("集合場所を1つ以上追加してください");
      return;
    }
    if (payload.meeting_points.some((mp) => !mp.name.trim() || !mp.time.trim())) {
      setError("集合場所の名称と時刻はすべて入力してください");
      return;
    }

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createTourAction(payload)
          : await updateTourAction(tourId!, payload);

      if (!res.success) {
        setError(res.error);
        return;
      }

      if (mode === "create") {
        router.push(`/admin/tours/${res.tourId}/edit`);
      } else {
        router.refresh();
      }
    });
  };

  // ============================================
  // レンダリング
  // ============================================

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* セクション：基本情報 */}
      <section className="space-y-5">
        <SectionTitle eyebrow="Basics" title="基本情報" />

        <Field label="タイトル">
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputCls}
            placeholder="例：湖畔のひととき"
          />
        </Field>

        <Field label="ステータス">
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as TourStatus)}
            className={inputCls}
          >
            <option value="draft">下書き</option>
            <option value="recruiting">募集中</option>
            <option value="closed">締切</option>
            <option value="completed">終了</option>
            <option value="cancelled">中止</option>
          </select>
        </Field>

        <Field label="ツアー種別">
          <select
            value={form.tour_type}
            onChange={(e) => update("tour_type", e.target.value as TourType)}
            className={inputCls}
          >
            <option value="day_trip">日帰り</option>
            <option value="overnight">1泊以上</option>
          </select>
        </Field>

        <Field label="目的地">
          <input
            type="text"
            value={form.destination}
            onChange={(e) => update("destination", e.target.value)}
            className={inputCls}
            placeholder="例：神奈川県・芦ノ湖"
          />
        </Field>

        <Field
          label="本文"
          hint="複数行可。改行はそのまま表示されます。"
        >
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={8}
            className={`${inputCls} resize-y leading-relaxed`}
            placeholder="ツアーの紹介文..."
          />
        </Field>

        <Field label="カバー画像 URL" hint="Supabase Storage または Unsplash 等の直リンク">
          <input
            type="url"
            value={form.cover_image_url ?? ""}
            onChange={(e) =>
              update("cover_image_url", e.target.value || null)
            }
            className={inputCls}
            placeholder="https://..."
          />
          {form.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.cover_image_url}
              alt="プレビュー"
              className="mt-3 w-full max-w-sm aspect-[4/5] object-cover bg-paper-200"
            />
          )}
        </Field>
      </section>

      {/* セクション：日程 */}
      <section className="space-y-5">
        <SectionTitle eyebrow="Schedule" title="日程" />

        <Field label="出発日時">
          <input
            type="datetime-local"
            value={isoToLocal(form.departure_date)}
            onChange={(e) =>
              update("departure_date", localToIso(e.target.value))
            }
            className={inputCls}
          />
        </Field>

        <Field label="帰着日時">
          <input
            type="datetime-local"
            value={isoToLocal(form.return_date)}
            onChange={(e) =>
              update("return_date", localToIso(e.target.value))
            }
            className={inputCls}
          />
        </Field>
      </section>

      {/* セクション：集合場所 */}
      <section className="space-y-5">
        <SectionTitle
          eyebrow="Meeting Points"
          title="集合場所"
          subtitle="先頭がメイン集合場所として扱われます。"
        />

        {form.meeting_points.map((mp, i) => (
          <div
            key={mp.id || i}
            className="border border-line bg-paper-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
                {i === 0 ? "Main" : `Point ${i + 1}`}
              </span>
              {form.meeting_points.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMeetingPoint(i)}
                  className="text-[11px] tracking-[0.1em] text-coral-700 hover:underline"
                >
                  削除
                </button>
              )}
            </div>

            <Field label="場所名">
              <input
                type="text"
                value={mp.name}
                onChange={(e) => updateMeetingPoint(i, "name", e.target.value)}
                className={inputCls}
                placeholder="例：新宿西口 集合"
              />
            </Field>

            <Field label="時刻">
              <input
                type="text"
                value={mp.time}
                onChange={(e) => updateMeetingPoint(i, "time", e.target.value)}
                className={inputCls}
                placeholder="例：07:30"
              />
            </Field>

            <Field label="補足" hint="任意">
              <input
                type="text"
                value={mp.note ?? ""}
                onChange={(e) => updateMeetingPoint(i, "note", e.target.value)}
                className={inputCls}
                placeholder="例：小田急百貨店前"
              />
            </Field>
          </div>
        ))}

        <button
          type="button"
          onClick={addMeetingPoint}
          className="text-[12px] tracking-[0.15em] uppercase text-coral-700 border border-line bg-paper-100 hover:bg-paper-200 px-4 py-2 transition"
        >
          ＋ 集合場所を追加
        </button>
      </section>

      {/* セクション：料金・定員 */}
      <section className="space-y-5">
        <SectionTitle eyebrow="Pricing" title="料金・定員" />

        <Field label="参加費（円）">
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update("price", Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <Field label="定員（合計）">
          <input
            type="number"
            min={1}
            value={form.capacity_total}
            onChange={(e) => update("capacity_total", Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="男性枠">
            <input
              type="number"
              min={0}
              value={form.capacity_male ?? 0}
              onChange={(e) =>
                update("capacity_male", Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
          <Field label="女性枠">
            <input
              type="number"
              min={0}
              value={form.capacity_female ?? 0}
              onChange={(e) =>
                update("capacity_female", Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="年齢下限">
            <input
              type="number"
              min={0}
              value={form.age_range_min ?? 0}
              onChange={(e) =>
                update("age_range_min", Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
          <Field label="年齢上限">
            <input
              type="number"
              min={0}
              value={form.age_range_max ?? 0}
              onChange={(e) =>
                update("age_range_max", Number(e.target.value))
              }
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* セクション：タグ */}
      <section className="space-y-5">
        <SectionTitle
          eyebrow="Tags"
          title="テーマタグ"
          subtitle="カンマ区切りで入力。「サンプル」を含めるとサンプル帯が出ます。"
        />
        <Field label="タグ">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={inputCls}
            placeholder="例：自然, 写真, 温泉"
          />
        </Field>
      </section>

      {/* エラー表示 */}
      {error && (
        <div className="border border-coral-300 bg-coral-50 px-4 py-3">
          <p className="text-[13px] text-coral-700">{error}</p>
        </div>
      )}

      {/* submit */}
      <div className="flex items-center gap-3 pt-6 border-t border-line">
        <button
          type="submit"
          disabled={isPending}
          className="bg-coral-500 hover:bg-coral-700 text-paper-100 text-[13px] tracking-[0.15em] px-8 py-3 transition disabled:opacity-50"
        >
          {isPending
            ? "保存中..."
            : mode === "create"
            ? "作成する"
            : "保存する"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/tours")}
          disabled={isPending}
          className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900 transition"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

// ============================================
// 小コンポーネント
// ============================================

const inputCls =
  "w-full bg-paper-50 border border-line px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-ink-500 font-light leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-line pb-3">
      <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 font-serif text-xl tracking-[0.04em] text-ink-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1.5 text-[12px] text-ink-500 font-light leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
