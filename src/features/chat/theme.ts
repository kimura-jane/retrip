import type { ChatThemeColor, ChatFont } from "@/types/database";

// ===========================================
// テーマカラー定義
// ===========================================

export type ChatThemeDefinition = {
  key: ChatThemeColor;
  label: string;
  // 自分の吹き出し背景
  myBubbleBg: string;
  myBubbleText: string;
  // チャット背景
  chatBg: string;
  // ヘッダーのアクセント
  accentBorder: string;
  // 入力欄フォーカス時のリング色
  focusRing: string;
};

export const CHAT_THEMES: Record<ChatThemeColor, ChatThemeDefinition> = {
  green: {
    key: "green",
    label: "リトリップ（緑）",
    myBubbleBg: "bg-[#A8D547]",
    myBubbleText: "text-white",
    chatBg: "bg-[#F5F6F0]",
    accentBorder: "border-[#A8D547]",
    focusRing: "focus:ring-[#A8D547]/30 focus:border-[#A8D547]",
  },
  blue: {
    key: "blue",
    label: "そらいろ（青）",
    myBubbleBg: "bg-[#5BA4E6]",
    myBubbleText: "text-white",
    chatBg: "bg-[#EEF4FA]",
    accentBorder: "border-[#5BA4E6]",
    focusRing: "focus:ring-[#5BA4E6]/30 focus:border-[#5BA4E6]",
  },
  pink: {
    key: "pink",
    label: "さくら（桃）",
    myBubbleBg: "bg-[#F08FB0]",
    myBubbleText: "text-white",
    chatBg: "bg-[#FBF1F4]",
    accentBorder: "border-[#F08FB0]",
    focusRing: "focus:ring-[#F08FB0]/30 focus:border-[#F08FB0]",
  },
  purple: {
    key: "purple",
    label: "ふじ（紫）",
    myBubbleBg: "bg-[#9B7AC9]",
    myBubbleText: "text-white",
    chatBg: "bg-[#F2EFF7]",
    accentBorder: "border-[#9B7AC9]",
    focusRing: "focus:ring-[#9B7AC9]/30 focus:border-[#9B7AC9]",
  },
  orange: {
    key: "orange",
    label: "ゆうやけ（橙）",
    myBubbleBg: "bg-[#F0A050]",
    myBubbleText: "text-white",
    chatBg: "bg-[#FBF3EA]",
    accentBorder: "border-[#F0A050]",
    focusRing: "focus:ring-[#F0A050]/30 focus:border-[#F0A050]",
  },
};

// ===========================================
// フォント定義
// ===========================================

export type ChatFontDefinition = {
  key: ChatFont;
  label: string;
  className: string;
};

export const CHAT_FONTS: Record<ChatFont, ChatFontDefinition> = {
  sans: {
    key: "sans",
    label: "ゴシック（標準）",
    className: "font-sans",
  },
  serif: {
    key: "serif",
    label: "明朝（上品）",
    className: "font-serif",
  },
  rounded: {
    key: "rounded",
    label: "丸ゴシック（やさしい）",
    className: "font-rounded",
  },
  mincho: {
    key: "mincho",
    label: "細明朝（しなやか）",
    className: "font-mincho",
  },
  pop: {
    key: "pop",
    label: "ポップ（楽しい）",
    className: "font-pop",
  },
};

// ===========================================
// ヘルパー
// ===========================================

export function getTheme(color: ChatThemeColor | null | undefined): ChatThemeDefinition {
  return CHAT_THEMES[color ?? "green"] ?? CHAT_THEMES.green;
}

export function getFont(font: ChatFont | null | undefined): ChatFontDefinition {
  return CHAT_FONTS[font ?? "sans"] ?? CHAT_FONTS.sans;
}
