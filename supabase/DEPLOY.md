# Deploy de la integración real de Fixture

Esto no lo pude correr yo: mi entorno de ejecución no tiene salida de
red a `supabase.co` ni a `api-football.com` (solo a dominios de
paquetes: npm, pypi, github). Armé y verifiqué todo lo que se puede
verificar sin esas dos conexiones — el build del frontend (`npm run
build`), el lint, y una revisión de tipos de las Edge Functions. El
deploy real y la prueba con datos en vivo las tenés que correr vos, acá
abajo están los pasos exactos.

## 0. Qué NO se tocó

- `participants`, `official_results`, `official_crystal_ball`,
  `admin_attempts` — la migración nueva (`0002_fixture_live.sql`) solo
  agrega tablas, no modifica las existentes.
- Posicionamiento y Bola de Cristal siguen exactamente como estaban
  (siguen en `localStorage`, vía `useTestParticipants` /
  `useOfficialTable`) — esta tarea era solo el Fixture.
- Ningún componente cambió de diseño/clases. `Fixture.jsx` solo suma la
  puerta de PIN (mismos inputs/botones que ya existían).
  `AdminFixtureSection.jsx` perdió el formulario de carga manual de
  partidos (ya no hace falta, los trae la API) y ganó "Sincronizar
  ahora" + override manual de resultado.

## 1. Requisitos

- Cuenta en [api-football.com](https://www.api-football.com/) (o
  RapidAPI) con tu API key. El plan free permite 100 requests/día — con
  el cron cada 15 min (ver paso 4) estás usando entre 1 y 3 requests
  por corrida según cuántos partidos sin cerrar haya, así que en días
  con muchos partidos en vivo simultáneos te puede quedar justo. Si te
  pasás, subí el intervalo del cron a `*/30`.
- Un proyecto Supabase ya creado, con el `schema.sql` original ya
  aplicado (si todavía no lo aplicaste, aplicalo primero).
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado y
  logueado (`supabase login`), con el proyecto local linkeado
  (`supabase link --project-ref <tu-project-ref>`).

## 2. Aplicar la migración nueva

```bash
supabase db push
```

Esto crea `fixture_users`, `fixture_days`, `fixture_matches`,
`fixture_predictions`, `fixture_picks`, `fixture_pin_attempts` y sus
policies — ver `supabase/migrations/0002_fixture_live.sql` para el
detalle completo de qué es público y qué no.

## 3. Configurar los secrets de las Edge Functions

Estos viven SOLO server-side — nunca en `.env` del frontend, nunca con
prefijo `VITE_`:

```bash
supabase secrets set API_FOOTBALL_KEY=tu_api_key_de_api_football
supabase secrets set SESSION_SECRET=$(openssl rand -hex 32)
supabase secrets set ADMIN_PASSWORD=elegí-una-contraseña-larga
supabase secrets set FF_LEAGUE_ID=2          # UEFA Champions League en API-Football v3 — confirmalo en tu cuenta antes de correr en serio
supabase secrets set FF_SEASON=2026
supabase secrets set FF_TIMEZONE=America/Argentina/Buenos_Aires
supabase secrets set ALLOWED_ORIGIN=https://tu-dominio-real.com
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase
automáticamente a las funciones — no hace falta setearlos.

**Importante sobre `FF_LEAGUE_ID`**: no tengo forma de confirmar en
vivo que `2` sea el id correcto de la Champions League en tu cuenta de
API-Football (varía entre v2/v3 y entre proveedores). Antes de dejarlo
corriendo solo, probá manualmente:

```bash
curl "https://v3.football.api-sports.io/leagues?name=UEFA%20Champions%20League" \
  -H "x-apisports-key: tu_api_key"
```

y confirmá el `league.id` que te devuelve.

## 4. Deploy de las Edge Functions

```bash
supabase functions deploy ff-sync
supabase functions deploy ff-auth
supabase functions deploy ff-predict
supabase functions deploy ff-admin
```

## 5. Programar la sincronización automática

Abrí el SQL Editor de tu proyecto y corré `supabase/CRON.sql`,
reemplazando `<PROJECT_REF>` y `<SERVICE_ROLE_KEY>` por los tuyos (ver
comentarios en el archivo). Esto deja `pg_cron` + `pg_net` llamando a
`ff-sync` cada 15 minutos sin que nadie tenga que tener la web abierta.

## 6. Variables del frontend

Sin cambios respecto a lo que ya tenías en `.env.example`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 7. Probar el flujo completo con datos reales

1. `supabase functions invoke ff-sync` (o esperá al cron) — debería
   traer los partidos de Champions de hoy si los hay. Respuesta
   esperada: `{ ok: true, matchesImported: N, ... }`.
2. Si `unmatched` viene con nombres — algún equipo de la API no
   matcheó contra los 36 de `src/config/teams.js`. Agregá el alias en
   `supabase/functions/_shared/apiFootball.ts` (mapa `ALIASES`) y
   corré `ff-sync` de nuevo.
3. `npm run dev`, entrá a `/fixture`, elegí un participante, creá tu
   PIN, cargá los pronósticos, mandalos.
4. En `/admin`, sección Fixture: "Sincronizar ahora" trae resultados en
   vivo; el override manual queda para si un partido no cierra solo.
5. Cuando el día cierre (todos los partidos en estado final y ya pasó
   la fecha), la Home debería recalcular el escudo de Fixture del
   ranking y `/fixture` debería mostrar la fecha en "Fechas cerradas"
   con los pronósticos de todos los participantes.

## 8. Si algo no matchea o el cron no corre

- `select * from cron.job_run_details order by start_time desc limit
  20;` — para ver si el cron está corriendo y si falla.
- Los logs de cada función: `supabase functions logs ff-sync`.
