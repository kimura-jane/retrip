"use client";

import { useState, useTransition } from "react";
import { saveTourIntroAction } from "@/features/tour-intro/actions";
import type { AgeGroup, Gender } from "@/types/database";

export type IntroRow = {
  user_id: string;
  nickname: string;
  age_group: AgeGroup;
  gender: Gender;
  occupation: string | null;
  hobbies: string | null;
  spot: string | null;
  message: string | null;
};

type Sender = { display_name: string; avatar_url: string | null };

type Props = {
  tourId: string;
  roomId: string;
  currentUserId: string;
  intros: IntroRow[];
  senders: Record<string, Sender>;
};

const AGE_LABELS: Record<AgeGroup, string> = {
  twenties: "20代",
  thirties: "30代",
  forties: "40代",
  fifties: "50代",
  sixties_plus: "60代以上",
  no_answer: "無回答",
};

const GENDER_LABELS: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  prefer_not_to_say: "無回答",
};

const AGE_OPTIONS: AgeGroup[] = [
  "twenties",
  "thirties",
  "forties",
  "fifties",
  "sixties_plus",
  "no_answer",
];

const GENDER_OPTIONS: Gender[] = ["male", "female", "other", "prefer_not_to_say"];

// ===== 自己紹介カードの中身（一覧・単体で共用） =====
function IntroCardBody({
  intro,
  sender,
}: {
  intro: IntroRow;
  sender: Sender | undefined;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        {sender?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sender.avatar_url}
            alt={intro.nickname}
            className="w-9 h-9 rounded-full object-cover bg-paper-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-paper-200" />
        )}
        <div>
          <p className="font-serif text-[15px] text-ink-900">{intro.nickname}</p>
          <p className="text-[11px] text-ink-500 font-light">
            {AGE_LABELS[intro.age_group]}
            <span className="mx-1.5">·</span>
            {GENDER_LABELS[intro.gender]}
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-2 text-[13px]">
        {intro.occupation && (
          <div>
            <dt className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
              お仕事・業種
            </dt>
            <dd className="text-ink-900 font-light leading-relaxed">
              {intro.occupation}
            </dd>
          </div>
        )}
        {intro.hobbies && (
          <div>
            <dt className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
              好きなこと・趣味
            </dt>
            <dd className="text-ink-900 font-light leading-relaxed whitespace-pre-line">
              {intro.hobbies}
            </dd>
          </div>
        )}
        {intro.spot && (
          <div>
            <dt className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
              楽しみにしているスポット
            </dt>
            <dd className="text-ink-900 font-light leading-relaxed whitespace-pre-line">
              {intro.spot}
            </dd>
          </div>
        )}
        {intro.message && (
          <div>
            <dt className="font-display italic text-[10px] tracking-widest2 uppercase text-coral-700">
              ひとこと
            </dt>
            <dd className="text-ink-900 font-light leading-relaxed whitespace-pre-line">
              {intro.message}
            </dd>
          </div>
        )}
      </dl>
    </>
  );
}

