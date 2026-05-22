-- ============================================
-- 本人確認書類の却下機能
-- ============================================
-- 運営が本人確認書類を却下した時刻を記録する。
-- 却下時：id_rejected_at = now(), id_document_url = null にする
-- 再提出時：id_rejected_at = null に戻す（id-upload action 側で対応）

alter table public.users
  add column if not exists id_rejected_at timestamptz;

comment on column public.users.id_rejected_at is '本人確認書類が却下された日時（null=却下されていない／再提出済み）';
