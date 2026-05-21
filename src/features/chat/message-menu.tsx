"use client";

import { useEffect, useRef } from "react";

export type MessageMenuAction =
  | "react"
  | "reply"
  | "copy"
  | "edit"
  | "delete";

type Props = {
  isMine: boolean;
  isDeleted: boolean;
  hasContent: boolean;
  onAction: (action: MessageMenuAction) => void;
  onClose: () => void;
};

export function MessageMenu({
  isMine,
  isDeleted,
  hasContent,
  onAction,
  onClose,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (isDeleted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 animate-fade-in">
      <div
        ref={wrapperRef}
        className="w-full sm:w-72 bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        <MenuButton
          icon="😀"
          label="リアクション"
          onClick={() => {
            onAction("react");
            onClose();
          }}
        />
        <MenuButton
          icon="↩"
          label="返信"
          onClick={() => {
            onAction("reply");
            onClose();
          }}
        />
        {hasContent && (
          <MenuButton
            icon="📋"
            label="コピー"
            onClick={() => {
              onAction("copy");
              onClose();
            }}
          />
        )}
        {isMine && hasContent && (
          <MenuButton
            icon="✏"
            label="編集"
            onClick={() => {
              onAction("edit");
              onClose();
            }}
          />
        )}
        {isMine && (
          <MenuButton
            icon="🗑"
            label="送信を取り消す"
            danger
            onClick={() => {
              onAction("delete");
              onClose();
            }}
          />
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3 text-sm text-neutral-500 border-t border-neutral-200 hover:bg-neutral-50 transition"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm transition hover:bg-neutral-50 ${
        danger ? "text-red-600" : "text-neutral-800"
      }`}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
