// CORS compartido por todas las Edge Functions de Fixture.
// Restringí ALLOWED_ORIGIN a tu dominio real en producción (Supabase
// permite setear esto como secret: `supabase secrets set ALLOWED_ORIGIN=https://tu-dominio.com`).
// Si no está seteado, cae a "*" para no trabar el desarrollo local.

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function handleOptions(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
