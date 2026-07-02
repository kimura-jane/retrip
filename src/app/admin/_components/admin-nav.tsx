"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/features/auth/actions";

type NavItem = {
  href: string;
  label: string; // 英字ラベル（eyebrow）
  title: string; // 日本語ラベル
  disabled?: boolean;
};

const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  {
    section: "Main",
    items: [
      { href: "/admin", label: "Top", title: "ダッシュボード" },
      { href: "/admin/tours", label: "Tours", title: "ツアー" },
      {
        href: "/admin/verifications",
        label: "Verify",
        title: "本人確認",
      },
      { href: "/admin/users", label: "Users", title: "ユーザー管理" },
    ],
  },
  {
    section: "Communication",
    items: [
      { href: "/chat", label: "Chat", title: "チャット" },
      {
        href: "/admin/contacts",
        label: "Contacts",
        title: "お問い合わせ",
        disabled: true,
      },
    ],
  },
  {
    section: "Other",
    items: [
      { href: "/", label: "Site", title: "サイトを見る" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 現在ページの日本語名を取得
  const currentTitle =
    NAV_GROUPS.flatMap((g) => g.items).find((item) =>
      isActive(item.href, pathname)
    )?.title ?? "";

  // ルート変更時にドロワーを閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ドロワー展開中は背景をスクロール禁止
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ヘッダー */}
      <header className="border-b border-line bg-paper-50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex flex-col leading-none flex-shrink-0">
            <span className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
              Re:Trip
            </span>
            <span className="mt-1 font-serif text-lg tracking-[0.06em] text-ink-900">
              Admin
            </span>
          </Link>

          {/* 現在ページ名（PCでは中央、モバイルでは非表示） */}
          {currentTitle && (
            <div className="hidden md:block flex-1 text-center">
              <p className="font-display italic text-[10px] tracking-widest2 uppercase text-ink-500">
                Current
              </p>
              <p className="mt-0.5 font-serif text-[14px] tracking-[0.04em] text-ink-900">
                {currentTitle}
              </p>
            </div>
          )}

          {/* ハンバーガーボタン */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="メニューを開く"
            aria-expanded={open}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-line bg-paper-100 hover:bg-paper-200 transition"
          >
            <span className="sr-only">メニュー</span>
            {open ? (
              <CloseIcon className="w-5 h-5 text-ink-900" />
            ) : (
              <MenuIcon className="w-5 h-5 text-ink-900" />
            )}
          </button>
        </div>
      </header>

      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ドロワー */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-paper-50 border-l border-line shadow-xl transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex flex-col h-full">
          {/* ドロワーヘッダー */}
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <div>
              <p className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
                Menu
              </p>
              <p className="mt-0.5 font-serif text-lg tracking-[0.06em] text-ink-900">
                管理メニュー
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="閉じる"
              className="w-9 h-9 flex items-center justify-center border border-line hover:bg-paper-100 transition"
            >
              <CloseIcon className="w-5 h-5 text-ink-900" />
            </button>
          </div>

          {/* リンク一覧 */}
          <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {NAV_GROUPS.map((group) => (
              <div key={group.section}>
                <p className="font-display italic text-[10px] tracking-widest2 uppercase text-ink-500 border-b border-line pb-2 mb-3">
                  {group.section}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href, pathname);
                    if (item.disabled) {
                      return (
                        <li key={item.href}>
                          <div className="px-3 py-3 flex items-center justify-between opacity-40 cursor-not-allowed">
                            <div>
                              <p className="font-display italic text-[10px] tracking-widest2 uppercase text-ink-500">
                                {item.label}
                              </p>
                              <p className="mt-0.5 font-serif text-[15px] tracking-[0.04em] text-ink-900">
                                {item.title}
                              </p>
                            </div>
                            <span className="text-[10px] tracking-widest2 uppercase text-ink-500 border border-line px-2 py-0.5">
                              Coming soon
                            </span>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`block px-3 py-3 transition ${
                            active
                              ? "bg-coral-500/10 border-l-2 border-coral-500 pl-4"
                              : "hover:bg-paper-100 border-l-2 border-transparent"
                          }`}
                        >
                          <p
                            className={`font-display italic text-[10px] tracking-widest2 uppercase ${
                              active ? "text-coral-700" : "text-ink-500"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="mt-0.5 font-serif text-[15px] tracking-[0.04em] text-ink-900">
                            {item.title}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* ドロワーフッター（ログアウト） */}
          <div className="border-t border-line px-6 py-5">
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-coral-700 border border-line px-4 py-3 hover:bg-paper-100 transition"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

// ========== helpers ==========

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  if (href === "/") {
    return false; // Site リンクは active 表示しない
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ========== icons ==========

function MenuIcon({ className }: { className?: string }) {
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
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
