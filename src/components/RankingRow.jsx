import CrestStrip from "./CrestStrip";
import TeamBadge from "./TeamBadge";

export default function RankingRow({ position, participant, isLast, onSelect }) {
  const { name, total, positioning, crystalBall, topPicks, fixtureTeamId } = participant;
  const isLeader = position === 1;

  return (
    <button
      onClick={() => onSelect(participant)}
      className={`w-full text-left transition-all border-l-4
        ${
          isLeader
            ? "border-l-gold bg-gradient-to-r from-gold/[0.08] to-transparent"
            : `border-l-transparent hover:border-l-electric/60 hover:bg-white/[0.025] hover:translate-x-0.5 ${
                position % 2 === 0 ? "row-band-even" : ""
              }`
        }
        ${!isLast ? "border-b border-panelLight/60" : ""}
      `}
    >
      {/* Mobile: dos líneas propias, no la desktop reducida */}
      <div className="sm:hidden px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span
            className={`font-head font-bold tabular-nums shrink-0 ${
              isLeader ? "text-3xl w-8 text-gold" : "text-xl w-7 text-slate"
            }`}
          >
            {position}
          </span>
          <TeamBadge teamId={fixtureTeamId} name={name} size="xs" />
          <span className={`font-sans flex-1 truncate ${isLeader ? "text-base text-bone" : "text-sm text-bone"}`}>
            {name}
          </span>
          <span className={`font-head font-bold tabular-nums shrink-0 ${isLeader ? "text-3xl text-bone" : "text-lg text-bone"}`}>
            {total}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 pl-11">
          <CrestStrip teams={topPicks} limit={6} gap="gap-1.5" />
          <span className="font-sans text-[11px] text-slate shrink-0">
            {positioning} posic. · {crystalBall} bola
          </span>
        </div>
      </div>

      {/* Desktop / tablet: una sola línea */}
      <div className={`hidden sm:flex items-center gap-4 sm:gap-6 px-6 ${isLeader ? "py-4" : "py-3"}`}>
        <span
          className={`font-head font-bold tabular-nums shrink-0 ${
            isLeader ? "text-3xl w-9 text-gold" : "text-xl w-7 text-slate"
          }`}
        >
          {position}
        </span>

        <TeamBadge teamId={fixtureTeamId} name={name} size="sm" />

        <span
          className={`font-sans shrink-0 truncate ${
            isLeader ? "text-lg text-bone w-28 sm:w-36" : "text-sm text-bone w-24 sm:w-32"
          }`}
        >
          {name}
        </span>

        <div className="flex-1 min-w-0">
          <CrestStrip teams={topPicks} limit={8} size="sm" gap="gap-3" />
        </div>

        <span className="hidden md:flex flex-col items-end text-[11px] text-slate leading-tight w-14 shrink-0">
          <span>{positioning}</span>
          <span className="text-slate/60">posic.</span>
        </span>

        <span className="hidden md:flex flex-col items-end text-[11px] text-slate leading-tight w-14 shrink-0">
          <span>{crystalBall}</span>
          <span className="text-slate/60">bola</span>
        </span>

        <span
          className={`font-head font-bold tabular-nums text-right shrink-0 ${
            isLeader ? "text-4xl w-20 text-bone" : "text-xl w-14 text-bone"
          }`}
        >
          {total}
        </span>
      </div>
    </button>
  );
}
