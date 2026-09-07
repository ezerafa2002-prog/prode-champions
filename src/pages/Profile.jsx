import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import TeamBadge from "../components/TeamBadge";
import { TEAMS } from "../config/teams";
import { CRYSTAL_BALL } from "../config/crystalBall";
import { calculatePositioningScore } from "../lib/positioningScore";
import { useOfficialTable } from "../hooks/useOfficialTable";
import { useTestParticipants } from "../hooks/useTestParticipants";

function teamLabel(id) {
  return TEAMS.find((t) => t.id === id)?.name ?? id;
}

export default function Profile() {
  const { slug } = useParams();
  const { officialOrder } = useOfficialTable();
  const { participants } = useTestParticipants();

  const ranked = participants
    .map((p) => {
      const positioningScore = calculatePositioningScore(p.positioning, officialOrder);
      return { ...p, positioningScore, total: positioningScore + p.crystalBall };
    })
    .sort((a, b) => b.total - a.total);

  const rank = ranked.findIndex((p) => p.slug === slug) + 1;
  const participant = ranked.find((p) => p.slug === slug);

  if (!participant) {
    return (
      <Layout>
        <div className="flex flex-col items-center text-center py-16 px-4">
          <p className="font-serif italic font-semibold text-2xl text-bone">
            No encontramos ese Prode
          </p>
          <p className="font-sans text-sm text-slate mt-3 max-w-sm">
            El participante que buscás no existe todavía, o el link está mal escrito.
          </p>
          <Link
            to="/"
            className="font-sans font-bold text-sm tracking-[0.15em] uppercase text-bone mt-6 hover:text-electric transition-colors"
          >
            Volver al ranking
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-8 pb-4 flex flex-col items-center text-center">
        <p className="font-serif italic font-semibold text-3xl text-bone">{participant.name}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="font-head font-bold text-2xl text-gold tabular-nums">#{rank}</span>
          <span className="font-head font-bold text-2xl text-bone tabular-nums">
            {participant.total} pts
          </span>
        </div>
        <p className="font-sans text-xs text-slate mt-2">
          {participant.positioningScore} posicionamiento · {participant.crystalBall} bola de cristal
        </p>
      </div>

      {/* ── Posicionamiento: las 36 predicciones, tal como se enviaron ── */}
      <section className="pb-8">
        <p className="font-sans font-bold text-[11px] tracking-[0.25em] uppercase text-slate mb-3">
          Posicionamiento
        </p>
        <div className="recede-panel rounded-lg border border-panelLight shadow-card overflow-hidden max-h-96 overflow-y-auto">
          {participant.positioning.map((teamId, i) => (
            <div
              key={teamId}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2 border-b border-panelLight/40 last:border-b-0"
            >
              <span className="font-head font-bold tabular-nums text-sm w-7 text-slate shrink-0">
                {i + 1}
              </span>
              <TeamBadge teamId={teamId} name={teamLabel(teamId)} size="xs" />
              <span className="font-sans text-sm text-bone flex-1 truncate">
                {teamLabel(teamId)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bola de Cristal: las respuestas reales, si las hay ── */}
      <section className="pb-12">
        <p className="font-sans font-bold text-[11px] tracking-[0.25em] uppercase text-slate mb-3">
          Bola de Cristal
        </p>

        {!participant.crystalBallAnswers && (
          <p className="font-sans text-sm text-slate">
            Este participante no tiene respuestas detalladas registradas.
          </p>
        )}

        {participant.crystalBallAnswers && (
          <div className="flex flex-col gap-4">
            {CRYSTAL_BALL.map((cat) => {
              const answers = participant.crystalBallAnswers[cat.key] ?? {};
              return (
                <div
                  key={cat.key}
                  className="rounded-lg bg-black/[0.12] border border-panelLight/40 px-5 py-5"
                >
                  <p className="font-sans font-bold text-sm tracking-[0.1em] uppercase text-bone mb-3">
                    {cat.label}
                  </p>
                  <div className="flex flex-col gap-2">
                    {cat.questions.map((q) => {
                      const value = answers[q.key];
                      return (
                        <div key={q.key} className="flex items-center justify-between gap-3">
                          <span className="font-sans text-sm text-slate">{q.label}</span>
                          {q.type === "team" && value ? (
                            <span className="flex items-center gap-2 shrink-0">
                              <TeamBadge teamId={value} name={teamLabel(value)} size="xs" />
                              <span className="font-sans text-sm text-bone">{teamLabel(value)}</span>
                            </span>
                          ) : (
                            <span className="font-sans text-sm text-bone shrink-0">
                              {value ?? "—"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
