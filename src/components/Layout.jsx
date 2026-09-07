import Footer from "./Footer";

// El stage completo (atmósfera + capas del panel) vive acá, en un solo
// lugar. Cualquier pantalla nueva que use <Layout> hereda exactamente
// el mismo sistema visual que la Home — no hay forma de que se
// desalinee sin querer (ver DESIGN.md).
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-ink relative overflow-hidden flex flex-col">
      <div aria-hidden className="atmosphere">
        <span className="atmo-glow-a" />
        <span className="atmo-glow-b" />
        <span className="atmo-ring-a" />
        <span className="atmo-ring-b" />
        <span className="atmo-ring-c" />
        <span className="atmo-beam" />
        <span className="atmo-texture" />
      </div>

      <main className="relative z-10 flex-1 flex justify-center px-3 sm:px-5 py-6 sm:py-8">
        <div className="w-full max-w-7xl relative">
          <div aria-hidden className="stage-back" />

          <div className="relative stage-bezel rounded-2xl p-2 shadow-stage">
            <div className="stage-main stage-light relative rounded-xl overflow-hidden border border-white/[0.04]">
              <div className="relative px-4 sm:px-10">{children}</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
