"use client";

import { useState, useTransition } from "react";
import { updateChatThemeAction } from "@/features/user/actions";
import type { ChatThemeColor, ChatFont } from "@/types/database";

type Props = {
  initialColor: ChatThemeColor;
  initialFont: ChatFont;
};

const COLORS: { value: ChatThemeColor; label: string; swatch: string }[] = [
  { value: "coral", label: "Coral", swatch: "#C8856B" },
  { value: "sage", label: "Sage", swatch: "#6B7A5A" },
  { value: "ink", label: "Ink", swatch: "#2A2826" },
  { value: "paper", label: "Paper", swatch: "#F7F4EE" },
  { value: "sora", label: "Sora", swatch: "#8FA3B5" },
];

const FONTS: { value: ChatFont; label: string; className: string }[] = [
  { value: "sans", label: "Sans", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "display", label: "Display", className: "font-display italic" },
  { value: "rounded", label: "Rounded", className: "font-sans" },
];

export function ChatThemeForm({ initialColor, initialFont }: Props) {
  const [color, setColor] = useState<ChatThemeColor>(initialColor);
  const [font, setFont] = useState<ChatFont>(initialFont);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      await updateChatThemeAction({ chat_theme_color: color, chat_font: font });
      setSavedAt(Date.now());
    });
  };

  return (
    <div className="space-y-10">
      {/* カラー */}
      <div>
        <p className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-4">
          Color
        </p>
        <div className="flex flex-wrap gap-4">
          {COLORS.map((c) => {
            const selected = color === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className="flex flex-col items-center gap-2 group"
              >
                <span
                  className={`block h-8 w-8 transition-all ${
                    selected
                      ? "ring-2 ring-offset-4 ring-offset-paper-100 ring-ink-900"
                      : "ring-1 ring-[#E5E0D8] group-hover:ring-ink-500"
                  }`}
                  style={{ backgroundColor: c.swatch }}
                />
                <span
                  className={`text-[10px] font-display italic uppercase tracking-widest2 ${
                    selected ? "text-ink-900" : "text-ink-500"
                  }`}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* フォント */}
      <div>
        <p className="font-display italic uppercase tracking-widest2 text-[10px] text-ink-500 mb-4">
          Font
        </p>
        <div className="space-y-2">
          {FONTS.map((f) => {
            const selected = font === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFont(f.value)}
                className={`block w-full text-left px-5 py-4 border transition-colors ${
                  selected
                    ? "border-ink-900 bg-paper-50"
                    : "border-[#E5E0D8] hover:border-ink-500"
                }`}
              >
                <p
                  className={`text-[10px] font-display italic uppercase tracking-widest2 mb-1.5 ${
                    selected ? "text-coral-700" : "text-ink-500"
                  }`}
                >
                  {f.label}
                </p>
                <p className={`${f.className} text-lg text-ink-900`}>
                  あいうえお Re:Trip
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 保存 */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 transition-colors px-6 py-2.5 text-xs font-display italic uppercase tracking-widest2 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {savedAt && !isPending && (
          <span className="text-xs text-ink-500 font-light">保存しました</span>
        )}
      </div>
    </div>
  );
}
