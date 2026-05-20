-- ============================================
-- re trip RLS（Row Level Security）ポリシー
-- 仕様書 v3 §7 に対応
-- ============================================

-- ============================================
-- 全テーブルに RLS を明示的に有効化
-- （Run and enable RLS で既に有効化されてるが念のため）
-- ============================================

alter table public.users          enable row level security;
alter table public.tours          enable row level security;
alter table public.bookings       enable row level security;
alter table public.chat_rooms     enable row level security;
alter table public.chat_members   enable row level security;
alter table public.messages       enable row level security;
alter table public.albums         enable row level security;
alter table public.album_photos   enable row level security;
alter table public.payments       enable row level security;
alter table public.admin_logs     enable row level security;

-- ============================================
-- ヘルパー関数：現在ユーザーが admin か
-- auth.users.raw_user_meta_data->>'role' で判定
-- ============================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (raw_user_meta_data->>'role') = 'admin'
     from auth.users
     where id = auth.uid()),
    false
  );
$$;

-- ============================================
-- ヘルパー関数：指定 room に在籍中か
-- ============================================

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_members
    where room_id = p_room_id
      and user_id = auth.uid()
      and left_at is null
  );
$$;

-- ============================================
-- ヘルパー関数：指定 tour に有効な予約があるか
-- ============================================

create or replace function public.has_booking_for_tour(p_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings
    where tour_id = p_tour_id
      and user_id = auth.uid()
      and status in ('confirmed', 'attended')
  );
$$;

-- ============================================
-- users
-- ============================================

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_select_admin"
  on public.users for select
  using (public.is_admin());

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- 一般ユーザーは id_verified を変更不可（運営承認のみ）
    and id_verified = (select id_verified from public.users where id = auth.uid())
  );

create policy "users_update_admin"
  on public.users for update
  using (public.is_admin());

-- insert は handle_new_user() トリガが security definer で行うので
-- 通常の insert ポリシーは不要

-- ============================================
-- tours
-- ============================================

create policy "tours_select_recruiting_public"
  on public.tours for select
  using (status in ('recruiting', 'closed', 'completed'));

create policy "tours_select_admin_all"
  on public.tours for select
  using (public.is_admin());

create policy "tours_insert_admin"
  on public.tours for insert
  with check (public.is_admin());

create policy "tours_update_admin"
  on public.tours for update
  using (public.is_admin());

create policy "tours_delete_admin"
  on public.tours for delete
  using (public.is_admin());

-- ============================================
-- bookings
-- ============================================

create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "bookings_select_admin"
  on public.bookings for select
  using (public.is_admin());

-- 一般ユーザーは insert/update/delete 不可
-- → サーバーアクション + service_role 経由でのみ行う（仕様書 §7）
create policy "bookings_admin_write"
  on public.bookings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- chat_rooms
-- ============================================

create policy "chat_rooms_select_member"
  on public.chat_rooms for select
  using (public.is_room_member(id));

create policy "chat_rooms_select_lounge_verified"
  on public.chat_rooms for select
  using (
    room_type = 'lounge'
    and exists (
      select 1 from public.users
      where id = auth.uid() and id_verified = true
    )
  );

create policy "chat_rooms_select_admin"
  on public.chat_rooms for select
  using (public.is_admin());

create policy "chat_rooms_admin_write"
  on public.chat_rooms for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- chat_members
-- ============================================

create policy "chat_members_select_own_room"
  on public.chat_members for select
  using (public.is_room_member(room_id));

create policy "chat_members_select_admin"
  on public.chat_members for select
  using (public.is_admin());

-- 自分の退出のみ可（left_at セット）
create policy "chat_members_leave_own"
  on public.chat_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_members_admin_write"
  on public.chat_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- messages
-- ============================================

create policy "messages_select_member"
  on public.messages for select
  using (
    public.is_room_member(room_id)
    and deleted_at is null
  );

create policy "messages_select_admin"
  on public.messages for select
  using (public.is_admin());

