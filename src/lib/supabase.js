import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sin estas dos variables, `createClient` tira una excepción al
// evaluarse este módulo — y como Fixture.jsx (importado globalmente en
// App.jsx para el ruteo) lo importa transitivamente, esa excepción
// pasaba a nivel de carga del bundle entero, antes de que React
// llegara a montar nada: toda la app quedaba en blanco, no solo
// /fixture. Por eso acá NUNCA se llama a createClient sin las dos
// variables presentes — el resto de la app (/, /jugar, /admin,
// /jugador/:slug) no depende de Supabase para nada y tiene que poder
// arrancar igual.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[Fixture] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — el Fixture en vivo queda deshabilitado, el resto de la app funciona normal."
  );
}

// La clave anónima solo puede: leer la vista pública, e insertar un prode nuevo (status: submitted).
// Nunca puede editar ni borrar — eso pasa exclusivamente por la Edge Function de admin.
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
