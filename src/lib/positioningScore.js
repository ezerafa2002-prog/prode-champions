import { POSITIONING } from "../config/scoring";
import { TEAMS } from "../config/teams";

// Completa una predicción de 36 a partir del Top 8 elegido: los 8
// primeros van en el orden elegido, el resto se completa en el orden
// base de TEAMS (excluyendo los ya elegidos) — determinístico, sin
// necesitar que el admin ordene los otros 28 a mano.
export function buildFullOrderFromTop8(top8Ids) {
  const rest = TEAMS.map((t) => t.id).filter((id) => !top8Ids.includes(id));
  return [...top8Ids, ...rest];
}

function zoneOf(position) {
  return POSITIONING.zones.find((z) => position >= z.from && position <= z.to)?.key ?? null;
}

// predictedOrder / officialOrder: arrays de 36 team ids, en orden de
// posición (índice 0 = 1.º puesto). Devuelve el puntaje total de
// Posicionamiento para esa predicción contra esa tabla oficial.
export function calculatePositioningScore(predictedOrder, officialOrder) {
  if (!predictedOrder || !officialOrder) return 0;

  return predictedOrder.reduce((sum, teamId, i) => {
    const predictedPosition = i + 1;
    const realIndex = officialOrder.indexOf(teamId);
    if (realIndex === -1) return sum; // equipo sin resultado oficial todavía

    const realPosition = realIndex + 1;
    if (predictedPosition === realPosition) return sum + POSITIONING.exactMatch;
    if (zoneOf(predictedPosition) === zoneOf(realPosition)) return sum + POSITIONING.zoneMatch;
    return sum;
  }, 0);
}
