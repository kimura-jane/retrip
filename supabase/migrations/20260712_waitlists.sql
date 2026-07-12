create table if not exists public.waitlists (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  status text not null default 'waiting'
    check (status in ('waiting','notified','converted','cancelled')),
  unique (tour_id, user_id)
);

create index if not exists waitlists_tour_created_idx
  on public.waitlists (tour_id, created_at);
create index if not exists waitlists_user_idx
  on public.waitlists (user_id);

alter table public.waitlists enable row level security;

drop policy if exists "waitlists_select_own" on public.waitlists;
create policy "waitlists_select_own"
  on public.waitlists for select
  using (auth.uid() = user_id);

drop policy if exists "waitlists_insert_own" on public.waitlists;
create policy "waitlists_insert_own"
  on public.waitlists for insert
  with check (auth.uid() = user_id);

drop policy if exists "waitlists_delete_own" on public.waitlists;
create policy "waitlists_delete_own"
  on public.waitlists for delete
  using (auth.uid() = user_id);

-- ⚠️ Supabase では RLS 有効化と GRANT は別。authenticated ロールに必要な権限を付与すること。
grant select, insert, delete on public.waitlists to authenticated;

-- 既存のキャンセル処理を変更せず、status 更新日時からcronがキャンセル日を判定できるようにする。
alter table public.bookings
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_bookings_updated_at();
