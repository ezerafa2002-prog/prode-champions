// ff-admin — las dos acciones sensibles de /admin sobre Fixture:
//   "sync-now"        { password }                          → dispara ff-sync ya mismo
//   "override-result" { password, matchId, home, away }     → carga un resultado a mano
//
// Protegido con una contraseña de admin (ADMIN_PASSWORD, solo server-
// side) y logueado en `admin_attempts` — la misma tabla que ya definía
// schema.sql para esto, sin crear una tabla nueva. No es un sistema de
// login del panel /admin completo (eso ya era un hueco preexistente,
// fuera del alcance de esta tarea) — es específicamente el candado
// para estas dos acciones que ahora tienen poder real sobre datos en
// vivo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { corsHeaders, jsonResponse, handleOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);

  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  if (!adminPassword) return jsonResponse({ error: "Falta ADMIN_PASSWORD en los secrets de la función" }, 500);

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

  const { action, password } = body;
  const ok = typeof password === "string" && password === adminPassword;
  await supabase.from("admin_attempts").insert({ success: ok });

  if (!ok) return jsonResponse({ error: "Contraseña incorrecta" }, 401);

  if (action === "sync-now") {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ff-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
    });
    const result = await res.json();
    return jsonResponse(result, res.status);
  }

  if (action === "override-result") {
    const { matchId, home, away } = body;
    if (typeof matchId !== "string" || !Number.isInteger(home) || !Number.isInteger(away)) {
      return jsonResponse({ error: "Datos inválidos" }, 400);
    }
    const { error } = await supabase
      .from("fixture_matches")
      .update({ real_home: home, real_away: away, status_short: "FT", updated_at: new Date().toISOString() })
      .eq("id", matchId);
    if (error) return jsonResponse({ error: "No se pudo actualizar el resultado" }, 500);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "action inválida" }, 400);
});
