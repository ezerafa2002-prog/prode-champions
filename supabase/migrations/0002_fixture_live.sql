-- PRODE CHAMPIONS — Fixture en vivo (API-Football → Edge Functions → Supabase)
-- No modifica participants / official_results / official_crystal_ball /
-- admin_attempts (Posicionamiento y Bola de Cristal no se tocan).
--
-- Identidad de Fixture: nombre + PIN de 4 dígitos (sin login, sin email).
-- El PIN se hashea (PBKDF2) del lado de la Edge Function — nunca en texto
-- plano, ni siquiera en tránsito hacia esta tabla. El frontend (rol
-- "anon") no tiene ningún permiso de escritura sobre las tablas de acá
-- abajo: todo insert/update pasa exclusivamente por las Edge Functions,
-- que usan la service role key y por lo tanto no dependen de policies
-- para escribir (las policies de acá son solo para las lecturas
-- públicas que el frontend sí hace directo).

-- ============================================================
-- 1. fixture_users — identidad propia del Fixture (slug + PIN)
-- ============================================================
create table fixture_users (
  slug text primary key,
  name text not null,
  pin_hash text not null, -- "salt_hex:iterations:hash_hex" (PBKDF2-SHA256)
  created_at timestamptz not null default now()
);

-- Vista pública: nunca se expone pin_hash.
create view fixture_users_public as
  select slug, name from fixture_users;

-- ============================================================
-- 2. fixture_pin_attempts — rate limiting de intentos de PIN
-- ============================================================
create table fixture_pin_attempts (
  id bigint generated always as identity primary key,
  slug text not null,
  attempted_at timestamptz not null default now(),
  success boolean not null
);

create index fixture_pin_attempts_slug_time on fixture_pin_attempts (slug, attempted_at desc);

-- ============================================================
-- 3. fixture_days — un día calendario con partidos de Champions
-- ============================================================
create table fixture_days (
  id uuid primary key default gen_random_uuid(),
  match_date date unique not null,
  label text not null, -- ej. "Jueves 5 de septiembre" (generado al importar)
  status text not null default 'current' check (status in ('current', 'closed')),
  locks_at timestamptz, -- horario del primer partido del día (kickoff más temprano)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solo puede haber UN día "current" a la vez — el día activo que ve
-- el frontend. Los demás son 'closed' (fechas anteriores, solo lectura).
create unique index fixture_days_single_current on fixture_days ((true)) where status = 'current';

-- ============================================================
-- 4. fixture_matches — partidos de un día, importados de API-Football
-- ============================================================
create table fixture_matches (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references fixture_days(id) on delete cascade,
  api_fixture_id bigint unique not null, -- id de fixture en API-Football, para upsert idempotente
  home_team_id text not null, -- coincide con el id en src/config/teams.js
  away_team_id text not null,
  kickoff_utc timestamptz not null,
  status_short text not null default 'NS', -- NS, 1H, HT, 2H, FT, AET, PEN, PST, CANC, ABD...
  real_home int,
  real_away int,
  updated_at timestamptz not null default now()
);

create index fixture_matches_day on fixture_matches (day_id);

-- ============================================================
-- 5. fixture_predictions — un pronóstico por (usuario, día)
-- ============================================================
create table fixture_predictions (
  id uuid primary key default gen_random_uuid(),
  user_slug text not null references fixture_users(slug) on delete cascade,
  day_id uuid not null references fixture_days(id) on delete cascade,
  featured_match_id uuid references fixture_matches(id), -- sorteado una sola vez, nunca cambia
  submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_slug, day_id)
);

-- ============================================================
-- 6. fixture_picks — marcador pronosticado por partido
-- ============================================================
create table fixture_picks (
  prediction_id uuid not null references fixture_predictions(id) on delete cascade,
  match_id uuid not null references fixture_matches(id) on delete cascade,
  pred_home int not null,
  pred_away int not null,
  primary key (prediction_id, match_id)
);

-- ============================================================
-- RLS
-- ============================================================
alter table fixture_users enable row level security;
alter table fixture_pin_attempts enable row level security;
alter table fixture_days enable row level security;
alter table fixture_matches enable row level security;
alter table fixture_predictions enable row level security;
alter table fixture_picks enable row level security;

-- fixture_users: SIN policy de select para "anon" — el pin_hash no
-- puede quedar accesible por ningún camino. Lo único público es la
-- vista fixture_users_public (sin pin_hash).
grant select on fixture_users_public to anon;

-- fixture_pin_attempts: sin acceso para "anon" en absoluto.

-- fixture_days y fixture_matches: calendario y resultados son
-- públicos siempre (día actual Y días cerrados) — no hay nada
-- sensible acá.
create policy "leer dias de fixture"
  on fixture_days for select
  to anon
  using (true);

create policy "leer partidos de fixture"
  on fixture_matches for select
  to anon
  using (true);

-- fixture_predictions / fixture_picks: SOLO visibles una vez que el
-- día está cerrado ("mostrar posteriormente los pronósticos de todos
-- los participantes"). Mientras el día está "current", nadie puede
-- leer picks ajenos por este camino — el propio pronóstico del
-- usuario se lee exclusivamente vía la Edge Function ff-predict
-- (autenticada con el token de sesión), nunca con la anon key directa.
create policy "leer predicciones de fechas cerradas"
  on fixture_predictions for select
  to anon
  using (exists (
    select 1 from fixture_days d
    where d.id = fixture_predictions.day_id and d.status = 'closed'
  ));

create policy "leer picks de fechas cerradas"
  on fixture_picks for select
  to anon
  using (exists (
    select 1 from fixture_predictions p
    join fixture_days d on d.id = p.day_id
    where p.id = fixture_picks.prediction_id and d.status = 'closed'
  ));

-- No existe NINGUNA policy de insert/update/delete para "anon" en
-- ninguna de las tablas de arriba. Todo write lo hace la service role
-- desde las Edge Functions (ff-auth, ff-predict, ff-sync, ff-admin),
-- que bypasean RLS por diseño de Supabase.
