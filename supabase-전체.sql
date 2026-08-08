-- ============================================================
--  공부하는 고양이 — 전용 Supabase 프로젝트 전체 스키마
--
--  공부하는 고양이만 쓰는 새 프로젝트(우리집 다이어리와 분리)에
--  이 파일 하나만 Run 하면 끝. SQL Editor 에 통째로 붙여넣고
--  [Run] 한 번이면 표 3개 + 함수 9개가 만들어집니다.
--
--  안전장치: 다시 Run 해도 기록이 지워지지 않습니다
--            (if not exists / or replace).
--  * 이 파일은 supabase.sql + supabase-자료.sql 을 합친 것입니다.
-- ============================================================


-- ── 1) 기록 보관 표 ─────────────────────────────────────────
--  가족 코드(CAT-XXXXXX) 하나당 한 줄. 아이 폰의 기록 전체가
--  doc 한 칸에 통째로 들어갑니다.
create table if not exists catstudy_state (
  code       text primary key,
  doc        jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── 2) 아이가 찍은 자료 사진 ────────────────────────────────
--  가족 코드 하나당 사진 여러 장. 사진 1장 = 한 줄.
--  기록(catstudy_state)과 표를 나눈 이유: 기록 doc 은 1MB 제한이라
--  사진을 같이 담으면 아이 포인트·스트릭 저장이 통째로 실패합니다.
create table if not exists catstudy_shots (
  code       text not null,
  id         text not null,
  meta       jsonb       not null default '{}'::jsonb,  -- 과목·제목·용도·찍은날
  img        text        not null,                      -- data:image/jpeg;base64,...
  created_at timestamptz not null default now(),
  primary key (code, id)
);
create index if not exists catstudy_shots_code_idx on catstudy_shots(code, created_at);

-- ── 3) 설계실에서 내려보내는 학습 계획 ──────────────────────
--  마인드맵 계획(PLAN)을 아이 앱 달력이 읽어 갑니다.
create table if not exists catstudy_plan (
  code       text primary key,
  doc        jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

--  RLS 켜고 정책은 만들지 않습니다 = 표 직접 접근 전면 차단.
--  아래 함수(코드를 정확히 아는 사람)로만 읽고 씁니다.
alter table catstudy_state enable row level security;
alter table catstudy_shots enable row level security;
alter table catstudy_plan  enable row level security;


-- ── 4) 기록 함수 3개 ────────────────────────────────────────
--  코드 형식(CAT- + 6자리)이 맞아야만 동작 → 목록 훑기 불가능.

create or replace function catstudy_put(p_code text, p_doc jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^CAT-[A-Z0-9]{6}$' then
    raise exception 'bad code';
  end if;
  if pg_column_size(p_doc) > 1000000 then
    raise exception 'too big';
  end if;
  insert into catstudy_state(code, doc, updated_at)
  values (p_code, p_doc, now())
  on conflict (code) do update set doc = excluded.doc, updated_at = now();
end $$;

create or replace function catstudy_get(p_code text)
returns table(doc jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select doc, updated_at from catstudy_state where code = p_code;
$$;

create or replace function catstudy_del(p_code text)
returns void
language sql security definer set search_path = public as $$
  delete from catstudy_state where code = p_code;
$$;


-- ── 5) 사진 함수 4개 ────────────────────────────────────────

create or replace function catshot_put(p_code text, p_id text, p_meta jsonb, p_img text)
returns void
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if p_code !~ '^CAT-[A-Z0-9]{6}$' then raise exception 'bad code'; end if;
  if p_id   !~ '^[a-zA-Z0-9_-]{4,40}$' then raise exception 'bad id'; end if;
  if length(p_img) > 2000000 then raise exception 'too big'; end if;
  select count(*) into n from catstudy_shots where code = p_code;
  if n >= 300 then raise exception 'too many'; end if;
  insert into catstudy_shots(code, id, meta, img, created_at)
  values (p_code, p_id, coalesce(p_meta, '{}'::jsonb), p_img, now())
  on conflict (code, id) do update set meta = excluded.meta, img = excluded.img;
end $$;

--  목록은 사진 알맹이(img) 없이 가벼운 정보만 돌려줍니다.
create or replace function catshot_list(p_code text)
returns table(id text, meta jsonb, bytes int, created_at timestamptz)
language sql security definer set search_path = public as $$
  select id, meta, length(img), created_at
  from catstudy_shots where code = p_code order by created_at;
$$;

create or replace function catshot_get(p_code text, p_id text)
returns text
language sql security definer set search_path = public as $$
  select img from catstudy_shots where code = p_code and id = p_id;
$$;

create or replace function catshot_del(p_code text, p_id text)
returns void
language sql security definer set search_path = public as $$
  delete from catstudy_shots where code = p_code and id = p_id;
$$;


-- ── 6) 학습 계획 함수 2개 ───────────────────────────────────

create or replace function catplan_put(p_code text, p_doc jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^CAT-[A-Z0-9]{6}$' then raise exception 'bad code'; end if;
  if pg_column_size(p_doc) > 1000000 then raise exception 'too big'; end if;
  insert into catstudy_plan(code, doc, updated_at)
  values (p_code, p_doc, now())
  on conflict (code) do update set doc = excluded.doc, updated_at = now();
end $$;

create or replace function catplan_get(p_code text)
returns table(doc jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select doc, updated_at from catstudy_plan where code = p_code;
$$;


-- ── 7) 권한: 앱(anon 키)에서 함수만 부를 수 있게 ─────────────
revoke execute on function catstudy_put(text, jsonb)            from public;
revoke execute on function catstudy_get(text)                   from public;
revoke execute on function catstudy_del(text)                   from public;
revoke execute on function catshot_put(text, text, jsonb, text) from public;
revoke execute on function catshot_list(text)                   from public;
revoke execute on function catshot_get(text, text)              from public;
revoke execute on function catshot_del(text, text)              from public;
revoke execute on function catplan_put(text, jsonb)             from public;
revoke execute on function catplan_get(text)                    from public;

grant execute on function catstudy_put(text, jsonb)            to anon, authenticated;
grant execute on function catstudy_get(text)                   to anon, authenticated;
grant execute on function catstudy_del(text)                   to anon, authenticated;
grant execute on function catshot_put(text, text, jsonb, text) to anon, authenticated;
grant execute on function catshot_list(text)                   to anon, authenticated;
grant execute on function catshot_get(text, text)              to anon, authenticated;
grant execute on function catshot_del(text, text)              to anon, authenticated;
grant execute on function catplan_put(text, jsonb)             to anon, authenticated;
grant execute on function catplan_get(text)                    to anon, authenticated;