// ===== アバタータップで開く単体プロフィールモーダル =====
export function ProfileModal({
  intro,
  sender,
  fallbackName,
  onClose,
}: {
  intro: IntroRow | null;
  sender: Sender | undefined;
  fallbackName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-ink-900/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-paper-100 sm:border sm:border-[#E5E0D8] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-paper-100 border-b border-[#E5E0D8] px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
              Profile
            </p>
            <h2 className="mt-1 font-serif text-lg text-ink-900 tracking-wide">
              メンバーの自己紹介
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-xl leading-none transition-colors"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5">
          {intro ? (
            <div className="border border-[#E5E0D8] bg-paper-50 p-4">
              <IntroCardBody intro={intro} sender={sender} />
            </div>
          ) : (
            <div className="border border-[#E5E0D8] bg-paper-50 p-4">
              <div className="flex items-center gap-3">
                {sender?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sender.avatar_url}
                    alt={fallbackName}
                    className="w-9 h-9 rounded-full object-cover bg-paper-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-paper-200" />
                )}
                <p className="font-serif text-[15px] text-ink-900">{fallbackName}</p>
              </div>
              <p className="mt-4 text-[13px] text-ink-500 font-light leading-relaxed">
                この方はまだ自己紹介を書いていません。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IntroPanel({
  tourId,
  roomId,
  currentUserId,
  intros,
  senders,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const myIntro = intros.find((i) => i.user_id === currentUserId) ?? null;

  // 入力フォームの状態
  const [nickname, setNickname] = useState(myIntro?.nickname ?? "");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(myIntro?.age_group ?? "no_answer");
  const [gender, setGender] = useState<Gender>(myIntro?.gender ?? "prefer_not_to_say");
  const [occupation, setOccupation] = useState(myIntro?.occupation ?? "");
  const [hobbies, setHobbies] = useState(myIntro?.hobbies ?? "");
  const [spot, setSpot] = useState(myIntro?.spot ?? "");
  const [message, setMessage] = useState(myIntro?.message ?? "");

  const handleSave = () => {
    setError(null);
    const fd = new FormData();
    fd.set("nickname", nickname);
    fd.set("age_group", ageGroup);
    fd.set("gender", gender);
    fd.set("occupation", occupation);
    fd.set("hobbies", hobbies);
    fd.set("spot", spot);
    fd.set("message", message);

    startTransition(async () => {
      const result = await saveTourIntroAction(tourId, roomId, fd);
      if (result.success) {
        // 反映のため全リロード（router.refresh は使わない方針）
        window.location.href = `/chat/${roomId}`;
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      {/* 上部固定バー */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-shrink-0 w-full bg-coral-50 border-b border-[#E5E0D8] px-5 py-2.5 flex items-center justify-between text-left hover:bg-coral-100 transition-colors"
      >
        <span className="font-display italic text-[11px] tracking-widest2 uppercase text-coral-700">
          このツアー限定のプロフィールはこちら
        </span>
        <span className="font-display italic text-[11px] text-coral-700">→</span>
      </button>

      {/* モーダル */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/40 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-paper-100 sm:border sm:border-[#E5E0D8] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="sticky top-0 bg-paper-100 border-b border-[#E5E0D8] px-5 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-display italic uppercase tracking-widest2 text-[10px] text-coral-700">
                  Tour Profiles
                </p>
                <h2 className="mt-1 font-serif text-lg text-ink-900 tracking-wide">
                  {editing ? "自己紹介を編集" : "メンバーの自己紹介"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (editing) setEditing(false);
                  else setOpen(false);
                }}
                className="text-ink-500 hover:text-ink-900 text-xl leading-none transition-colors"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {editing ? (
              // ===== 入力フォーム =====
              <div className="px-5 py-5 space-y-5">
                <p className="text-[11px] text-ink-500 font-light leading-relaxed border-l-2 border-coral-500 pl-3">
                  ここで入力した内容は、同じツアーに参加するメンバーにのみ公開されます。
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    ニックネーム（呼ばれたい名前）<span className="text-coral-700"> *</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={40}
                    placeholder="例：たびねこ"
                    className="w-full bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    年代
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_OPTIONS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAgeGroup(a)}
                        className={`px-3 py-1.5 text-[13px] border transition-colors ${
                          ageGroup === a
                            ? "border-coral-500 bg-coral-50 text-coral-700"
                            : "border-[#E5E0D8] bg-paper-50 text-ink-500 hover:border-ink-500"
                        }`}
                      >
                        {AGE_LABELS[a]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    性別
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`px-3 py-1.5 text-[13px] border transition-colors ${
                          gender === g
                            ? "border-coral-500 bg-coral-50 text-coral-700"
                            : "border-[#E5E0D8] bg-paper-50 text-ink-500 hover:border-ink-500"
                        }`}
                      >
                        {GENDER_LABELS[g]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    お仕事・業種
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    maxLength={100}
                    placeholder="例：IT系 / 看護師 / 学生 など"
                    className="w-full bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    好きなこと・趣味
                  </label>
                  <textarea
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    maxLength={300}
                    rows={2}
                    placeholder="例：カメラ、温泉巡り、読書"
                    className="w-full bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition resize-none"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    楽しみにしているスポット
                  </label>
                  <textarea
                    value={spot}
                    onChange={(e) => setSpot(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="このツアーで楽しみにしている場所"
                    className="w-full bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition resize-none"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-ink-600 font-light">
                    ひとことメッセージ
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="みんなへひとこと"
                    className="w-full bg-paper-50 border border-[#E5E0D8] px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-coral-500 transition resize-none"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                {error && (
                  <div className="border border-coral-300 bg-coral-50 px-3 py-2">
                    <p className="text-[12px] text-coral-700 font-light">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              // ===== 一覧表示 =====
              <div className="px-5 py-5 space-y-5">
                <p className="text-[11px] text-ink-500 font-light leading-relaxed border-l-2 border-coral-500 pl-3">
                  メンバーの自己紹介は、このツアーの参加者だけが見られます。ここで知った情報を外部に持ち出したり、SNS等で共有したりしないでください。
                </p>

                {intros.length === 0 ? (
                  <p className="text-center text-[13px] text-ink-500 font-light py-8 leading-loose">
                    まだ自己紹介がありません。
                    <br />
                    最初に書いてみましょう。
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {intros.map((intro) => (
                      <li
                        key={intro.user_id}
                        className="border border-[#E5E0D8] bg-paper-50 p-4"
                      >
                        <IntroCardBody intro={intro} sender={senders[intro.user_id]} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* フッター */}
            <div className="sticky bottom-0 bg-paper-100 border-t border-[#E5E0D8] px-5 py-4 flex items-center gap-3 pb-safe">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 bg-coral-500 hover:bg-coral-700 text-paper-100 text-[13px] tracking-[0.15em] px-6 py-3 transition disabled:opacity-50"
                  >
                    {isPending ? "保存中..." : "保存する"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={isPending}
                    className="text-[12px] tracking-[0.15em] uppercase text-ink-500 hover:text-ink-900 transition-colors"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex-1 border border-coral-500 text-coral-700 hover:bg-coral-500 hover:text-paper-50 text-[13px] tracking-[0.15em] px-6 py-3 transition"
                >
                  {myIntro ? "自分の自己紹介を編集" : "自己紹介を書く"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
