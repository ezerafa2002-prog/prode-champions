// ff-sync — el corazón de la integración. Pensada para ser llamada por
// pg_cron cada N minutos (ver supabase/CRON.sql), y también a demanda
// desde /admin ("Sincronizar ahora", vía ff-admin que reenvía acá con
// el header interno).
//
// En cada corrida:
//   1. Calcula "hoy" en la zona horaria configurada (Argentina por
//      defecto) y trae de API-Football los partidos de Champions de esa
//      fecha. Si hay partidos y no existe el día en fixture_days, lo
//      crea con status "current" (y baja cualquier otro día que
//      hubiera quedado "current" por error).
//   2. Refresca estado/resultado de todos los partidos que todavía no
//      están en un estado final (NS, 1H, HT, 2H, etc.) — incluye
//      partidos de hoy Y de días previos que por algún motivo no hayan
//      cerrado (partido suspendido y reprogramado, por ejemplo).
//   3. Marca como "closed" cualquier día cuyos partidos estén TODOS en
//      estado final.
//   4. Nombres de equipo que no matchean contra los 36 de teams.js se
//      omiten y quedan listados en la respuesta (unmatched) para que
//      admin los pueda ver — nunca se inventa un equipo.
//
// No requiere que nadie tenga la web abierta: corre server-side.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { corsHeaders, jsonResponse, handleOptions } from "../_shared/cors.ts";
import { fetchFixturesByDate, fetchFixturesByIds, matchTeamName, FINAL_STATUSES } from "../_shared/apiFootball.ts";

const TIMEZONE = Deno.env.get("FF_TIMEZONE") ?? "America/Argentina/Buenos_Aires";
const LEAGUE_ID = Deno.env.get("FF_LEAGUE_ID") ?? "2"; // UEFA Champions League en API-Football v3
const SEASON = Deno.env.get("FF_SEASON") ?? "2026";

function todayInTimezone(tz: string): string {
  // YYYY-MM-DD en la zona horaria indicada, sin depender de librerías.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function labelForDate(dateStr: string, tz: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const formatted = new Intl.DateTimeFormat("es-AR", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) return jsonResponse({ error: "Falta API_FOOTBALL_KEY en los secrets de la función" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const unmatched: string[] = [];

  try {
    // ── 1. Importar el día de hoy ──────────────────────────────
    const todayStr = todayInTimezone(TIMEZONE);
    const apiFixtures = await fetchFixturesByDate(apiKey, LEAGUE_ID, SEASON, todayStr, TIMEZONE);

    const matchable = apiFixtures
      .map((f) => {
        const home = matchTeamName(f.teams.home.name);
        const away = matchTeamName(f.teams.away.name);
        if (!home) unmatched.push(f.teams.home.name);
        if (!away) unmatched.push(f.teams.away.name);
        return home && away ? { f, home, away } : null;
      })
      .filter((x): x is { f: (typeof apiFixtures)[number]; home: string; away: string } => x !== null);

    if (matchable.length > 0) {
      const { data: existingDay } = await supabase
        .from("fixture_days")
        .select("id")
        .eq("match_date", todayStr)
        .maybeSingle();

      let dayId = existingDay?.id as string | undefined;

      if (!dayId) {
        // Solo puede haber un día "current" — bajamos cualquiera que
        // hubiera quedado así (no debería pasar en operación normal,
        // pero una corrida fallida a mitad de camino podría dejarlo).
        await supabase.from("fixture_days").update({ status: "closed" }).eq("status", "current");

        const earliestKickoff = matchable
          .map((m) => m.f.fixture.date)
          .sort()[0];

        const { data: inserted, error } = await supabase
          .from("fixture_days")
          .insert({
            match_date: todayStr,
            label: labelForDate(todayStr, TIMEZONE),
            status: "current",
            locks_at: earliestKickoff,
          })
          .select("id")
          .single();

        if (error) throw error;
        dayId = inserted.id;
      }

      for (const { f, home, away } of matchable) {
        await supabase.from("fixture_matches").upsert(
          {
            day_id: dayId,
            api_fixture_id: f.fixture.id,
            home_team_id: home,
            away_team_id: away,
            kickoff_utc: f.fixture.date,
            status_short: f.fixture.status.short,
            real_home: f.goals.home,
            real_away: f.goals.away,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "api_fixture_id" }
        );
      }
    }

    // ── 2. Refrescar partidos no finalizados (hoy y días previos) ──
    const { data: pendingMatches } = await supabase
      .from("fixture_matches")
      .select("id, api_fixture_id, day_id, status_short")
      .not("status_short", "in", `(${[...FINAL_STATUSES].join(",")})`);

    const idsToRefresh = (pendingMatches ?? []).map((m) => m.api_fixture_id as number);

    if (idsToRefresh.length > 0) {
      const refreshed = await fetchFixturesByIds(apiKey, idsToRefresh);
      for (const f of refreshed) {
        await supabase
          .from("fixture_matches")
          .update({
            status_short: f.fixture.status.short,
            real_home: f.goals.home,
            real_away: f.goals.away,
            updated_at: new Date().toISOString(),
          })
          .eq("api_fixture_id", f.fixture.id);
      }
    }

    // ── 3. Cerrar días cuyos partidos estén todos finalizados ──────
    const { data: openDays } = await supabase
      .from("fixture_days")
      .select("id, match_date")
      .neq("status", "closed");

    for (const day of openDays ?? []) {
      const { data: matches } = await supabase
        .from("fixture_matches")
        .select("status_short")
        .eq("day_id", day.id);

      const allFinal = (matches ?? []).length > 0 && (matches ?? []).every((m) => FINAL_STATUSES.has(m.status_short));

      // Un día solo cierra si ya no es "hoy" (evita cerrar el día
      // activo apenas termina el último partido, cuando todavía
      // podría haber que mostrar el resultado antes de que empiece el
      // día siguiente) — se cierra en la corrida del día siguiente,
      // cuando además ya no es el "current".
      if (allFinal && day.match_date !== todayStr) {
        await supabase.from("fixture_days").update({ status: "closed" }).eq("id", day.id);
      }
    }

    return jsonResponse({
      ok: true,
      today: todayStr,
      matchesImported: matchable.length,
      matchesRefreshed: idsToRefresh.length,
      unmatched: [...new Set(unmatched)],
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});
