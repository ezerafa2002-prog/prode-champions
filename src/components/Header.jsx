// Contenido dentro del panel principal — compacto en altura, pero con
// más presencia de diseño: líneas que flanquean la marca, una etiqueta
// de fase con borde (no un botón), y nav integrada con separadores en
// vez de espaciado suelto.
export default function Header() {
  return (
    <div className="flex flex-col items-center text-center pt-8 sm:pt-9 pb-5">
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="hidden sm:block h-px w-10 bg-panelLight" />
        <p className="font-serif italic font-semibold text-[28px] sm:text-[34px] leading-none tracking-tight text-bone">
          Prode Champions <span className="not-italic font-bold text-gold">26/27</span>
        </p>
        <span className="hidden sm:block h-px w-10 bg-panelLight" />
      </div>

      <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full border border-panelLight text-[10px] tracking-[0.2em] uppercase text-slate">
        Fase de liga · 2026/27
      </span>

      <nav className="font-sans font-semibold text-[11px] tracking-[0.18em] uppercase text-slate mt-5">
        <a href="#ranking" className="hover:text-bone transition-colors">
          Ranking
        </a>
        <span className="mx-3 text-panelLight">·</span>
        <a href="#jugar" className="hover:text-bone transition-colors">
          Jugar
        </a>
        <span className="mx-3 text-panelLight">·</span>
        <a href="#reglas" className="hover:text-bone transition-colors">
          Reglas
        </a>
      </nav>
    </div>
  );
}
