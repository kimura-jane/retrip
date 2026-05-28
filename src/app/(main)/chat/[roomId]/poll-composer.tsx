"use client";

import { useState, useTransition } from "react";
import { createPollAction } from "@/features/poll/actions";

type Props = {
  roomId: string;
  onClose: () => void;
  onCreated: () => void;
};

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

export function PollComposer({ roomId, onClose, onCreated }: Props) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setError(null);

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("お題を入力してください");
      return;
    }
    if (trimmedQuestion.length > 200) {
      setError("お題は200文字以内にしてください");
      return;
    }

    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (trimmedOptions.length < MIN_OPTIONS) {
      setError(`選択肢は最低${MIN_OPTIONS}個必要です`);
      return;
    }
    if (trimmedOptions.length > MAX_OPTIONS) {
      setError(`選択肢は最大${MAX_OPTIONS}個までです`);
      return;
    }
    if (trimmedOptions.some((o) => o.length > 80)) {
      setError("選択肢は80文字以内にしてください");
      return;
    }

    const unique = new Set(trimmedOptions);
    if (unique.size !== trimmedOptions.length) {
      setError("選択肢が重複しています");
      return;
    }

    startTransition(async () => {
      const result = await createPollAction(roomId, trimmedQuestion, trimmedOptions);

      if (!result.success) {
        setError(result.error ?? "投票の作成に失敗しました");
        return;
      }

      setQuestion("");
      setOptions(["", ""]);
      onCreated();
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-ink-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-paper-100 border border-[#E5E0D8] sm:rounded-none shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-[#E5E0D8] flex items-baseline justify-between">
          <div>
            <p className="font-display italic text-[11px] text-coral-500 tracking-widest2 uppercase">
              Anonymous Poll
            </p>
            <h3 className="font-serif text-base text-ink-900 mt-0.5">
              匿名投票をつくる
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-xs text-ink-500 underline underline-offset-2 disabled:opacity-40"
          >
            閉じる
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] text-ink-500 tracking-wide">
              お題
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例：次の集合時間どれがいい？"
              maxLength={200}
              className="w-full border border-[#E5E0D8] bg-paper-50 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 focus:border-coral-500 focus:outline-none"
              disabled={isPending}
              style={{ fontSize: "16px" }}
            />
            <p className="text-[10px] text-ink-500/70 text-right font-light">
              {question.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] text-ink-500 tracking-wide">
              選択肢（{MIN_OPTIONS}〜{MAX_OPTIONS}個）
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="font-display italic text-xs text-coral-500 w-5 text-center">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`選択肢 ${index + 1}`}
                  maxLength={80}
                  className="flex-1 border border-[#E5E0D8] bg-paper-50 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 focus:border-coral-500 focus:outline-none"
                  disabled={isPending}
                  style={{ fontSize: "16px" }}
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={isPending}
                    className="text-xs text-ink-500 px-2 py-1 border border-[#E5E0D8] bg-paper-50 hover:bg-paper-200 disabled:opacity-40"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                disabled={isPending}
                className="w-full border border-dashed border-coral-500 text-coral-500 text-xs py-2 hover:bg-coral-500/5 disabled:opacity-40 tracking-wide"
              >
                ＋ 選択肢を追加
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-coral-700 border-l-2 border-coral-500 pl-2 py-1 font-light">
              {error}
            </p>
          )}

          <div className="pt-2 border-t border-[#E5E0D8] space-y-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full bg-ink-900 text-paper-50 text-sm py-2.5 font-serif tracking-widest2 hover:bg-ink-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "作成中…" : "投票を投稿する"}
            </button>
            <p className="text-[10px] text-ink-500/70 leading-relaxed font-light">
              ※ 誰が何に投票したかは他のメンバーには表示されません（運営の管理画面では記録されます）。締切なし・投票後の変更可。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
