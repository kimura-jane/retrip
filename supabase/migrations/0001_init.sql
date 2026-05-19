-- ============================================
-- re trip 初期スキーマ
-- 仕様書 v3 §6 に対応
-- ============================================

-- UUID 生成拡張
create extension if not exists "pgcrypto";

-- ============================================
-- ENUM 型
-- ============================================

create type gender as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type tour_type as enum ('day_trip', 'overnight');
create type tour_status as enum ('draft', 'recruiting', 'closed', 'completed', 'cancelled');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'attended', 'no_show');
create type chat_room_type as enum ('tour', 'lounge');
create type chat_member_role as enum ('member', 'admin');

-- ============================================
-- users (拡張プロフィール)
-- auth.users と 1:1
-- ============================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  birth_date date not null,
  gender gender not null,
  bio text,
  avatar_url text,
  id_document_url text,
  id_verified boolean not null default false,
  id_verified_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.users is 'ユーザー拡張プロフィール（auth.users と 1:1）';

-- auth.users 作成時に public.users 行を自動作成するトリガ
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, birth_date, gender)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '名無し'),
    coalesce((new.raw_user_meta_data->>'birth_date')::date, '2000-01-01'::date),
    coalesce((new.raw_user_meta_data->>'gender')::gender, 'prefer_not_to_say'::gender)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- tours (ツアープラン)
-- ============================================

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  tour_type tour_type not null,
  destination text not null,
  departure_date timestamptz not null,
  return_date timestamptz not null,
  meeting_points jsonb not null default '[]'::jsonb,
  price integer not null check (price >= 0),
  capacity_total integer not null check (capacity_total > 0),
  capacity_male integer check (capacity_male is null or capacity_male >= 0),
  capacity_female integer check (capacity_female is null or capacity_female >= 0),
  age_range_min integer check (age_range_min is null or age_range_min >= 0),
  age_range_max integer check (age_range_max is null or age_range_max >= age_range_min),
  theme_tags text[] not null default '{}',
  status tour_status not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default now()
);

comment on table public.tours is 'ツアープラン';

create index tours_status_idx on public.tours(status);
create index tours_departure_date_idx on public.tours(departure_date);
create index tours_theme_tags_idx on public.tours using gin(theme_tags);

-- ============================================
-- bookings (予約)
-- ============================================

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  meeting_point_id text not null,
  status booking_status not null default 'pending',
  stripe_payment_intent_id text,
  amount_paid integer not null check (amount_paid >= 0),
  booked_at timestamptz not null default now(),
  unique (tour_id, user_id)
);

comment on table public.bookings is '予約';

create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_tour_id_idx on public.bookings(tour_id);
create index bookings_status_idx on public.bookings(status);

-- ============================================
-- chat_rooms (チャット部屋)
-- ============================================

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  room_type chat_room_type not null,
  tour_id uuid references public.tours(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  -- tour 型なら tour_id 必須、lounge 型なら null
  constraint chat_rooms_tour_id_check check (
    (room_type = 'tour' and tour_id is not null) or
    (room_type = 'lounge' and tour_id is null)
  )
);

comment on table public.chat_rooms is 'チャット部屋（ツアー専用 or 全体ラウンジ）';

create unique index chat_rooms_tour_unique on public.chat_rooms(tour_id) where tour_id is not null;
create index chat_rooms_type_idx on public.chat_rooms(room_type);

-- ============================================
-- chat_members (チャット参加者)
-- ============================================

create table public.chat_members (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role chat_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, user_id)
);

comment on table public.chat_members is 'チャット参加者（left_at で論理退出）';

create index chat_members_user_id_idx on public.chat_members(user_id);
create index chat_members_active_idx on public.chat_members(room_id, user_id) where left_at is null;

-- ============================================
-- messages (メッセージ)
-- ============================================

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

comment on table public.messages is 'チャットメッセージ';

create index messages_room_created_idx on public.messages(room_id, created_at desc);
create index messages_user_idx on public.messages(user_id);

-- ============================================
-- albums (アルバム)
-- ============================================

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null unique references public.tours(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.albums is 'ツアーアルバム（ツアーごとに1つ）';

-- ============================================
-- album_photos (アルバム写真)
-- ============================================

create table public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.album_photos is 'アルバム写真';

create index album_photos_album_idx on public.album_photos(album_id, created_at desc);

-- ============================================
-- payments (決済ログ)
-- ============================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  stripe_event_id text not null unique,
  event_type text not null,
  amount integer not null,
  status text not null,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

comment on table public.payments is 'Stripe Webhook ログ（stripe_event_id ユニークで冪等性確保）';

create index payments_booking_idx on public.payments(booking_id);

-- ============================================
-- admin_logs (運営操作ログ)
-- ============================================

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.admin_logs is '運営操作ログ';

create index admin_logs_action_idx on public.admin_logs(action, created_at desc);

-- ============================================
-- ツアー作成時にアルバムを自動生成
-- ============================================

create or replace function public.create_album_for_tour()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.albums (tour_id) values (new.id);
  return new;
end;
$$;

create trigger on_tour_created
  after insert on public.tours
  for each row execute function public.create_album_for_tour();

-- ============================================
-- 初期データ：全体ラウンジを1つ作る
-- ============================================

insert into public.chat_rooms (id, room_type, tour_id, name)
values (
  gen_random_uuid(),
  'lounge',
  null,
  '全体ラウンジ'
);
