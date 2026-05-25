-- ============================================
-- チャットルーム再編：6本立てに整理
-- 既存ルームをリネーム + sort_order 振り直し + 質問チャット新規追加
-- ============================================

-- 既存5ルームのリネーム + sort_order 振り直し
update public.chat_rooms set name = '雑談チャット',         sort_order = 10  where id = 'ee6b5937-e53e-426f-9227-af3e3d0844fa';
update public.chat_rooms set name = '検討相談チャット',     sort_order = 20  where id = '4591026d-0212-44ea-a9fd-fe760f4d301b';
update public.chat_rooms set name = '改善要望チャット',     sort_order = 40  where id = '0fc29a22-05f7-45d2-a327-ecd72fc44bfc';
update public.chat_rooms set name = '希望の目的地チャット', sort_order = 100 where id = '8e81833b-92ba-4a78-9abb-303dee701640';
update public.chat_rooms set name = '感想チャット',         sort_order = 110 where id = '2cbace23-1655-408d-867e-a11072b2b758';

-- 質問チャットを新規追加（sort_order=30、本人確認不要）
insert into public.chat_rooms (room_type, name, description, requires_verification, sort_order)
values ('lounge', '質問チャット', null, false, 30);
