"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  unreadTotal: number;
};

export function BottomNav({ unreadTotal }: Props) {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/tours");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const badgeLabel =
    unreadTotal > 99 ? "99+" : unreadTotal > 0 ? String(unreadTotal) : null;

  return (
    <nav
      data-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-paper-100/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-3 h-16">
        <li>
          <Link
            href="/"
            className={`flex flex-col items-center justify-center h-full gap-1 transition-colors ${
              isActive("/") ? "text-coral-500" : "text-ink-600 hover:text-coral-500"
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span className="font-display italic text-[10px] tracking-widest2 uppercase">
              Home
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/chat"
            className={`flex flex-col items-center justify-center h-full gap-1 transition-colors ${
              isActive("/chat") ? "text-coral-500" : "text-ink-600 hover:text-coral-500"
            }`}
          >
            <span className="relative">
              <ChatIcon className="h-5 w-5" />
              {badgeLabel && (
                <span className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-semibold text-paper-50 leading-none">
                  {badgeLabel}
                </span>
              )}
            </span>
            <span className="font-display italic text-[10px] tracking-widest2 uppercase">
              Chat
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/mypage"
            className={`flex flex-col items-center justify-center h-full gap-1 transition-colors ${
              isActive("/mypage") ? "text-coral-500" : "text-ink-600 hover:text-coral-500"
            }`}
          >
            <UserIcon className="h-5 w-5" />
            <span className="font-display italic text-[10px] tracking-widest2 uppercase">
              Mypage
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

// ===== シンプルな SVG アイコン群（外部ライブラリ依存を避ける） =====

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5Z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
