"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// ============================================
// 型
// ============================================

export type PollOption = {
  id: string;
  label: string;
};

export type PollRow = {
  id: string;
  room_id: string;
  created_by: string;
  question: string;
  options: PollOption[];
  allow_multiple: boolean;
  created_at: string;
};

export type PollResultRow = {
  poll_id: string;
  option_id: string;
  option_label: string;
  vote_count: number;
};

export type PollVoteRow = {
  poll_id: string;
  user_id: string;
  option_id: string;
  voted_at: string;
};

type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string };

// ============================================
// 共通：認証チェック
// ============================================

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "ログインが必要です" };
  return { ok: true as const, supabase, userId: user.id };
}

// 簡易ランダムID（option 用）
function genOptionId(): string {
  return `opt-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ============================================
// createPollAction
//
// 質問 + 選択肢2〜6個 を受け取り、polls を INSERT し、
// 同時に messages に message_type='poll' で1行 INSERT する
// ============================================

export async function createPollAction(
  roomId: string,
  question: string,
  optionLabels: string[]
): Promise<ActionResult<{ pollId: string; messageId: string }>> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { success: false, error: auth.error };

  // バリデーション
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    return { success: false, error: "質問を入力してください" };
  }
  if (trimmedQuestion.length > 200) {
    return { success: false, error: "質問は200文字以内にしてください" };
  }
  const cleanedLabels = optionLabels
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (cleanedLabels.length < 2 || cleanedLabels.length > 6) {
    return { success: false, error: "選択肢は2〜6個にしてください" };
  }
  if (cleanedLabels.some((l) => l.length > 80)) {
    return { success: false, error: "選択肢は80文字以内にしてください" };
  }

  const options: PollOption[] = cleanedLabels.map((label) => ({
    id: genOptionId(),
    label,
  }));

  // 1. polls INSERT
  type PollInsert = Database["public"]["Tables"]["polls"]["Insert"];
  const pollPayload: PollInsert = {
    room_id: roomId,
    created_by: auth.userId,
    question: trimmedQuestion,
    options: options as never,
    allow_multiple: false,
  };

  const { data: pollData, error: pollError } = await auth.supabase
    .from("polls")
    .insert(pollPayload as never)
    .select("id")
    .single<{ id: string }>();

  if (pollError || !pollData) {
    return {
      success: false,
      error: pollError?.message ?? "投票の作成に失敗しました",
    };
  }

  // 2. messages INSERT（message_type='poll'）
  type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
  const messagePayload: MessageInsert = {
    room_id: roomId,
    user_id: auth.userId,
    content: trimmedQuestion, // フォールバック用に質問を入れておく
    message_type: "poll",
    poll_id: pollData.id,
  };

  const { data: messageData, error: messageError } = await auth.supabase
    .from("messages")
    .insert(messagePayload as never)
    .select("id")
    .single<{ id: string }>();

  if (messageError || !messageData) {
    // polls だけ残るとゴミなので削除
    await auth.supabase.from("polls").delete().eq("id", pollData.id);
    return {
      success: false,
      error: messageError?.message ?? "メッセージの投稿に失敗しました",
    };
  }

  revalidatePath(`/chat/${roomId}`);
  return {
    success: true,
    data: { pollId: pollData.id, messageId: messageData.id },
  };
}

// ============================================
// castVoteAction
//
// 投票する。すでに別の選択肢に投票していたら付け替える（変更可能）。
// 同じ選択肢に再投票したら何もしない（冪等）。
// allow_multiple=false 前提。
// ============================================

export async function castVoteAction(
  pollId: string,
  optionId: string
): Promise<ActionResult> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { success: false, error: auth.error };

  // 既存の自分の票（allow_multiple=false 前提なので最大1つ）
  const { data: existing } = await auth.supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("user_id", auth.userId);

  const existingOptions = (existing ?? []) as { option_id: string }[];
  const alreadyVotedSame = existingOptions.some((v) => v.option_id === optionId);

  if (alreadyVotedSame) {
    // 冪等：何もしない
    return { success: true };
  }

  // 既存票を削除（付け替え）
  if (existingOptions.length > 0) {
    const { error: delError } = await auth.supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", auth.userId);
    if (delError) return { success: false, error: delError.message };
  }

  // 新規 INSERT
  type VoteInsert = Database["public"]["Tables"]["poll_votes"]["Insert"];
  const votePayload: VoteInsert = {
    poll_id: pollId,
    user_id: auth.userId,
    option_id: optionId,
  };

  const { error: insertError } = await auth.supabase
    .from("poll_votes")
    .insert(votePayload as never);

  if (insertError) return { success: false, error: insertError.message };

  // チャットのリアルタイム購読では拾えないので、明示的に revalidate
  // ※ ルームIDをここで知るために polls から逆引きしてもいいが、
  //   呼び出し側で revalidate するのが筋なので、ここでは省略
  return { success: true };
}

// ============================================
// removeVoteAction
//
// 自分の票をすべて取り消す
// ============================================

export async function removeVoteAction(
  pollId: string
): Promise<ActionResult> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("user_id", auth.userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// deletePollAction
//
// 投票を削除（作成者本人 or admin のみ）
// 関連する messages 行も cascade で削除される
// ============================================

export async function deletePollAction(
  pollId: string,
  roomId: string
): Promise<ActionResult> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("polls")
    .delete()
    .eq("id", pollId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/chat/${roomId}`);
  return { success: true };
}
