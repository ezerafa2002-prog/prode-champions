// Puntuación de Fixture (partido por partido) — mecánica nueva,
// separada de Posicionamiento y Bola de Cristal. No las modifica.

export function outcomeOf(home, away) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

// pred/real: { home: number, away: number }. `real` puede ser null si
// el partido todavía no tiene resultado cargado.
export function matchPoints(pred, real, isFeatured) {
  if (!pred || !real || real.home == null || real.away == null) return 0;

  const exact = pred.home === real.home && pred.away === real.away;
  if (exact) return isFeatured ? 10 : 5;

  const sameOutcome = outcomeOf(pred.home, pred.away) === outcomeOf(real.home, real.away);
  if (sameOutcome) return isFeatured ? 6 : 3;

  return 0;
}

// Puntaje total de una fecha para una predicción dada.
export function matchdayScore(matchday, prediction) {
  if (!prediction) return 0;

  return matchday.matches.reduce((sum, m) => {
    const pred = prediction.picks?.[m.id];
    const real = m.realHome != null && m.realAway != null ? { home: m.realHome, away: m.realAway } : null;
    return sum + matchPoints(pred, real, prediction.featuredMatchId === m.id);
  }, 0);
}

// Para un participante, suma los puntos que obtuvo en cada equipo a
// partir de las fechas ya CERRADAS. Cada partido aporta sus puntos
// tanto al equipo local como al visitante (el pronóstico fue "de ese
// partido", involucra a los dos).
export function teamPointsForParticipant(matchdays, predictions, slug) {
  const tally = {};

  matchdays
    .filter((md) => md.status === "closed")
    .forEach((md) => {
      const prediction = predictions[slug]?.[md.id];
      if (!prediction) return;

      md.matches.forEach((m) => {
        const pred = prediction.picks?.[m.id];
        if (!pred || m.realHome == null || m.realAway == null) return;

        const pts = matchPoints(pred, { home: m.realHome, away: m.realAway }, prediction.featuredMatchId === m.id);
        tally[m.home] = (tally[m.home] ?? 0) + pts;
        tally[m.away] = (tally[m.away] ?? 0) + pts;
      });
    });

  return tally;
}

// El equipo con más puntos acumulados para ese participante — es la
// única fuente del escudo de Fixture en el ranking. `null` si todavía
// no hay ninguna fecha cerrada con datos suyos.
export function bestFixtureTeamId(matchdays, predictions, slug) {
  const tally = teamPointsForParticipant(matchdays, predictions, slug);
  let best = null;
  let bestPts = -Infinity;

  for (const [teamId, pts] of Object.entries(tally)) {
    if (pts > bestPts) {
      best = teamId;
      bestPts = pts;
    }
  }

  return best;
}

// Para el detalle de una fecha cerrada: cuenta cuántos participantes
// pronosticaron cada resultado (local/empate/visita) para un partido,
// y si alguno le sacó 3 votos o más de ventaja al segundo.
export function outcomeTally(matchdayId, matchId, predictions) {
  const counts = { home: 0, away: 0, draw: 0 };

  Object.values(predictions).forEach((byMatchday) => {
    const pick = byMatchday?.[matchdayId]?.picks?.[matchId];
    if (!pick) return;
    counts[outcomeOf(pick.home, pick.away)]++;
  });

  return counts;
}

export function favoriteOutcome(counts) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return sorted[0]?.[1] > 0 ? sorted[0][0] : null;
  const [firstKey, firstCount] = sorted[0];
  const [, secondCount] = sorted[1];
  return firstCount - secondCount >= 3 ? firstKey : null;
}
