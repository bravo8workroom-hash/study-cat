-- ============================================================
--  공부하는 고양이 — 기록 공유용 Supabase 스키마
--
--  우리집 다이어리와 같은 Supabase 프로젝트에 표 하나만 추가합니다.
--  Supabase 대시보드(https://supabase.com) → 프로젝트 선택 →
--  SQL Editor 에 이 파일을 통째로 붙여넣고 [Run] 한 번이면 끝.
--
--  안전장치: 기존 표(family_*)는 전혀 건드리지 않습니다.
--  다시 Run 해도 기록은 안 지워집니다 (if not exists / replace).
-- ============================================================

-- ── 1) 기록 보관 표 ─────────────────────────────────────────
--  가족 코드(CAT-XXXXXX) 하나당 한 줄. 아이 폰의 기록 전체가
--  doc 한 칸에 통째로 들어갑니다.
create table if not exists catstudy_state (
  code       text primary key,
  doc        jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

--  RLS를 켜고 정책을 하나도 안 만듭니다 = 표에 직접 접근은 전부 차단.
--  읽기/쓰기/삭제는 아래 함수(코드를 정확히 아는 사람만)로만 됩니다.
alter table catstudy_state enable row level security;

-- ── 2) 접근 함수 3개 ────────────────────────────────────────
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

-- ── 3) 권한: 앱(anon 키)에서 함수만 부를 수 있게 ─────────────
revoke execute on function catstudy_put(text, jsonb) from public;
revoke execute on function catstudy_get(text) from public;
revoke execute on function catstudy_del(text) from public;
grant execute on function catstudy_put(text, jsonb) to anon, authenticated;
grant execute on function catstudy_get(text) to anon, authenticated;
grant execute on function catstudy_del(text) to anon, authenticated;
