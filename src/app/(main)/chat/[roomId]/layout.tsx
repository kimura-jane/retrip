import type { ReactNode } from "react";

/**
 * チャット詳細ページ専用レイアウト。
 * 親の (main)/layout.tsx の余白を打ち消し、フッターも隠す。
 */
export default function ChatRoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-6 -my-8 [&~footer]:hidden">
      <style>{`footer { display: none !important; }`}</style>
      {children}
    </div>
  );
}
