import TeamBadge from "./TeamBadge";

const RANK_STYLES = {
  1: { border: "border-t-gold", label: "text-gold", badgeSize: "lg" },
  2: { border: "border-t-silver", label: "text-silver", badgeSize: "md" },
  3: { border: "border-t-bronze", label: "text-bronze", badgeSize: "md" },
};

export default function PodiumCard({ position, name, total, positioning, crystalBall, onClick, layer }) {
  const s = RANK_STYLES[position];

  // `layer` define el tratamiento de profundidad: "front" (1º, sin transformar)
  // o "back" (2º/3º, con escala/opacidad reducidas para leerse "detrás").
  const depth = layer === "back" ? "scale-90 opacity-80" : "scale-100 opacity-100";

  return (
    <button
      onClick={onClick}
      className={`w-56 sm:w-64 shrink-0 bg-panel border border-panelLight border-t-4 ${s.border} rounded-xl px-6 py-7 text-center transition-transform duration-200 hover:!scale-100 hover:!opacity-100 ${depth}`}
    >
      <span className={`font-display text-sm tracking-[0.2em] ${s.label}`}>
        {position === 1 ? "1.º" : position === 2 ? "2.º" : "3.º"}
      </span>

      <div className="flex justify-center mt-3 mb-3">
        <TeamBadge name={name} size={s.badgeSize} />
      </div>

      <p className="font-sans text-base text-bone truncate">{name}</p>

      <p className="font-display font-black text-4xl text-bone mt-1 tabular-nums">
        {total}
      </p>

      <div className="flex justify-center gap-3 mt-2 text-[11px] text-slate">
        <span>{positioning} posic.</span>
        <span>{crystalBall} bola</span>
      </div>
    </button>
  );
}
