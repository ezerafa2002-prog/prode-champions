-- PRODE CHAMPIONS 2026/27 — schema inicial (MVP)
-- No incluye matchday_results: se agrega más adelante si hace falta.

-- ============================================================
-- 1. participants
-- ============================================================
create table participants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  status text not null default 'submitted' check (status in ('submitted')),
  -- nota: no existe status 'draft' en la DB — el borrador vive solo en
  -- localStorage del navegador. Una fila en esta tabla ya significa "enviado".
  positioning jsonb not null,      -- { team_id: predicted_position, ... }
  crystal_ball jsonb not null,     -- { category_key: value, ... }
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- 2. official_results (una sola fila — la clasificación real)
-- ============================================================
create table official_results (
  id int primary key default 1 check (id = 1), -- fila única
  real_table jsonb,                 -- { team_id: real_position, ... }
  updated_at timestamptz not null default now()
);

insert into official_results (id, real_table) values (1, null);

-- ============================================================
-- 3. official_crystal_ball (una fila por categoría)
-- ============================================================
create table official_crystal_ball (
  category_key text primary key,    -- ej: "revelacion", "max_goleador", "gol_olimpico"
  official_value jsonb,             -- respuesta oficial una vez resuelta
  overrides jsonb,                  -- { participant_id: puntos } — casos manuales excepcionales
  resolved_at timestamptz
);

-- ============================================================
-- 4. admin_attempts (rate limiting del panel admin)
-- ============================================================
create table admin_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now(),
  success boolean not null,
  ip_hash text -- hash del IP, no el IP crudo
);

-- ============================================================
-- Vista pública — lo único que el frontend consulta directamente
-- ============================================================
create view public_profiles as
select
  id,
  slug,
  name,
  positioning,
  crystal_ball,
  submitted_at
from participants;

-- ============================================================
-- RLS
-- ============================================================
alter table participants enable row level security;
alter table official_results enable row level security;
alter table official_crystal_ball enable row level security;
alter table admin_attempts enable row level security;

-- La tabla base participants NO tiene policy de select público.
-- Solo se permite insert directo (envío de un prode nuevo, una sola vez).
create policy "insertar prode nuevo"
  on participants for insert
  to anon
  with check (status = 'submitted');

-- No hay policy de update/delete para "anon": eso solo lo hace la
-- Edge Function de admin, usando la service role key (bypassa RLS).

-- La vista public_profiles hereda los permisos de select del rol que
-- la consulta; se otorga select explícito solo sobre la vista, no sobre
-- las tablas base.
grant select on public_profiles to anon;

-- official_results y official_crystal_ball: lectura pública (son el
-- estado oficial que todos necesitan ver en los perfiles), sin
-- escritura para "anon".
create policy "leer resultados oficiales"
  on official_results for select
  to anon
  using (true);

create policy "leer bola de cristal oficial"
  on official_crystal_ball for select
  to anon
  using (true);

-- admin_attempts: sin acceso para "anon" en absoluto (ni lectura ni
-- escritura) — solo la Edge Function, con service role, la toca.
