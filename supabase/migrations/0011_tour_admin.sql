-- ============================================
-- 0011: ツアー作成 → chat_rooms 自動生成 + tour ルームの SELECT 絞り込み
--
-- 目的：
--   1. 管理画面で tours を INSERT したら、対応する room_type='tour' の
--      chat_rooms を自動的に作る（albums と同じトリガ方式）
--   2. tour ルームの SELECT を「該当ツアーに有効予約がある人」に絞る
--      （これをやらないと未予約者にツアーチャットが見えてしまう）
-- ============================================

-- ============================================
-- 1. ツアー作成時に chat_rooms を自動生成するトリガ
-- ============================================

create or replace function public.create_chat_room_for_tour()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chat_rooms (
    room_type,
    tour_id,
    name,
    description,
    requires_verification,
    sort_order
  )
  values (
    'tour',
    new.id,
    new.title,
    null,
    true,    -- ツアーチャットは決済済み（=本人確認済み）前提
    0
  );
  return new;
end;
$$;

create trigger on_tour_created_create_room
  after insert on public.tours
  for each row execute function public.create_chat_room_for_tour();

comment on function public.create_chat_room_for_tour is
  'tours INSERT 時に対応する tour ルームを自動生成（albums と同様のパターン）';

-- ============================================
-- 2. ツアー名の変更を chat_rooms.name にも反映するトリガ
-- ============================================

create or replace function public.sync_chat_room_name_from_tour()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.title is distinct from old.title then
    update public.chat_rooms
      set name = new.title
      where room_type = 'tour' and tour_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_tour_updated_sync_room_name
  after update on public.tours
  for each row execute function public.sync_chat_room_name_from_tour();

comment on function public.sync_chat_room_name_from_tour is
  'tours.title 変更時に対応する chat_rooms.name も同期';

-- ============================================
-- 3. tour ルームの SELECT を予約者のみに絞るポリシーを追加
--
-- 0003_chat_rooms.sql の "chat_rooms_select" は
-- 「ログイン済み + 本人確認 OR 認証不要」で許可しているため、
-- tour ルームも見えてしまう。これを締める。
-- ============================================

-- 既存の包括ポリシーを置き換える：lounge のみ対象に絞る
drop policy if exists "chat_rooms_select" on public.chat_rooms;

create policy "chat_rooms_select_lounge"
  on public.chat_rooms
  for select
  to authenticated
  using (
    room_type = 'lounge'
    and (
      requires_verification = false
      or exists (
        select 1 from public.users
        where users.id = auth.uid()
          and users.id_verified = true
      )
    )
  );

-- tour ルームは「該当ツアーに有効予約がある人」または admin のみ閲覧可
create policy "chat_rooms_select_tour_participant"
  on public.chat_rooms
  for select
  to authenticated
  using (
    room_type = 'tour'
    and tour_id is not null
    and public.has_booking_for_tour(tour_id)
  );

-- ============================================
-- 4. messages の SELECT/INSERT も tour ルーム対応に拡張
--
-- 0003_chat_rooms.sql の messages_select / messages_insert は
-- chat_rooms の requires_verification しか見ていないので、
-- tour ルーム（決済者のみ）に対応していない。書き直す。
-- ============================================

drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;

create policy "messages_select"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = messages.room_id
        and (
          -- ラウンジ：本人確認チェック
          (
            r.room_type = 'lounge'
            and (
              r.requires_verification = false
              or exists (
                select 1 from public.users u
                where u.id = auth.uid() and u.id_verified = true
              )
            )
          )
          or
          -- ツアールーム：予約チェック
          (
            r.room_type = 'tour'
            and r.tour_id is not null
            and public.has_booking_for_tour(r.tour_id)
          )
        )
    )
  );

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
          (
            r.room_type = 'lounge'
            and (
              r.requires_verification = false
              or exists (
                select 1 from public.users u
                where u.id = auth.uid() and u.id_verified = true
              )
            )
          )
          or
          (
            r.room_type = 'tour'
            and r.tour_id is not null
            and public.has_booking_for_tour(r.tour_id)
          )
        )
    )
  );
