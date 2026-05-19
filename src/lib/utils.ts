import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind のクラス名を結合するヘルパー。
 * 条件付きクラスや、競合するクラス（例: `px-2` と `px-4`）を後者優先でマージする。
 *
 * @example
 * cn("px-2 py-1", isActive && "bg-brand-400", "px-4")
 * // => "py-1 bg-brand-400 px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
