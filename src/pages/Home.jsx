import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Header from "../components/Header";
import RankingList from "../components/RankingList";
import PlaySection from "../components/PlaySection";
import RulesSummary from "../components/RulesSummary";
import { TEAMS } from "../config/teams";
import { calculatePositioningScore } from "../lib/positioningScore";
import { bestFixtureTeamId } from "../lib/fixtureScoring";
import { useOfficialTable } from "../hooks/useOfficialTable";
import { useTestParticipants } from "../hooks/useTestParticipants";
import { useFixture } from "../hooks/useFixture";

// Los participantes salen enteramente del estado administrable de
// /admin (useTestParticipants). `positioning` (36 equipos completos)
// sigue siendo la única fuente del puntaje de Posicionamiento y de la
// tira de 8 escudos pronosticados (topPicks) — el Fixture no las toca.
// El escudo individual que aparece junto al nombre es aparte: sale del
// equipo con más puntos acumulados en el Fixture (o vacío si todavía
// no hay ninguna fecha cerrada con datos suyos).
export default function Home() {
  const navigate = useNavigate();
  const { officialOrder } = useOfficialTable();
  const { participants } = useTestParticipants();
  const { matchdays, predictions } = useFixture();

  const ranked = participants
    .map((p) => {
      const positioningScore = calculatePositioningScore(p.positioning, officialOrder);
      return {
        slug: p.slug,
        name: p.name,
        positioning: positioningScore,
        crystalBall: p.crystalBall,
        total: positioningScore + p.crystalBall,
        topPicks: p.positioning.slice(0, 8).map((id) => TEAMS.find((t) => t.id === id)).filter(Boolean),
        fixtureTeamId: bestFixtureTeamId(matchdays, predictions, p.slug),
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <Layout>
      <Header />

      <section id="ranking" className="pb-6">
        <p className="font-sans font-bold text-[11px] tracking-[0.25em] uppercase text-slate mb-3">
          Ranking
        </p>
        <RankingList participants={ranked} onSelect={(p) => navigate(`/jugador/${p.slug}`)} />
      </section>

      <PlaySection />
      <RulesSummary />
    </Layout>
  );
}
