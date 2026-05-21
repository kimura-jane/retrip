-- ============================================
-- チャット部屋（ラウンジ）の拡張
-- - requires_verification カラム追加
-- - 既存「全体ラウンジ」を5つの板に置き換え
-- - RLS ポリシー更新
-- ============================================

-- ============================================
-- 1. chat_rooms に requires_verification を追加
-- ============================================

alter table public.chat_rooms
  add column if not exists requires_verification boolean not null default false;

alter table public.chat_rooms
  add column if not exists description text;

alter table public.chat_rooms
  add column if not exists sort_order integer not null default 0;

comment on column public.chat_rooms.requires_verification is '本人確認済みユーザーのみアクセス可能';
comment on column public.chat_rooms.description is '部屋の説明文';
comment on column public.chat_rooms.sort_order is '一覧での表示順（小さいほど上）';

-- ============================================
-- 2. 既存の「全体ラウンジ」を一旦削除して、5つの板に置き換え
-- ============================================

delete from public.chat_rooms
where room_type = 'lounge';

-- 全体エリア（誰でもアクセス可能・本人確認不要）
insert into public.chat_rooms (room_type, tour_id, name, description, requires_verification, sort_order)
values
  ('lounge', null, '雑談板', '気軽におしゃべりする場所', false, 10),
  ('lounge', null, '検討中板', 'ツアー参加を迷っている方の相談・質問', false, 20),
  ('lounge', null, '改善案板', '運営への要望・改善提案', false, 30);

-- 認証済みエリア（本人確認済みのみアクセス可能）
insert into public.chat_rooms (room_type, tour_id, name, description, requires_verification, sort_order)
values
  ('lounge', null, '希望の目的地板', 'こんな場所に行きたい！というリクエスト', true, 100),
  ('lounge', null, '感想板', 'ツアー参加後の振り返り・思い出', true, 110);

-- ============================================
-- 3. RLS ポリシー：chat_rooms
-- ============================================

-- 既存ポリシーを削除して作り直し
drop policy if exists "chat_rooms_select_all" on public.chat_rooms;
drop policy if exists "chat_rooms_select" on public.chat_rooms;

-- ログイン済みユーザーは、本人確認不要の部屋と、本人確認済みなら全部屋見える
create policy "chat_rooms_select"
  on public.chat_rooms
  for select
  to authenticated
  using (
    requires_verification = false
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.id_verified = true
    )
  );

-- ============================================
-- 4. RLS ポリシー：messages
-- ============================================

drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;
drop policy if exists "messages_select_member" on public.messages;
drop policy if exists "messages_insert_member" on public.messages;

-- メッセージ閲覧：その部屋にアクセス権がある人
create policy "messages_select"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = messages.room_id
        and (
          r.requires_verification = false
          or exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.id_verified = true
          )
        )
    )
  );

-- メッセージ投稿：その部屋にアクセス権がある人 + 自分のuser_idでのみ投稿可
create policy "messages_insert"
  on public.messages
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.chat_rooms r
      where r.id = messages.room_id
        and (
          r.requires_verification = false
          or exists (
            select 1 from public.users u
            where u.id = auth.uid() and u.id_verified = true
          )
        )
    )
  );

-- メッセージ削除：自分の投稿のみ（論理削除用）
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
  on public.messages
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
