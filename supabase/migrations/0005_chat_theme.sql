-- ============================================
-- チャットテーマ機能: ユーザーごとの見た目設定
-- ============================================

alter table public.users
  add column if not exists chat_theme_color text not null default 'green',
  add column if not exists chat_font text not null default 'sans';

comment on column public.users.chat_theme_color is 'チャットのテーマカラー: green / blue / pink / purple / orange';
comment on column public.users.chat_font is 'チャットのフォント: sans / serif / rounded / mincho / pop';

-- 既存ユーザーにもデフォルト値を入れる（NOT NULL なので default で埋まる）
update public.users
set chat_theme_color = coalesce(chat_theme_color, 'green'),
    chat_font = coalesce(chat_font, 'sans')
where chat_theme_color is null or chat_font is null;
