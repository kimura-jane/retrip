-- ============================================
-- users テーブルへの UPDATE 権限付与
-- ============================================
-- 0005_chat_theme.sql でカラム追加したが、
-- テーブルレベルの UPDATE 権限が authenticated に無く、
-- RLS の手前で permission denied になっていたため修正。
-- 実際に何が更新できるかは RLS ポリシー users_update_own が制御する。

grant update on public.users to authenticated;
