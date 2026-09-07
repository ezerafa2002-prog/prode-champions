// ff-predict — todo lo que requiere saber "quién sos" pasa por acá,
// autenticado con el token que devolvió ff-auth. El frontend NUNCA lee
// ni escribe fixture_predictions/fixture_picks directo con la anon key
// para el día abierto (ver policies en la migración: por diseño, con
// una sola anon key compartida no hay forma de que RLS distinga entre
// usuarios sin esto).
//
// Acciones (POST { action, token, ... }):
//   "get-my-day" {}                                   → { day, matches, myPrediction }
//     Si el usuario todavía no tiene fila de predicción para el día
//     activo, la crea acá mismo y sortea el destacado UNA sola vez.
//   "set-pick"   { matchId, home, away }               → { ok: true }
//   "submit"     {}                                    → { ok: true }
//
// Ambas acciones de escritura rechazan si el día ya cerró o si ya pasó
// `locks_at` (arrancó el primer partido) — el cierre de carga es
// automático y no depende de que el admin haga nada.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { corsHeaders, jsonResponse, handleOptions } from "../_shared/cors.ts";
import { verifySessionToken } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);

  const sessionSecret = Deno.env.get("SESSION_SECRET");
  if (!sessionSecret) return jsonResponse({ error: "Falta SESSION_SECRET en los secrets de la función" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body inválido" }, 400);
  }

  const { action, token } = body;
  const slug = typeof token === "string" ? await verifySessionToken(token, sessionSecret) : null;
  if (!slug) return jsonResponse({ error: "Sesión inválida o vencida — ingresá tu PIN de nuevo" }, 401);

  const { data: currentDay } = await supabase
    .from("fixture_days")
    .select("*")
    .eq("status", "current")
    .maybeSingle();

  if (!currentDay) return jsonResponse({ day: null, matches: [], myPrediction: null });

  const { data: matches } = await supabase
    .from("fixture_matches")
    .select("id, home_team_id, away_team_id, kickoff_utc, status_short, real_home, real_away")
    .eq("day_id", currentDay.id)
    .order("kickoff_utc", { ascending: true });

  const locked = currentDay.locks_at ? new Date(currentDay.locks_at).getTime() <= Date.now() : false;

  if (action === "get-my-day") {
    let { data: prediction } = await supabase
      .from("fixture_predictions")
      .select("id, featured_match_id, submitted")
      .eq("user_slug", slug)
      .eq("day_id", currentDay.id)
      .maybeSingle();

    if (!prediction && matches && matches.length > 0) {
      // Primera vez que este usuario entra a este día: sortea el
      // destacado y crea la fila — a partir de acá nunca vuelve a cambiar.
      const featured = matches[Math.floor(Math.random() * matches.length)];
      const { data: inserted, error } = await supabase
        .from("fixture_predictions")
        .insert({ user_slug: slug, day_id: currentDay.id, featured_match_id: featured.id })
        .select("id, featured_match_id, submitted")
        .single();
      if (error) return jsonResponse({ error: "No se pudo crear el pronóstico" }, 500);
      prediction = inserted;
    }

    let picks: Record<string, { home: number; away: number }> = {};
    if (prediction) {
      const { data: pickRows } = await supabase
        .from("fixture_picks")
        .select("match_id, pred_home, pred_away")
        .eq("prediction_id", prediction.id);
      picks = Object.fromEntries((pickRows ?? []).map((p) => [p.match_id, { home: p.pred_home, away: p.pred_away }]));
    }

    return jsonResponse({
      day: { ...currentDay, locked },
      matches,
      myPrediction: prediction
        ? { featuredMatchId: prediction.featured_match_id, submitted: prediction.submitted, picks }
        : null,
    });
  }

  if (locked) return jsonResponse({ error: "Las predicciones de esta fecha ya cerraron" }, 403);

  const { data: prediction } = await supabase
    .from("fixture_predictions")
    .select("id, submitted")
    .eq("user_slug", slug)
    .eq("day_id", currentDay.id)
    .maybeSingle();

  if (!prediction) return jsonResponse({ error: "Todavía no existe un pronóstico para este día — llamá a get-my-day primero" }, 400);
  if (prediction.submitted) return jsonResponse({ error: "Ya enviaste tu pronóstico para esta fecha" }, 403);

  if (action === "set-pick") {
    const { matchId, home, away } = body;
    if (typeof matchId !== "string" || !Number.isInteger(home) || !Number.isInteger(away) || (home as number) < 0 || (away as number) < 0) {
      return jsonResponse({ error: "Pick inválido" }, 400);
    }
    const belongsToDay = (matches ?? []).some((m) => m.id === matchId);
    if (!belongsToDay) return jsonResponse({ error: "Ese partido no pertenece al día activo" }, 400);

    const { error } = await supabase
      .from("fixture_picks")
      .upsert({ prediction_id: prediction.id, match_id: matchId, pred_home: home, pred_away: away }, { onConflict: "prediction_id,match_id" });
    if (error) return jsonResponse({ error: "No se pudo guardar el pick" }, 500);
    return jsonResponse({ ok: true });
  }

  if (action === "submit") {
    const { count } = await supabase
      .from("fixture_picks")
      .select("match_id", { count: "exact", head: true })
      .eq("prediction_id", prediction.id);

    if ((count ?? 0) < (matches ?? []).length) {
      return jsonResponse({ error: "Faltan partidos por cargar" }, 400);
    }

    const { error } = await supabase
      .from("fixture_predictions")
      .update({ submitted: true, submitted_at: new Date().toISOString() })
      .eq("id", prediction.id);
    if (error) return jsonResponse({ error: "No se pudo enviar el pronóstico" }, 500);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "action inválida" }, 400);
});
