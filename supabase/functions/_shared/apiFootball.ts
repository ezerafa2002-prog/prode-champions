// Cliente mínimo de API-Football (v3.football.api-sports.io) + matching
// de nombres de equipo contra la lista fija de 36 equipos de
// src/config/teams.js.
//
// Por qué matching por nombre y no por id numérico de equipo: no tengo
// forma de verificar en vivo los 36 ids numéricos de API-Football desde
// este entorno, y guardar ids adivinados sería peor que normalizar
// nombres — un id numérico mal cargado falla en silencio, un nombre que
// no matchea queda logueado y visible. Si algún nombre de API-Football
// no matchea nunca, se agrega al mapa ALIASES de abajo.

const API_BASE = "https://v3.football.api-sports.io";

// Debe ser EXACTAMENTE la misma lista que src/config/teams.js (los ids
// son los nombres tal cual). Se duplica acá porque las Edge Functions
// corren en un runtime Deno separado del bundle de Vite.
export const TEAM_IDS = [
  "AEK Athens", "Arsenal", "Aston Villa", "Atlético de Madrid", "Barcelona",
  "Bayern München", "Bodo-Glimt", "Borussia Dortmund", "Club Brugge", "Como",
  "Fenerbahçe", "Feyenoord", "Galatasaray", "Inter", "LASK", "RB Leipzig",
  "Lens", "Lille", "Liverpool", "Manchester City", "Manchester United",
  "Napoli", "Paris Saint-Germain", "Porto", "PSV", "Real Betis",
  "Real Madrid", "Roma", "Sabah", "Shakhtar Donetsk", "Slavia Praha",
  "Slovan Bratislava", "Sporting CP", "Stuttgart", "Villarreal", "Viking",
];

// Nombre tal como suele devolverlo API-Football → id interno (solo los
// casos que no matchean por normalización simple).
const ALIASES: Record<string, string> = {
  "bayern munich": "Bayern München",
  "atletico madrid": "Atlético de Madrid",
  "paris saint germain": "Paris Saint-Germain",
  "psg": "Paris Saint-Germain",
  "internazionale": "Inter",
  "inter milan": "Inter",
  "as roma": "Roma",
  "psv eindhoven": "PSV",
  "slavia prague": "Slavia Praha",
  "bodo glimt": "Bodo-Glimt",
  "fk bodo glimt": "Bodo-Glimt",
  "club brugge kv": "Club Brugge",
  "brugge": "Club Brugge",
  "galatasaray sk": "Galatasaray",
  "fenerbahce": "Fenerbahçe",
};

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca acentos/diéresis
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const NORMALIZED_TO_ID = new Map<string, string>(
  TEAM_IDS.map((id) => [normalize(id), id])
);

/** Devuelve el id interno (= id de teams.js) para un nombre de API-Football, o null si no matchea ninguno de los 36. */
export function matchTeamName(apiName: string): string | null {
  const norm = normalize(apiName);
  if (ALIASES[norm]) return ALIASES[norm];
  return NORMALIZED_TO_ID.get(norm) ?? null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string; // ISO
    status: { short: string };
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: { home: number | null; away: number | null };
}

export async function fetchFixturesByDate(
  apiKey: string,
  leagueId: string,
  season: string,
  date: string,
  timezone: string
): Promise<ApiFixture[]> {
  const url = `${API_BASE}/fixtures?league=${leagueId}&season=${season}&date=${date}&timezone=${encodeURIComponent(timezone)}`;
  const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
  if (!res.ok) throw new Error(`API-Football fixtures?date= respondió ${res.status}`);
  const body = await res.json();
  if (body.errors && Object.keys(body.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(body.errors)}`);
  }
  return body.response ?? [];
}

export async function fetchFixturesByIds(apiKey: string, ids: number[]): Promise<ApiFixture[]> {
  if (ids.length === 0) return [];
  const url = `${API_BASE}/fixtures?ids=${ids.join("-")}`;
  const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
  if (!res.ok) throw new Error(`API-Football fixtures?ids= respondió ${res.status}`);
  const body = await res.json();
  if (body.errors && Object.keys(body.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(body.errors)}`);
  }
  return body.response ?? [];
}

// Estados finales de API-Football — una vez acá, el partido no cambia más.
export const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO"]);
