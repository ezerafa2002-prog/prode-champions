import { useState } from "react";
import CrestStrip from "./CrestStrip";
import { TEAMS } from "../config/teams";

// Los 8 escudos NO se editan acá — se derivan automáticamente de
// `participant.positioning` (los primeros 8 de su predicción completa).
// Admin controla nombre, puntos de Bola de Cristal, y puede pedir la
// eliminación (la confirmación la maneja el padre, ver Admin.jsx).
export default function ParticipantEditor({ participant, onChange, onRequestDelete }) {
  const [open, setOpen] = useState(false);

  const top8Teams = participant.positioning
    .slice(0, 8)
    .map((id) => TEAMS.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="border-b border-panelLight/40 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-4 sm:px-6 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-sans text-slate text-xs w-4">{open ? "▾" : "▸"}</span>
        <span className="font-sans text-sm text-bone w-32 truncate">{participant.name}</span>
        <div className="hidden sm:block flex-1">
          <CrestStrip teams={top8Teams} limit={8} />
        </div>
        <span className="font-sans text-xs text-slate shrink-0">
          {participant.crystalBall} pts bola
        </span>
      </button>

      {open && (
        <div className="px-4 sm:px-6 pb-6 flex flex-col gap-5">
          <div>
            <label className="font-sans text-xs tracking-widest uppercase text-slate">
              Nombre
            </label>
            <input
              type="text"
              value={participant.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full mt-1.5 bg-black/20 border border-panelLight rounded px-3 py-2 font-sans text-sm text-bone focus:outline-none focus:border-electric"
            />
          </div>

          <div>
            <label className="font-sans text-xs tracking-widest uppercase text-slate">
              Top 8 pronosticado
            </label>
            <p className="font-sans text-[11px] text-slate/70 mt-1 mb-2">
              Se calcula automáticamente a partir de su Posicionamiento — no se edita acá.
            </p>
            <div className="recede-panel rounded-lg border border-panelLight p-3">
              <CrestStrip teams={top8Teams} limit={8} size="sm" gap="gap-3" />
            </div>
          </div>

          <div>
            <label className="font-sans text-xs tracking-widest uppercase text-slate">
              Puntos de Bola de Cristal
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={participant.crystalBall}
              onChange={(e) => onChange({ crystalBall: Number(e.target.value) || 0 })}
              className="w-32 mt-1.5 bg-black/20 border border-panelLight rounded px-3 py-2 font-sans text-sm text-bone focus:outline-none focus:border-electric"
            />
          </div>

          <div className="flex justify-end pt-1 border-t border-panelLight/30">
            <button
              type="button"
              onClick={onRequestDelete}
              className="font-sans text-xs text-rust hover:brightness-125 transition mt-4"
            >
              Eliminar participante
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
