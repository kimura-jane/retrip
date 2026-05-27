-- ============================================
-- 0012: 匿名投票機能
--
-- 仕様：
--   - レベルB（DB 記録あり / UI 匿名 / 投票変更可）
--   - 作成権限：本人確認済み or admin
--   - 選択肢：2〜6個（jsonb 配列 [{id, label}]）
--   - messages の一種としてタイムラインに流れる
--   - 締切なし
-- ============================================

-- ============================================
-- 1. polls テーブル
-- ============================================

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 200),
  options jsonb not null,
  allow_multiple boolean not null default false,
  created_at timestamptz not null default now(),
  -- options は [{"id": "opt-uuid", "label": "選択肢テキスト"}] の配列
  -- 2〜6個に制限
  constraint polls_options_size_check check (
    jsonb_array_length(options) between 2 and 6
  )
);

comment on table public.polls is '匿名投票（チャットメッセージの一種として表示）';
comment on column public.polls.options is '選択肢配列 [{id, label}]';
comment on column public.polls.allow_multiple is '複数選択可（現状 false 固定運用、将来用）';

create index polls_room_id_idx on public.polls(room_id);
create index polls_created_by_idx on public.polls(created_by);

-- ============================================
-- 2. poll_votes テーブル
-- ============================================

create table public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  option_id text not null,  -- options[].id を参照
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id, option_id)
);

comment on table public.poll_votes is '投票記録（user_id は集計用、UI には露出しない）';

create index poll_votes_poll_id_idx on public.poll_votes(poll_id);
create index poll_votes_user_id_idx on public.poll_votes(user_id);

-- ============================================
-- 3. messages に message_type と poll_id を追加
-- ============================================

alter table public.messages
  add column if not exists message_type text not null default 'text'
    check (message_type in ('text', 'poll')),
  add column if not exists poll_id uuid references public.polls(id) on delete cascade;

comment on column public.messages.message_type is 'メッセージ種別（text or poll）';
comment on column public.messages.poll_id is 'message_type=poll の場合の投票ID';

-- ポリシー：poll の場合は poll_id 必須、text の場合は poll_id null
alter table public.messages
  add constraint messages_poll_id_check check (
    (message_type = 'poll' and poll_id is not null)
    or (message_type = 'text' and poll_id is null)
  );

-- ============================================
-- 4. 集計用 VIEW（option_id ごとの投票数）
-- ============================================

create or replace view public.poll_results as
select
  p.id as poll_id,
  opt.option ->> 'id' as option_id,
  opt.option ->> 'label' as option_label,
  coalesce(vote_counts.cnt, 0) as vote_count
from public.polls p
cross join lateral jsonb_array_elements(p.options) as opt(option)
left join (
  select poll_id, option_id, count(*)::int as cnt
  from public.poll_votes
  group by poll_id, option_id
) as vote_counts
  on vote_counts.poll_id = p.id
  and vote_counts.option_id = (opt.option ->> 'id');

comment on view public.poll_results is '投票集計（option_id ごとの票数。VIEW なので RLS は元テーブル準拠）';

-- VIEW にも RLS（PostgreSQL 15+ なら自動継承だが念のため明示）
alter view public.poll_results set (security_invoker = true);

-- ============================================
-- 5. RLS：polls
-- ============================================

alter table public.polls enable row level security;

-- 閲覧：そのルームのメッセージが見える人と同じ条件
-- 投票自体は room_id 経由で判定する
create policy "polls_select_room_accessible"
  on public.polls
  for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = polls.room_id
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

-- 作成：本人確認済み or admin、かつそのルームにアクセス権がある
create policy "polls_insert_verified"
  on public.polls
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.users u
        where u.id = auth.uid() and u.id_verified = true
      )
    )
    and exists (
      select 1 from public.chat_rooms r
      where r.id = polls.room_id
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

-- 削除：作成者本人 or admin
create policy "polls_delete_owner_or_admin"
  on public.polls
  for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- 更新は不可（仕様：投票開始後の改竄防止）

-- ============================================
-- 6. RLS：poll_votes
-- ============================================

alter table public.poll_votes enable row level security;

-- 閲覧：poll が見える人は誰が投票したかも見える（自分の票を判定するため）
-- ただし UI 側で表示を絞ることで匿名性を担保
create policy "poll_votes_select_room_accessible"
  on public.poll_votes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.polls p
      join public.chat_rooms r on r.id = p.room_id
      where p.id = poll_votes.poll_id
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

-- 投票：自分の票のみ INSERT 可、ルームアクセス権が必要
create policy "poll_votes_insert_own"
  on public.poll_votes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.polls p
      join public.chat_rooms r on r.id = p.room_id
      where p.id = poll_votes.poll_id
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

-- 取り消し：自分の票のみ DELETE 可
create policy "poll_votes_delete_own"
  on public.poll_votes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================
-- 7. poll_results VIEW への SELECT 権限（authenticated）
-- ============================================

grant select on public.poll_results to authenticated;
