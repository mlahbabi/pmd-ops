-- PMD Ops — schéma Supabase (à coller dans « SQL Editor » du projet Supabase, puis Run)
create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  item_id text not null unique,
  done boolean not null default false,
  done_by text,
  done_at timestamptz default now()
);
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text not null,
  text text not null,
  item_id text,
  level text not null default 'info' check (level in ('info','alerte','incident'))
);
create table if not exists public.presence (
  "user" text primary key,
  last_seen timestamptz not null default now(),
  screen text
);
alter table public.checks enable row level security;
alter table public.notes enable row level security;
alter table public.presence enable row level security;
-- Outil interne à 4 utilisateurs derrière code d'accès : lecture/écriture pour le rôle anon (assumé).
create policy "anon all checks" on public.checks for all to anon using (true) with check (true);
create policy "anon all notes" on public.notes for all to anon using (true) with check (true);
create policy "anon all presence" on public.presence for all to anon using (true) with check (true);
-- Realtime
alter publication supabase_realtime add table public.checks;
alter publication supabase_realtime add table public.notes;
