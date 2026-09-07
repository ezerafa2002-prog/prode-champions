// Lista centralizada de los 36 equipos de la fase de liga 2026/27.
//
// IMPORTANTE: `id` es exactamente el nombre del archivo (sin extensión)
// dentro de /public/escudos/ — los archivos reales son .webp con el
// nombre del equipo tal cual, espacios y tildes incluidos
// (ej: "Bayern München.webp", "Atlético de Madrid.webp"). No se
// slugifica: el id ES el nombre, para que coincida siempre con el
// archivo real sin transformación de por medio.
//
// Bodø/Glimt es la única excepción de origen: se usa "Bodo-Glimt"
// (sin barra) porque el nombre de archivo no puede contener "/".

const NAMES = [
  "AEK Athens",
  "Arsenal",
  "Aston Villa",
  "Atlético de Madrid",
  "Barcelona",
  "Bayern München",
  "Bodo-Glimt",
  "Borussia Dortmund",
  "Club Brugge",
  "Como",
  "Fenerbahçe",
  "Feyenoord",
  "Galatasaray",
  "Inter",
  "LASK",
  "RB Leipzig",
  "Lens",
  "Lille",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Napoli",
  "Paris Saint-Germain",
  "Porto",
  "PSV",
  "Real Betis",
  "Real Madrid",
  "Roma",
  "Sabah",
  "Shakhtar Donetsk",
  "Slavia Praha",
  "Slovan Bratislava",
  "Sporting CP",
  "Stuttgart",
  "Villarreal",
  "Viking",
];

export const TEAMS = NAMES.map((name) => ({ id: name, name }));

export function getTeamByName(name) {
  return TEAMS.find((t) => t.name === name);
}

export function crestPath(teamId) {
  return `/escudos/${encodeURIComponent(teamId)}.webp`;
}
