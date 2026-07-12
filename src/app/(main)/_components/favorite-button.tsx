import { toggleFavoriteAction } from "@/features/favorites/actions";

type Props = {
  tourId: string;
  isFavorite: boolean;
  nextPath: string;
  variant?: "card" | "detail";
};

/**
 * ハート型お気に入りトグルボタン。
 * Server Action で toggle し、成功後は nextPath に戻す。
 * variant='card' は一覧カードの右上に絶対配置される想定。
 * variant='detail' はツアー詳細のタイトル横に置く想定。
 */
export function FavoriteButton({
  tourId,
  isFavorite,
  nextPath,
  variant = "card",
}: Props) {
  const base =
    variant === "card"
      ? "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper-100/85 backdrop-blur-sm hover:bg-paper-100 transition"
      : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-50 hover:border-coral-500 transition";

  return (
    <form action={toggleFavoriteAction} className="contents">
      <input type="hidden" name="tourId" value={tourId} />
      <input type="hidden" name="next" value={nextPath} />
      <button
        type="submit"
        aria-label={isFavorite ? "気になるを解除" : "気になるに追加"}
        aria-pressed={isFavorite}
        className={base}
      >
        <HeartIcon filled={isFavorite} />
      </button>
    </form>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? "#c85a3f" : "none"}
      stroke={filled ? "#c85a3f" : "#3a3a38"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
