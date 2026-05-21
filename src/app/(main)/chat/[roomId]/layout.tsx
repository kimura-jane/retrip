import type { ReactNode } from "react";

/**
 * チャット詳細ページ専用レイアウト。
 * 親の (main)/layout.tsx が max-w-5xl + px-6 + py-8 を当てているので、
 * ここで打ち消して画面全幅・余白なしにする。
 */
export default function ChatRoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-6 -my-8 sm:-mx-6 sm:-my-8">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}
