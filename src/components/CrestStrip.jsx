import TeamBadge from "./TeamBadge";

// Espaciado por gap, sin solape: con escudos transparentes (sin disco
// de fondo) el solape se leía como formas chocando entre sí. Un ritmo
// parejo se siente diseñado, no como un stack de avatares genérico.
export default function CrestStrip({ teams, limit = 8, size = "xs", gap = "gap-2" }) {
  const shown = teams.slice(0, limit);

  return (
    <div className={`flex items-center ${gap}`}>
      {shown.map((team) => (
        <TeamBadge key={team.id} teamId={team.id} name={team.name} size={size} />
      ))}
    </div>
  );
}
