// Cierre de la composición, no un simple "© 2026": rejilla de líneas
// que flanquean la marca (rima con el header) + una pequeña marca
// geométrica (rombo) como único detalle gráfico, muy discreto.
export default function Footer() {
  return (
    <footer className="px-3 sm:px-5 pb-8 sm:pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="border-t border-panelLight/50 pt-6 flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-panelLight" />
            <span className="w-1.5 h-1.5 rotate-45 bg-panelLight" />
            <span className="h-px w-6 bg-panelLight" />
          </div>

          <p className="font-sans font-semibold tracking-[0.2em] text-[11px] uppercase text-slate">
            Prode Champions 2026/27
          </p>
          <p className="font-sans text-xs text-slate/60">
            Fase de liga · Torneo privado entre amigos
          </p>
        </div>
      </div>
    </footer>
  );
}
