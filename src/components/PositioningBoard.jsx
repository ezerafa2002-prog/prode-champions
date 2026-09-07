import { useEffect, useRef, useState } from "react";
import TeamBadge from "./TeamBadge";

// Divisores de zona: se insertan según la posición (1-indexed) que
// queda ANTES de cada fila en el orden actual.
const ZONE_AT = {
  1: { label: "Top 8", range: "1.º – 8.º" },
  9: { label: "Playoff", range: "9.º – 24.º" },
  25: { label: "Eliminado", range: "25.º – 36.º" },
};

const EDGE_ZONE = 90; // px desde el borde de la ventana donde empieza a autoscrollear
const MAX_SPEED = 18; // px por frame en el borde extremo

function ZoneDivider({ label, range }) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-2 bg-black/[0.15]">
      <span className="font-sans font-bold text-[10px] tracking-[0.2em] uppercase text-gold">
        {label}
      </span>
      <span className="h-px flex-1 bg-panelLight/60" />
      <span className="font-sans text-[10px] text-slate">{range}</span>
    </div>
  );
}

// Drag & drop real sobre la fila completa (no un handle chico): se
// agarra desde cualquier punto de la fila, con mouse o touch, vía
// Pointer Events. Mientras se arrastra, se recalcula la posición
// destino comparando contra la fila que está debajo del puntero, y si
// el puntero se acerca al borde superior/inferior de la ventana, la
// página hace auto-scroll para poder soltar más allá de lo visible.
export default function PositioningBoard({ order, onChange }) {
  const [draggingId, setDraggingId] = useState(null);
  const pointerYRef = useRef(null);
  const rafRef = useRef(null);

  function reorder(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const next = order.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  }

  function autoScrollTick() {
    const y = pointerYRef.current;
    if (y !== null) {
      const vh = window.innerHeight;
      if (y < EDGE_ZONE) {
        window.scrollBy(0, -MAX_SPEED * (1 - y / EDGE_ZONE));
      } else if (y > vh - EDGE_ZONE) {
        window.scrollBy(0, MAX_SPEED * (1 - (vh - y) / EDGE_ZONE));
      }
    }
    rafRef.current = requestAnimationFrame(autoScrollTick);
  }

  function handlePointerDown(e, teamId) {
    setDraggingId(teamId);
    pointerYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    rafRef.current = requestAnimationFrame(autoScrollTick);
  }

  function handlePointerMove(e) {
    if (draggingId === null) return;
    pointerYRef.current = e.clientY;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const rowEl = el?.closest("[data-row-index]");
    if (!rowEl) return;
    const targetIndex = Number(rowEl.dataset.rowIndex);
    const fromIndex = order.findIndex((t) => t.id === draggingId);
    if (fromIndex !== -1 && fromIndex !== targetIndex) {
      reorder(fromIndex, targetIndex);
    }
  }

  function stopDrag() {
    setDraggingId(null);
    pointerYRef.current = null;
    document.body.style.userSelect = "";
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }

  // Por si el componente se desmonta a mitad de un drag.
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    document.body.style.userSelect = "";
  }, []);

  return (
    <div className="recede-panel rounded-lg border border-panelLight shadow-card overflow-hidden">
      {order.map((team, i) => {
        const position = i + 1;
        const zone = ZONE_AT[position];
        const isDragging = draggingId === team.id;

        return (
          <div key={team.id}>
            {zone && <ZoneDivider label={zone.label} range={zone.range} />}

            <div
              data-row-index={i}
              onPointerDown={(e) => handlePointerDown(e, team.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              style={{ touchAction: "none" }}
              className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 border-b border-panelLight/40 last:border-b-0 transition-all cursor-grab active:cursor-grabbing select-none ${
                isDragging
                  ? "relative z-10 bg-electric/10 shadow-lg scale-[1.01]"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <span className="font-head font-bold tabular-nums text-lg w-8 text-slate shrink-0">
                {position}
              </span>

              <TeamBadge teamId={team.id} name={team.name} size="xs" />

              <span className="font-sans text-sm text-bone flex-1 truncate">{team.name}</span>

              {/* Indicador visual de "esto se arrastra" — decorativo,
                  no es el objetivo del gesto (la fila entera lo es). */}
              <div className="flex flex-col items-center justify-center gap-[3px] shrink-0 opacity-50">
                <span className="w-4 h-[2px] bg-panelLight" />
                <span className="w-4 h-[2px] bg-panelLight" />
                <span className="w-4 h-[2px] bg-panelLight" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
