import { supabase, isSupabaseConfigured } from "./supabase";

// Mensaje único para toda acción que requiera Supabase y no lo tenga
// configurado — así useFixture/Fixture.jsx pueden distinguirlo de un
// error real de red o de la Edge Function.
export class FixtureUnavailableError extends Error {
  constructor() {
    super("Fixture no está disponible en este entorno (falta configuración de Supabase).");
    this.name = "FixtureUnavailableError";
  }
}

// ── Lecturas públicas (van directo con la anon key — ver RLS en
//    supabase/migrations/0002_fixture_live.sql) ──────────────────────

// Todos los días (actual + cerrados), con sus partidos, en la misma
// forma que ya consumían Fixture.jsx / MatchdayResult.jsx / Home.jsx
// cuando esto era localStorage: { id, label, status, matches: [...] }.
// Sin Supabase configurado devuelve directamente [] (no revienta): así
// Home.jsx puede seguir calculando el ranking sin Fixture con normalidad.
export async function fetchDays() {
  if (!isSupabaseConfigured) return [];

  const { data: days, error: daysError } = await supabase
    .from("fixture_days")
    .select("id, match_date, label, status, locks_at")
    .order("match_date", { ascending: true });
  if (daysError) throw daysError;
  if (!days || days.length === 0) return [];

  const { data: matches, error: matchesError } = await supabase
    .from("fixture_matches")
    .select("id, day_id, home_team_id, away_team_id, real_home, real_away, status_short, kickoff_utc")
    .in("day_id", days.map((d) => d.id))
    .order("kickoff_utc", { ascending: true });
  if (matchesError) throw matchesError;

  return days.map((d) => ({
    id: d.id,
    label: d.label,
    status: d.status,
    locksAt: d.locks_at,
    matches: (matches ?? [])
      .filter((m) => m.day_id === d.id)
      .map((m) => ({
        id: m.id,
        home: m.home_team_id,
        away: m.away_team_id,
        realHome: m.real_home,
        realAway: m.real_away,
        statusShort: m.status_short,
      })),
  }));
}

// Pronósticos de TODOS los participantes para las fechas ya cerradas —
// público por diseño ("mostrar posteriormente los pronósticos de todos
// los participantes y el favorito del grupo"). Forma:
// { [slug]: { [dayId]: { featuredMatchId, picks: { matchId: {home,away} }, submitted } } }
export async function fetchClosedPredictions(closedDayIds) {
  if (!isSupabaseConfigured || closedDayIds.length === 0) return {};

  const { data: predictions, error } = await supabase
    .from("fixture_predictions")
    .select("id, user_slug, day_id, featured_match_id, submitted")
    .in("day_id", closedDayIds);
  if (error) throw error;
  if (!predictions || predictions.length === 0) return {};

  const { data: picks } = await supabase
    .from("fixture_picks")
    .select("prediction_id, match_id, pred_home, pred_away")
    .in("prediction_id", predictions.map((p) => p.id));

  const result = {};
  for (const p of predictions) {
    const myPicks = Object.fromEntries(
      (picks ?? [])
        .filter((pk) => pk.prediction_id === p.id)
        .map((pk) => [pk.match_id, { home: pk.pred_home, away: pk.pred_away }])
    );
    result[p.user_slug] ??= {};
    result[p.user_slug][p.day_id] = {
      featuredMatchId: p.featured_match_id,
      submitted: p.submitted,
      picks: myPicks,
    };
  }
  return result;
}

// Nombres públicos (slug → name) de quienes tienen cuenta de Fixture —
// para mostrar nombres reales en "pronósticos de todos" sin exponer nada del PIN.
export async function fetchFixtureUserNames() {
  if (!isSupabaseConfigured) return {};

  const { data, error } = await supabase.from("fixture_users_public").select("slug, name");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((u) => [u.slug, u.name]));
}

// ── Edge Functions (todo lo que requiere saber "quién sos") ─────────

async function invoke(fn, body) {
  if (!isSupabaseConfigured) throw new FixtureUnavailableError();

  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // supabase-js no siempre expone el body del error con detalle —
    // intentamos leerlo para mostrar el mensaje real de la función.
    const msg = error.context ? await error.context.json().catch(() => null) : null;
    throw new Error(msg?.error ?? error.message ?? "Error de red");
  }
  return data;
}

export function checkFixtureAccountExists(slug) {
  return invoke("ff-auth", { action: "exists", slug }).then((r) => r.exists);
}

export function registerFixtureAccount(slug, name, pin) {
  return invoke("ff-auth", { action: "register", slug, name, pin }).then((r) => r.token);
}

export function loginFixtureAccount(slug, pin) {
  return invoke("ff-auth", { action: "verify", slug, pin }).then((r) => r.token);
}

export function getMyDay(token) {
  return invoke("ff-predict", { action: "get-my-day", token });
}

export function setPick(token, matchId, home, away) {
  return invoke("ff-predict", { action: "set-pick", token, matchId, home, away });
}

export function submitPrediction(token) {
  return invoke("ff-predict", { action: "submit", token });
}

export function syncNow(password) {
  return invoke("ff-admin", { action: "sync-now", password });
}

export function overrideResult(password, matchId, home, away) {
  return invoke("ff-admin", { action: "override-result", password, matchId, home, away });
}
