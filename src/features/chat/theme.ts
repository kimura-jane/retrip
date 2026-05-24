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
  coral: {
    myBubbleBg: "bg-coral-500",
    myBubbleText: "text-paper-50",
    chatBg: "bg-[#FBF6F1]",
    accentBorder: "bg-coral-500",
    focusRing: "focus:ring-coral-500/30 focus:border-coral-500",
  },
  sage: {
    myBubbleBg: "bg-sage-500",
    myBubbleText: "text-paper-50",
    chatBg: "bg-[#F2F4EE]",
    accentBorder: "bg-sage-500",
    focusRing: "focus:ring-sage-500/30 focus:border-sage-500",
  },
  ink: {
    myBubbleBg: "bg-ink-900",
    myBubbleText: "text-paper-50",
    chatBg: "bg-[#F4F2EE]",
    accentBorder: "bg-ink-900",
    focusRing: "focus:ring-ink-900/30 focus:border-ink-900",
  },
  paper: {
    myBubbleBg: "bg-[#E8E2D4]",
    myBubbleText: "text-ink-900",
    chatBg: "bg-paper-50",
    accentBorder: "bg-[#E8E2D4]",
    focusRing: "focus:ring-ink-500/30 focus:border-ink-500",
  },
  sora: {
    myBubbleBg: "bg-[#8FA3B5]",
    myBubbleText: "text-paper-50",
    chatBg: "bg-[#EEF1F4]",
    accentBorder: "bg-[#8FA3B5]",
    focusRing: "focus:ring-[#8FA3B5]/30 focus:border-[#8FA3B5]",
  },
};

export const CHAT_FONTS: Record<ChatFont, ChatFontDefinition> = {
  sans: { className: "font-sans", label: "Sans" },
  serif: { className: "font-serif", label: "Serif" },
  display: { className: "font-display italic", label: "Display" },
  rounded: { className: "font-sans", label: "Rounded" },
};

export function getTheme(color: ChatThemeColor | null | undefined): ChatThemeDefinition {
  return CHAT_THEMES[color ?? "coral"] ?? CHAT_THEMES.coral;
}

export function getFont(font: ChatFont | null | undefined): ChatFontDefinition {
  return CHAT_FONTS[font ?? "sans"] ?? CHAT_FONTS.sans;
}
