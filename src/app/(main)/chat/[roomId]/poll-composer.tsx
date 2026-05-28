"use client";

import { useState, useTransition } from "react";
import { createPoll } from "@/features/poll/actions";

type Props = {
  roomId: string;
  onCreated?: () => void;
  onCancel?: () => void;
};

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

export function PollComposer({ roomId, onCreated, onCancel }: Props) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
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

    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (trimmedOptions.length < MIN_OPTIONS) {
      setError(`選択肢は最低${MIN_OPTIONS}個必要です`);
      return;
    }
    if (trimmedOptions.length > MAX_OPTIONS) {
      setError(`選択肢は最大${MAX_OPTIONS}個までです`);
      return;
    }

    const unique = new Set(trimmedOptions);
    if (unique.size !== trimmedOptions.length) {
      setError("選択肢が重複しています");
      return;
    }

    startTransition(async () => {
      const result = await createPoll({
        roomId,
        question: trimmedQuestion,
        options: trimmedOptions,
        allowMultiple,
      });

      if (!result.ok) {
        setError(result.error ?? "投票の作成に失敗しました");
        return;
      }

      setQuestion("");
      setOptions(["", ""]);
      setAllowMultiple(false);
      onCreated?.();
    });
  };

  return (
    <div className="border border-[#E5E0D8] bg-[#F7F4EE] p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-cormorant italic text-xs text-[#C8856B] tracking-wider">
            Anonymous Poll
          </p>
          <h3 className="font-serif text-base text-[#2A2826] mt-0.5">
            匿名投票をつくる
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[#6B6562] underline underline-offset-2"
          >
            キャンセル
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs text-[#6B6562]">お題</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例：次の集合時間どれがいい？"
          maxLength={140}
          className="w-full border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#2A2826] placeholder:text-[#B8B2AC] focus:border-[#C8856B] focus:outline-none"
          disabled={isPending}
        />
        <p className="text-[10px] text-[#B8B2AC] text-right">{question.length}/140</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-[#6B6562]">
          選択肢（{MIN_OPTIONS}〜{MAX_OPTIONS}個）
        </label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <span className="font-cormorant italic text-xs text-[#C8856B] w-5 text-center">
              {String.fromCharCode(65 + index)}
            </span>
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`選択肢 ${index + 1}`}
              maxLength={60}
              className="flex-1 border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#2A2826] placeholder:text-[#B8B2AC] focus:border-[#C8856B] focus:outline-none"
              disabled={isPending}
            />
            {options.length > MIN_OPTIONS && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                disabled={isPending}
                className="text-xs text-[#6B6562] px-2 py-1 border border-[#E5E0D8] bg-white hover:bg-[#F0EBE3]"
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
            className="w-full border border-dashed border-[#C8856B] text-[#C8856B] text-xs py-2 hover:bg-[#FBF6F1]"
          >
            ＋ 選択肢を追加
          </button>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-[#2A2826] cursor-pointer">
        <input
          type="checkbox"
          checked={allowMultiple}
          onChange={(e) => setAllowMultiple(e.target.checked)}
          disabled={isPending}
          className="accent-[#C8856B]"
        />
        複数選択を許可する
      </label>

      {error && (
        <p className="text-xs text-[#B8543E] border-l-2 border-[#B8543E] pl-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2 border-t border-[#E5E0D8]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 bg-[#2A2826] text-[#F7F4EE] text-sm py-2.5 font-serif tracking-wider hover:bg-[#3A3836] disabled:opacity-50"
        >
          {isPending ? "作成中…" : "投票を投稿する"}
        </button>
      </div>

      <p className="text-[10px] text-[#B8B2AC] leading-relaxed">
        ※ 誰が何に投票したかは他のメンバーには表示されません（運営の管理画面では記録されます）。締切なし・投票後の変更可。
      </p>
    </div>
  );
}
