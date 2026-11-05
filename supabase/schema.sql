-- =====================================================================
-- Wein-Guide: Datenbank-Schema für Supabase
-- Einmalig im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Vorher in der letzten Zeile DEINE E-Mail-Adresse eintragen.
-- =====================================================================

-- 1) Wer darf überhaupt zugreifen? (nur hier eingetragene E-Mail-Adressen)
create table if not exists public.allowed_users (
  email text primary key
);
alter table public.allowed_users enable row level security;
-- Keine Policies: Die App kann diese Liste weder lesen noch ändern.

create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 2) Die Weine. Alle Felder stecken flexibel in "data" (JSON),
--    damit neue Felder in der App keine Datenbank-Änderung brauchen.
create table if not exists public.wines (
  id          uuid primary key,
  data        jsonb not null default '{}'::jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
create index if not exists wines_updated_at_idx on public.wines (updated_at);

-- Zeitstempel und Bearbeiter setzt immer die Datenbank (nicht das Handy)
create or replace function public.wines_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists wines_touch on public.wines;
create trigger wines_touch
  before insert or update on public.wines
  for each row execute function public.wines_touch();

-- 3) Zugriffsregeln: nur angemeldete UND freigeschaltete Personen
alter table public.wines enable row level security;
-- Neuere Supabase-Projekte geben neue Tabellen nicht immer automatisch frei
grant select, insert, update on public.wines to authenticated;

drop policy if exists wines_select on public.wines;
create policy wines_select on public.wines
  for select to authenticated using (public.is_allowed_user());

drop policy if exists wines_insert on public.wines;
create policy wines_insert on public.wines
  for insert to authenticated with check (public.is_allowed_user());

drop policy if exists wines_update on public.wines;
create policy wines_update on public.wines
  for update to authenticated
  using (public.is_allowed_user()) with check (public.is_allowed_user());
-- Kein echtes Löschen: Gelöschte Weine werden nur markiert (deleted = true).

-- 4) Freischalten (Kirsten später mit derselben Zeile ergänzen)
insert into public.allowed_users (email) values ('DEINE-EMAIL@example.com')
on conflict do nothing;
