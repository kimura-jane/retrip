"use client";

import { useState, useTransition } from "react";
import { updateChatThemeAction } from "@/features/chat/theme-actions";
import { CHAT_THEMES, CHAT_FONTS } from "@/features/chat/theme";
import type { ChatThemeColor, ChatFont } from "@/types/database";
import { Button } from "@/components/ui/button";

type Props = {
  initialColor: ChatThemeColor;
  initialFont: ChatFont;
};

const COLOR_LABELS: Record<ChatThemeColor, string> = {
  green: "グリーン",
  blue: "ブルー",
  pink: "ピンク",
  purple: "パープル",
  orange: "オレンジ",
};

// プレビュー用の生カラー（Tailwind の bg-* クラスと対応）
const COLOR_SWATCH: Record<ChatThemeColor, string> = {
  green: "#7BA05B",
  blue: "#0EA5E9",
  pink: "#F472B6",
  purple: "#A855F7",
  orange: "#FB923C",
};

export function ChatThemeForm({ initialColor, initialFont }: Props) {
  const [color, setColor] = useState<ChatThemeColor>(initialColor);
  const [font, setFont] = useState<ChatFont>(initialFont);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const dirty = color !== initialColor || font !== initialFont;

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateChatThemeAction(color, font);
      if (result.success) {
        setMessage("保存しました");
      } else {
        setMessage(result.error);
      }
    });
  };

  const theme = CHAT_THEMES[color];
  const fontDef = CHAT_FONTS[font];

  return (
    <div className="space-y-6">
      {/* プレビュー */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">プレビュー</p>
        <div className={`rounded-lg p-4 ${theme.chatBg} ${fontDef.className}`}>
          <div className="flex justify-end mb-2">
            <div className={`px-3 py-2 rounded-2xl text-sm max-w-[70%] ${theme.myBubbleBg} ${theme.myBubbleText}`}>
              これは私のメッセージです
            </div>
          </div>
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl text-sm max-w-[70%] bg-white text-neutral-800 border border-neutral-200">
              これは相手のメッセージです
            </div>
          </div>
        </div>
      </div>

      {/* カラー選択 */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">テーマカラー</p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(CHAT_THEMES) as ChatThemeColor[]).map((c) => {
            const selected = c === color;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${
                  selected
                    ? "border-neutral-800 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
                aria-pressed={selected}
              >
                <span
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: COLOR_SWATCH[c] }}
                />
                <span className="text-[10px] text-neutral-600">
                  {COLOR_LABELS[c]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* フォント選択 */}
      <div>
        <p className="text-sm font-medium text-neutral-700 mb-3">フォント</p>
        <div className="space-y-2">
          {(Object.keys(CHAT_FONTS) as ChatFont[]).map((f) => {
            const selected = f === font;
            const def = CHAT_FONTS[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFont(f)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                  selected
                    ? "border-neutral-800 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-400"
                } ${def.className}`}
                aria-pressed={selected}
              >
                <span className="text-sm text-neutral-800">{def.label}</span>
                <span className="text-xs text-neutral-500">
                  あいうえお Abc 123
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          size="sm"
        >
          {isPending ? "保存中..." : "保存する"}
        </Button>
        {message && (
          <span className="text-xs text-neutral-600">{message}</span>
        )}
      </div>
    </div>
  );
}
