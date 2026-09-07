// Resuelto tipográficamente, no con un botón de librería: el peso y el
// trazo que crece al hover son la interacción — sin rounded-lg + fondo
// sólido + sombra genéricos.
import { Link } from "react-router-dom";

export default function PlaySection() {
  return (
    <div id="jugar" className="border-t border-panelLight/40 py-6 flex items-center justify-between gap-6">
      <p className="font-sans text-sm text-slate">¿Todavía no jugaste?</p>

      <Link to="/jugar" className="group inline-flex items-center gap-3">
        <span className="font-sans font-bold text-sm tracking-[0.2em] uppercase text-bone">
          Jugar
        </span>
        <span className="h-px w-8 bg-electric transition-all group-hover:w-14" />
      </Link>
    </div>
  );
}
