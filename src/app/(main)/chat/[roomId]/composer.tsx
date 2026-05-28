"use client";

import { useState, useTransition } from "react";
import { createPollAction } from "@/features/poll/actions";

type Props = {
  roomId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function PollComposer({ roomId, onClose, onCreated }: Props) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((o, i) => (i === index ? value : o)));
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createPollAction(roomId, question, options);
      if (result.success) {
        onCreated();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-paper-100 sm:border sm:border-[#E5E0D8] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-paper-100 border-b border-[#E5E0D8] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
              New Poll
            </p>
            <h2 className="mt-1 font-serif text-lg text-ink-900 tracking-wide">
              投票を作る
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-xl leading-none transition-colors"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
              質問
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="例：このスポットに行きたい？"
              className="w-full bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition resize-none"
              style={{ fontSize: "16px" }}
            />
            <p className="text-[11px] text-ink-500 font-light text-right">
              {question.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
              選択肢（2〜6個）
            </label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-display italic text-[11px] tracking-widest2 text-coral-700 w-6 flex-shrink-0">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  maxLength={80}
                  placeholder={`選択肢 ${i + 1}`}
                  className="flex-1 bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
                  style={{ fontSize: "16px" }}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-ink-500 hover:text-coral-700 text-lg leading-none w-6 flex-shrink-0 transition-colors"
                    aria-label={`選択肢 ${i + 1} を削除`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-[11px] tracking-[0.15em] uppercase text-coral-700 hover:text-coral-500 transition-colors"
              >
                ＋ 選択肢を追加
              </button>
            )}
          </div>

          {error && (
            <div className="border border-coral-300 bg-coral-50 px-3 py-2">
              <p className="text-[12px] text-coral-700 font-light">{error}</p>
            </div>
          )}

          <p className="text-[11px] text-ink-500 font-light leading-relaxed">
            投票は匿名で表示されます。投票後にいつでも変更・取り消しができます。
          </p>
        </div>

        <div className="sticky bottom-0 bg-paper-100 border-t border-[#E5E0D8] px-5 py-4 flex items-center gap-3 pb-safe">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-coral-500 hover:bg-coral-700 text-paper-100 text-[13px] tracking-[0.15em] px-6 py-3 transition disabled:opacity-50"
          >
            {isPending ? "投稿中..." : "投票を投稿"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
