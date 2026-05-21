-- ============================================
-- チャット機能拡張: リアクション・引用・編集・削除・画像
-- ============================================

-- messages テーブル拡張
alter table public.messages
  add column if not exists reply_to_message_id uuid references public.messages(id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists media_url text,
  add column if not exists media_type text check (media_type in ('image','video','gif'));

comment on column public.messages.reply_to_message_id is '引用返信先のメッセージID';
comment on column public.messages.edited_at is '最終編集日時（null=未編集）';
comment on column public.messages.deleted_at is '削除日時（null=未削除）';
comment on column public.messages.media_url is '添付メディアのStorage URL';
comment on column public.messages.media_type is 'image / video / gif';

-- message_reactions テーブル新規作成
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(message_id, user_id, emoji)
);

create index if not exists message_reactions_message_id_idx
  on public.message_reactions(message_id);

comment on table public.message_reactions is 'メッセージへの絵文字リアクション';

-- RLS 有効化
alter table public.message_reactions enable row level security;

-- RLS ポリシー: 閲覧
create policy message_reactions_select on public.message_reactions
for select to authenticated
using (
  exists (
    select 1 from public.messages m
    join public.chat_rooms r on r.id = m.room_id
    where m.id = message_reactions.message_id
      and (
        is_admin()
        or (r.room_type = 'lounge' and r.requires_verification = false)
        or (r.room_type = 'lounge' and r.requires_verification = true and exists (
          select 1 from public.users u where u.id = auth.uid() and u.id_verified = true
        ))
        or (r.room_type = 'tour' and is_room_member(r.id))
      )
  )
);

-- RLS ポリシー: 追加（自分のリアクションのみ）
create policy message_reactions_insert on public.message_reactions
for insert to authenticated
with check (user_id = auth.uid());

-- RLS ポリシー: 削除（自分のリアクションのみ）
create policy message_reactions_delete on public.message_reactions
for delete to authenticated
using (user_id = auth.uid());

-- GRANT 権限付与
grant select, insert, delete on public.message_reactions to authenticated;

-- messages の UPDATE 権限（編集・削除のため）
grant update on public.messages to authenticated;

-- messages の UPDATE ポリシー（自分のメッセージのみ、deleted_at と content と edited_at のみ）
drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Realtime publication に追加
alter publication supabase_realtime add table public.message_reactions;
