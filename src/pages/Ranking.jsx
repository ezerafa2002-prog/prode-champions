import Header from "../components/Header";
import Footer from "../components/Footer";
import PodiumCard from "../components/PodiumCard";
import RankingRow from "../components/RankingRow";

// Datos de ejemplo — se reemplaza por la consulta real a public_profiles.
const MOCK = [
  { slug: "ezequiel", name: "Ezequiel", total: 264, positioning: 148, crystalBall: 116 },
  { slug: "nacho", name: "Nacho", total: 241, positioning: 130, crystalBall: 111 },
  { slug: "mati", name: "Mati", total: 198, positioning: 122, crystalBall: 76 },
  { slug: "lucas", name: "Lucas", total: 175, positioning: 100, crystalBall: 75 },
  { slug: "fede", name: "Fede", total: 140, positioning: 95, crystalBall: 45 },
  { slug: "juan", name: "Juan", total: 118, positioning: 80, crystalBall: 38 },
];

export default function Ranking() {
  const [first, second, third, ...rest] = MOCK;

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <Header />

      <main id="ranking" className="flex-1 px-6 sm:px-10 -mt-10 sm:-mt-14 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Podio */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-12">
            <PodiumCard position={2} {...second} onClick={() => {}} />
            <PodiumCard position={1} {...first} onClick={() => {}} />
            <PodiumCard position={3} {...third} onClick={() => {}} />
          </div>

          {/* Resto del ranking */}
          <div>
            <div className="flex items-center gap-4 px-4 sm:px-5 pb-3 text-xs text-slate">
              <span className="w-8 shrink-0">#</span>
              <span className="w-11 shrink-0" />
              <span className="flex-1">Jugador</span>
              <span className="hidden sm:block w-16 text-right">Posic.</span>
              <span className="hidden sm:block w-16 text-right">Bola</span>
              <span className="w-16 text-right">Total</span>
            </div>

            <div className="flex flex-col gap-2">
              {rest.map((p, i) => (
                <RankingRow
                  key={p.slug}
                  position={i + 4}
                  name={p.name}
                  total={p.total}
                  positioning={p.positioning}
                  crystalBall={p.crystalBall}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
