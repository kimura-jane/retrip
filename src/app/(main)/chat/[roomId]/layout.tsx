import type { ReactNode } from "react";

export default function ChatRoomLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        html, body { 
          position: fixed; 
          overflow: hidden; 
          width: 100%; 
          height: 100%;
          overscroll-behavior: none;
        }
        footer { display: none !important; }
        [data-bottom-nav] { display: none !important; }
      `}</style>
      <div className="-mx-6 -my-8">{children}</div>
    </>
  );
}
