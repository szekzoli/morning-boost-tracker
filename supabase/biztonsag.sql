-- Morning Boost Tracker: az adatbázis védelme
--
-- Mit csinál: a members és a sessions táblát csak a megadott e-mail-címmel bejelentkezett felhasználó
-- olvashatja és írhatja. A nyilvános (anon) kulccsal, belépés nélkül, semmi nem érhető el.
--
-- Sorrend (fontos!):
--   1. Supabase → Authentication → Users → Add user → Create new user:
--      e-mail: az alábbi cím, jelszó: egy erős jelszó, "Auto Confirm User" bekapcsolva.
--   2. Supabase → Authentication → Sign In / Providers: "Allow new users to sign up" KIKAPCSOLVA.
--   3. Az új tracker-verzió (belépőképernyővel) legyen élesben, és próbáld ki, hogy be tudsz lépni.
--   4. Csak ezután futtasd ezt a fájlt: Supabase → SQL Editor → New query → beillesztés → Run.
--      (Ha a 3. lépés előtt futtatod, a régi tracker nem fogja látni az adatokat.)
--
-- Visszaállítás vészhelyzetben (újra nyilvános lesz!):
--   alter table public.members disable row level security;
--   alter table public.sessions disable row level security;
--   grant select, insert, update, delete on public.members, public.sessions to anon;

begin;

-- 1) Sorszintű védelem bekapcsolása
alter table public.members enable row level security;
alter table public.sessions enable row level security;

-- 2) A korábbi (esetleg mindent megengedő) szabályok törlése
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('members', 'sessions')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 3) Csak a megadott e-mail-címmel bejelentkezett felhasználó férhet hozzá.
--    (Ha a regisztráció véletlenül nyitva maradna, egy idegen fiók akkor se lásson semmit.)
create policy members_owner on public.members
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'szekely.zoltan92@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'szekely.zoltan92@gmail.com');

create policy sessions_owner on public.sessions
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'szekely.zoltan92@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'szekely.zoltan92@gmail.com');

-- 4) A nyilvános szerepkör ne is lássa a táblákat
revoke all on public.members, public.sessions from anon;
grant select, insert, update, delete on public.members, public.sessions to authenticated;

commit;

-- Ellenőrzés: mindkét sorban rowsecurity = true és szabalyok = 1 kell legyen.
select tablename, rowsecurity,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename) as szabalyok
from pg_tables t
where schemaname = 'public' and tablename in ('members', 'sessions');
