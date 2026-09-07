import TeamBadge from "./TeamBadge";
import { TEAMS } from "../config/teams";

// Selección única de un equipo (a diferencia de un selector múltiple).
// Se usa
// para las preguntas de Bola de Cristal que piden un equipo.
export default function TeamSelectGrid({ value, onChange }) {
  return (
    <div className="recede-panel rounded-lg border border-panelLight p-2.5 max-h-48 overflow-y-auto">
      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
        {TEAMS.map((team) => {
          const selected = value === team.id;
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onChange(team.id)}
              title={team.name}
              className={`flex items-center justify-center rounded p-1.5 transition-colors ${
                selected ? "bg-electric/15 ring-1 ring-electric" : "hover:bg-white/[0.04]"
              }`}
            >
              <TeamBadge teamId={team.id} name={team.name} size="xs" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