create policy "messages_insert_member"
  on public.messages for insert
  with check (
    auth.uid() = user_id
    and public.is_room_member(room_id)
  );

create policy "messages_update_own"
  on public.messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "messages_update_admin"
  on public.messages for update
  using (public.is_admin());

create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);

create policy "messages_delete_admin"
  on public.messages for delete
  using (public.is_admin());

-- ============================================
-- albums
-- ============================================

create policy "albums_select_participant"
  on public.albums for select
  using (public.has_booking_for_tour(tour_id));

create policy "albums_select_admin"
  on public.albums for select
  using (public.is_admin());

-- insert/update/delete は admin のみ（通常はトリガで自動作成）
create policy "albums_admin_write"
  on public.albums for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- album_photos
-- ============================================

create policy "album_photos_select_participant"
  on public.album_photos for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id
        and public.has_booking_for_tour(a.tour_id)
    )
  );

create policy "album_photos_select_admin"
  on public.album_photos for select
  using (public.is_admin());

create policy "album_photos_insert_participant"
  on public.album_photos for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.albums a
      where a.id = album_photos.album_id
        and public.has_booking_for_tour(a.tour_id)
    )
  );

create policy "album_photos_update_own"
  on public.album_photos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "album_photos_admin_write"
  on public.album_photos for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- payments
-- ============================================

-- 一般ユーザーは閲覧不可、admin のみ
create policy "payments_select_admin"
  on public.payments for select
  using (public.is_admin());

create policy "payments_admin_write"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================
-- admin_logs
-- ============================================

create policy "admin_logs_select_admin"
  on public.admin_logs for select
  using (public.is_admin());

create policy "admin_logs_insert_admin"
  on public.admin_logs for insert
  with check (public.is_admin());

-- ============================================
-- ストレージバケットの作成
-- ============================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),              -- プロフィール画像（公開）
  ('id_documents', 'id_documents', false),   -- 本人確認書類（非公開、本人と運営のみ）
  ('album_photos', 'album_photos', false),   -- アルバム写真（参加者のみ）
  ('message_images', 'message_images', false), -- チャット画像（部屋参加者のみ）
  ('tour_covers', 'tour_covers', true)       -- ツアーカバー画像（公開）
on conflict (id) do nothing;

-- ============================================
-- ストレージ RLS
-- ============================================

-- avatars: 自分のフォルダのみアップロード、誰でも閲覧
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- id_documents: 本人と運営のみ全権限
create policy "id_documents_select_own"
  on storage.objects for select
  using (
    bucket_id = 'id_documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "id_documents_select_admin"
  on storage.objects for select
  using (
    bucket_id = 'id_documents'
    and public.is_admin()
  );

create policy "id_documents_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'id_documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "id_documents_update_own"
  on storage.objects for update
  using (
    bucket_id = 'id_documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- album_photos: 参加者のみ
create policy "album_photos_storage_select_participant"
  on storage.objects for select
  using (
    bucket_id = 'album_photos'
    and (
      public.has_booking_for_tour(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "album_photos_storage_insert_participant"
  on storage.objects for insert
  with check (
    bucket_id = 'album_photos'
    and public.has_booking_for_tour(((storage.foldername(name))[1])::uuid)
  );

-- message_images: 部屋メンバーのみ
create policy "message_images_select_member"
  on storage.objects for select
  using (
    bucket_id = 'message_images'
    and (
      public.is_room_member(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "message_images_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'message_images'
    and public.is_room_member(((storage.foldername(name))[1])::uuid)
  );

-- tour_covers: 誰でも閲覧、admin のみアップロード
create policy "tour_covers_select_public"
  on storage.objects for select
  using (bucket_id = 'tour_covers');

create policy "tour_covers_admin_write"
  on storage.objects for all
  using (
    bucket_id = 'tour_covers'
    and public.is_admin()
  )
  with check (
    bucket_id = 'tour_covers'
    and public.is_admin()
  );

-- ============================================
-- Realtime: messages テーブルを購読可能にする
-- ============================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_members;
