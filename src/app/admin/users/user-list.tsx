"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ListUser = {
  id: string;
  display_name: string | null;
  gender: string | null;
  banned: boolean | null;
  chat_banned: boolean | null;
  withdrawn: boolean | null;
  id_verified: boolean | null;
  id_document_url: string | null;
  id_rejected_at: string | null;
  created_at: string;
};

type VerifyStatus = "verified" | "pending" | "rejected" | "none";
type BanStatus = "access" | "chat" | "none";

function getVerifyStatus(u: ListUser): VerifyStatus {
  if (u.id_verified === true) return "verified";
  if (u.id_rejected_at) return "rejected";
  if (u.id_document_url) return "pending";
  return "none";
}

function getBanStatus(u: ListUser): BanStatus {
  if (u.banned === true) return "access";
  if (u.chat_banned === true) return "chat";
  return "none";
}

const VERIFY_LABEL: Record<VerifyStatus, string> = {
  verified: "本人確認済み",
  pending: "審査待ち",
  rejected: "却下",
  none: "未提出",
};

const VERIFY_COLOR: Record<VerifyStatus, string> = {
  verified: "bg-sage-100 text-sage-700",
  pending: "bg-paper-200 text-ink-600",
  rejected: "bg-coral-100 text-coral-700",
  none: "bg-paper-200 text-ink-500",
};

const GENDER_LABEL: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  prefer_not_to_say: "無回答",
};

type Filters = {
  verify: VerifyStatus | "all";
  ban: BanStatus | "all";
  withdrawn: "include" | "exclude" | "only";
  gender: string | "all";
  yearMonth: string; // "" or "YYYY-MM"
};

const INITIAL_FILTERS: Filters = {
  verify: "all",
  ban: "all",
  withdrawn: "exclude",
  gender: "all",
  yearMonth: "",
};

export function UserList({ users }: { users: ListUser[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      // テキスト検索（表示名 + ユーザーID）
      if (q) {
        const name = (u.display_name ?? "").toLowerCase();
        const id = u.id.toLowerCase();
        if (!name.includes(q) && !id.includes(q)) return false;
      }
      // 認証ステータス
      if (filters.verify !== "all" && getVerifyStatus(u) !== filters.verify) {
        return false;
      }
      // BANステータス
      if (filters.ban !== "all" && getBanStatus(u) !== filters.ban) {
        return false;
      }
      // 退会
      if (filters.withdrawn === "exclude" && u.withdrawn === true) return false;
      if (filters.withdrawn === "only" && u.withdrawn !== true) return false;
      // 性別
      if (filters.gender !== "all" && u.gender !== filters.gender) return false;
      // 登録年月
      if (filters.yearMonth) {
        const ym = new Date(u.created_at).toISOString().slice(0, 7);
        if (ym !== filters.yearMonth) return false;
      }
      return true;
    });
  }, [users, query, filters]);

  const hasActiveFilter =
    query !== "" ||
    filters.verify !== "all" ||
    filters.ban !== "all" ||
    filters.withdrawn !== "exclude" ||
    filters.gender !== "all" ||
    filters.yearMonth !== "";

  return (
    <div className="space-y-5">
      {/* 検索ボックス */}
      <div className="space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="表示名 または ユーザーID で検索"
          className="w-full border border-line bg-paper-50 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
        />

        {/* フィルタチップ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FilterSelect
            label="本人確認"
            value={filters.verify}
            onChange={(v) =>
              setFilters((f) => ({ ...f, verify: v as Filters["verify"] }))
            }
            options={[
              { value: "all", label: "すべて" },
              { value: "verified", label: "認証済み" },
              { value: "pending", label: "審査待ち" },
              { value: "rejected", label: "却下" },
              { value: "none", label: "未提出" },
            ]}
          />
          <FilterSelect
            label="BAN"
            value={filters.ban}
            onChange={(v) =>
              setFilters((f) => ({ ...f, ban: v as Filters["ban"] }))
            }
            options={[
              { value: "all", label: "すべて" },
              { value: "none", label: "通常" },
              { value: "access", label: "アクセスBAN" },
              { value: "chat", label: "チャットBAN" },
            ]}
          />
          <FilterSelect
            label="退会ユーザー"
            value={filters.withdrawn}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                withdrawn: v as Filters["withdrawn"],
              }))
            }
            options={[
              { value: "exclude", label: "含めない" },
              { value: "include", label: "含める" },
              { value: "only", label: "退会のみ" },
            ]}
          />
          <FilterSelect
            label="性別"
            value={filters.gender}
            onChange={(v) => setFilters((f) => ({ ...f, gender: v }))}
            options={[
              { value: "all", label: "すべて" },
              { value: "male", label: "男性" },
              { value: "female", label: "女性" },
              { value: "other", label: "その他" },
              { value: "prefer_not_to_say", label: "無回答" },
            ]}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest2 uppercase text-ink-500 font-display italic">
              登録月
            </label>
            <input
              type="month"
              value={filters.yearMonth}
              onChange={(e) =>
                setFilters((f) => ({ ...f, yearMonth: e.target.value }))
              }
              className="border border-line bg-paper-50 px-3 py-2 text-[13px] text-ink-900 focus:outline-none focus:border-coral-500 transition"
            />
          </div>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilters(INITIAL_FILTERS);
            }}
            className="text-[11px] tracking-[0.08em] uppercase text-coral-700 hover:text-coral-500 transition"
          >
            フィルタをリセット
          </button>
        )}
      </div>

      {/* 件数表示 */}
      <p className="text-[11px] text-ink-500 font-light">
        {filtered.length} 件 / 全 {users.length} 件
      </p>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <p className="text-[13px] text-ink-500 font-light py-8 text-center">
          該当するユーザーはいません。
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {filtered.map((u) => {
            const verify = getVerifyStatus(u);
            const ban = getBanStatus(u);
            return (
              <li key={u.id}>
                <Link
                  href={`/admin/users/${u.id}`}
                  className={`block py-3 px-2 hover:bg-paper-100 transition ${
                    u.withdrawn ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-serif text-[15px] text-ink-900 truncate">
                          {u.display_name ?? "(名前未設定)"}
                        </p>
                        <span
                          className={`inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic ${VERIFY_COLOR[verify]}`}
                        >
                          {VERIFY_LABEL[verify]}
                        </span>
                        {ban === "access" && (
                          <span className="inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic bg-coral-100 text-coral-700">
                            Access BAN
                          </span>
                        )}
                        {ban === "chat" && (
                          <span className="inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic bg-coral-100 text-coral-700">
                            Chat BAN
                          </span>
                        )}
                        {u.withdrawn && (
                          <span className="inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 font-display italic bg-paper-200 text-ink-500">
                            Withdrawn
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-ink-500 font-light">
                        {u.gender && GENDER_LABEL[u.gender]
                          ? GENDER_LABEL[u.gender]
                          : "-"}
                        {" ・ 登録 "}
                        {new Date(u.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <span className="flex-shrink-0 font-display italic text-xs text-ink-500">
                      詳細 →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] tracking-widest2 uppercase text-ink-500 font-display italic">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-line bg-paper-50 px-3 py-2 text-[13px] text-ink-900 focus:outline-none focus:border-coral-500 transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
