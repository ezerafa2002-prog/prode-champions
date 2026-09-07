import TeamBadge from "./TeamBadge";
import { TEAMS } from "../config/teams";

// `value`: array de team ids, en orden (índice 0 = 1.º del Top 8).
export default function TeamPicker({ value, onChange }) {
  const isFull = value.length >= 8;

  function toggle(teamId) {
    if (value.includes(teamId)) {
      onChange(value.filter((id) => id !== teamId));
    } else if (!isFull) {
      onChange([...value, teamId]);
    }
  }

  return (
    <div className="recede-panel rounded-lg border border-panelLight p-3 max-h-56 overflow-y-auto">
      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
        {TEAMS.map((team) => {
          const order = value.indexOf(team.id);
          const selected = order !== -1;
          const disabled = !selected && isFull;

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => toggle(team.id)}
              disabled={disabled}
              title={team.name}
              className={`relative flex items-center justify-center rounded p-1.5 transition-colors ${
                selected ? "bg-electric/15 ring-1 ring-electric" : "hover:bg-white/[0.04]"
              } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <TeamBadge teamId={team.id} name={team.name} size="xs" />
              {selected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-ink text-[10px] font-sans font-bold flex items-center justify-center">
                  {order + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
