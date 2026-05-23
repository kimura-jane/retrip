-- ============================================
-- users.id_rejection_reason カラムの追加
-- 本人確認書類の却下理由をユーザーに表示するため
-- ============================================

alter table public.users
  add column if not exists id_rejection_reason text;
