-- ============================================
-- チャットテーマ: 雑誌風パレットへ移行
-- 旧: green / blue / pink / purple / orange, sans / serif / rounded / mincho / pop
-- 新: coral / sage / ink / paper / sora,      sans / serif / display / rounded
-- ============================================

-- 1. 既存値を新パレットにマッピング
update public.users set chat_theme_color = case chat_theme_color
  when 'green'  then 'sage'
  when 'blue'   then 'sora'
  when 'pink'   then 'coral'
  when 'purple' then 'sage'
  when 'orange' then 'coral'
  else 'coral'
end
where chat_theme_color in ('green','blue','pink','purple','orange');

update public.users set chat_font = case chat_font
  when 'sans'    then 'sans'
  when 'serif'   then 'serif'
  when 'rounded' then 'rounded'
  when 'mincho'  then 'serif'
  when 'pop'     then 'sans'
  else 'sans'
end
where chat_font in ('sans','serif','rounded','mincho','pop');

-- 2. デフォルト値を coral / sans に変更
alter table public.users
  alter column chat_theme_color set default 'coral',
  alter column chat_font set default 'sans';

-- 3. comment 更新
comment on column public.users.chat_theme_color is 'チャットのテーマカラー: coral / sage / ink / paper / sora';
comment on column public.users.chat_font is 'チャットのフォント: sans / serif / display / rounded';
