import type { ChatThemeColor, ChatFont } from "@/types/database";

export type ChatThemeDefinition = {
  myBubbleBg: string;
  myBubbleText: string;
  chatBg: string;
  accentBorder: string;
  focusRing: string;
};

export type ChatFontDefinition = {
  className: string;
  label: string;
};

export const CHAT_THEMES: Record<ChatThemeColor, ChatThemeDefinition> = {
  green: {
    myBubbleBg: "bg-brand-500",
    myBubbleText: "text-white",
    chatBg: "bg-[#F5F6F0]",
    accentBorder: "bg-brand-500",
    focusRing: "focus:ring-brand-500/30 focus:border-brand-500",
  },
  blue: {
    myBubbleBg: "bg-sky-500",
    myBubbleText: "text-white",
    chatBg: "bg-[#EEF4F8]",
    accentBorder: "bg-sky-500",
    focusRing: "focus:ring-sky-500/30 focus:border-sky-500",
  },
  pink: {
    myBubbleBg: "bg-pink-400",
    myBubbleText: "text-white",
    chatBg: "bg-[#FAF1F3]",
    accentBorder: "bg-pink-400",
    focusRing: "focus:ring-pink-400/30 focus:border-pink-400",
  },
  purple: {
    myBubbleBg: "bg-purple-500",
    myBubbleText: "text-white",
    chatBg: "bg-[#F4F1F8]",
    accentBorder: "bg-purple-500",
    focusRing: "focus:ring-purple-500/30 focus:border-purple-500",
  },
  orange: {
    myBubbleBg: "bg-orange-400",
    myBubbleText: "text-white",
    chatBg: "bg-[#FAF4ED]",
    accentBorder: "bg-orange-400",
    focusRing: "focus:ring-orange-400/30 focus:border-orange-400",
  },
};

export const CHAT_FONTS: Record<ChatFont, ChatFontDefinition> = {
  sans: { className: "font-sans", label: "標準（ゴシック）" },
  serif: { className: "font-serif", label: "明朝" },
  rounded: { className: "font-rounded", label: "丸ゴシック" },
  mincho: { className: "font-mincho", label: "細明朝" },
  pop: { className: "font-pop", label: "ポップ" },
};

export function getTheme(color: ChatThemeColor | null | undefined): ChatThemeDefinition {
  return CHAT_THEMES[color ?? "green"] ?? CHAT_THEMES.green;
}

export function getFont(font: ChatFont | null | undefined): ChatFontDefinition {
  return CHAT_FONTS[font ?? "sans"] ?? CHAT_FONTS.sans;
}
