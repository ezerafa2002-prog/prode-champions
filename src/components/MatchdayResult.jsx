import TeamBadge from "./TeamBadge";
import { TEAMS } from "../config/teams";
import { matchPoints, outcomeTally, favoriteOutcome } from "../lib/fixtureScoring";

function teamLabel(id) {
  return TEAMS.find((t) => t.id === id)?.name ?? id;
}

export default function MatchdayResult({ matchday, prediction, predictions }) {
  return (
    <div className="recede-panel rounded-lg border border-panelLight p-4 sm:p-5">
      <p className="font-sans font-bold text-sm text-bone mb-4">{matchday.label} · Cerrada</p>

      <div className="flex flex-col gap-5">
        {matchday.matches.map((m) => {
          const pred = prediction?.picks?.[m.id];
          const real =
            m.realHome != null && m.realAway != null ? { home: m.realHome, away: m.realAway } : null;
          const isFeatured = prediction?.featuredMatchId === m.id;
          const points = matchPoints(pred, real, isFeatured);

          const counts = outcomeTally(matchday.id, m.id, predictions);
          const favorite = favoriteOutcome(counts);

          return (
            <div key={m.id} className="border-t border-panelLight/40 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamBadge teamId={m.home} name={teamLabel(m.home)} size="sm" />
                  <span className="font-sans text-sm text-bone truncate">{teamLabel(m.home)}</span>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <span className="font-head font-bold text-xl text-bone tabular-nums">
                    {real ? `${real.home} - ${real.away}` : "s/d"}
                  </span>
                  {isFeatured && (
                    <span className="font-sans text-[10px] tracking-widest uppercase text-gold mt-0.5">
                      destacado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="font-sans text-sm text-bone truncate">{teamLabel(m.away)}</span>
                  <TeamBadge teamId={m.away} name={teamLabel(m.away)} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="font-sans text-xs text-slate">
                  Tu pronóstico: {pred ? `${pred.home} - ${pred.away}` : "sin cargar"}
                </span>
                <span className="font-head font-bold text-sm text-electric tabular-nums">
                  +{points} pts
                </span>
              </div>

              {/* Pronósticos de todos los participantes, en formato compacto */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1">
                    {favorite === "home" && <span className="text-gold text-xs">★</span>}
                    <TeamBadge teamId={m.home} name={teamLabel(m.home)} size="xs" />
                  </span>
                  <span className="font-sans text-[11px] text-slate">{counts.home}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-sans text-[11px] text-slate">
                    {favorite === "draw" && <span className="text-gold mr-1">★</span>}
                    Empate
                  </span>
                  <span className="font-sans text-[11px] text-slate">{counts.draw}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1">
                    <TeamBadge teamId={m.away} name={teamLabel(m.away)} size="xs" />
                    {favorite === "away" && <span className="text-gold text-xs">★</span>}
                  </span>
                  <span className="font-sans text-[11px] text-slate">{counts.away}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
