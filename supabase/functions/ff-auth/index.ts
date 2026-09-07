// ff-auth — identidad de Fixture (nombre + PIN de 4 dígitos, sin login).
//
// Acciones (POST { action, ... }):
//   "exists"   { slug }                  → { exists: boolean }
//   "register" { slug, name, pin }       → { token }  (falla si el slug ya tiene cuenta)
//   "verify"   { slug, pin }             → { token }  (rate limited)
//
// El PIN nunca se devuelve ni se loguea. `fixture_pin_attempts` guarda
// solo éxito/fracaso para el rate limiting — 5 intentos fallidos en los
// últimos 15 minutos bloquea nuevos intentos para ese slug.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { corsHeaders, jsonResponse, handleOptions } from "../_shared/cors.ts";
import { hashPin, verifyPin, createSessionToken } from "../_shared/auth.ts";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 64;
}

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

  const { action, slug, name, pin } = body;

  if (!isValidSlug(slug)) return jsonResponse({ error: "slug inválido" }, 400);

  if (action === "exists") {
    const { data } = await supabase.from("fixture_users").select("slug").eq("slug", slug).maybeSingle();
    return jsonResponse({ exists: !!data });
  }

  if (action === "register") {
    if (typeof name !== "string" || name.trim().length === 0) {
      return jsonResponse({ error: "Falta el nombre" }, 400);
    }
    if (!isValidPin(pin)) return jsonResponse({ error: "El PIN debe ser de 4 dígitos" }, 400);

    const { data: existing } = await supabase.from("fixture_users").select("slug").eq("slug", slug).maybeSingle();
    if (existing) return jsonResponse({ error: "Ese usuario ya tiene un PIN creado — iniciá sesión" }, 409);

    const pinHash = await hashPin(pin);
    const { error } = await supabase.from("fixture_users").insert({ slug, name: name.trim(), pin_hash: pinHash });
    if (error) return jsonResponse({ error: "No se pudo crear el usuario" }, 500);

    const token = await createSessionToken(slug, sessionSecret);
    return jsonResponse({ token });
  }

  if (action === "verify") {
    if (!isValidPin(pin)) return jsonResponse({ error: "El PIN debe ser de 4 dígitos" }, 400);

    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await supabase
      .from("fixture_pin_attempts")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug)
      .eq("success", false)
      .gte("attempted_at", since);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return jsonResponse({ error: `Demasiados intentos. Esperá ${WINDOW_MINUTES} minutos e intentá de nuevo.` }, 429);
    }

    const { data: user } = await supabase.from("fixture_users").select("pin_hash").eq("slug", slug).maybeSingle();

    const ok = user ? await verifyPin(pin, user.pin_hash) : false;

    await supabase.from("fixture_pin_attempts").insert({ slug, success: ok });

    if (!ok) return jsonResponse({ error: "PIN incorrecto" }, 401);

    const token = await createSessionToken(slug, sessionSecret);
    return jsonResponse({ token });
  }

  return jsonResponse({ error: "action inválida" }, 400);
});
