// Placa propia dentro del panel principal: superficie levemente
// distinguida (otra capa de profundidad, no solo texto suelto), con
// divisores internos entre los tres datos.
export default function RulesSummary() {
  return (
    <div id="reglas" className="pb-8 sm:pb-10">
      <div className="rounded-lg bg-black/[0.12] border border-panelLight/40 px-6 sm:px-8 py-6 sm:py-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0">
          <div className="sm:pr-8">
            <span className="font-head font-black text-4xl sm:text-5xl text-bone tabular-nums">360</span>
            <p className="font-sans text-xs text-slate mt-1">puntos posibles</p>
          </div>

          <div className="sm:px-8 sm:border-l sm:border-panelLight/40">
            <p className="font-sans font-semibold text-sm text-bone">180 · Posicionamiento</p>
            <p className="font-sans text-xs text-slate mt-1">+5 exacto · +3 zona correcta</p>
          </div>

          <div className="sm:pl-8 sm:border-l sm:border-panelLight/40">
            <p className="font-sans font-semibold text-sm text-bone">180 · Bola de Cristal</p>
            <p className="font-sans text-xs text-slate mt-1">Equipos · Jugadores · Estadísticas · Falopa</p>
          </div>
        </div>

        <p className="font-sans text-sm text-electric mt-6 pt-5 border-t border-panelLight/30">
          Una sola predicción. Toda la fase de liga.
        </p>
      </div>
    </div>
  );
}
