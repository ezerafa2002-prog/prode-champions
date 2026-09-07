import TeamBadge from "./TeamBadge";

// Muestra los primeros `limit` equipos que el participante pronosticó
// en esa posición, superpuestos apenas (como una alineación). `teams`
// es un array ordenado de { id, name, badgeSrc } — viene de cruzar
// positioning con la config de TEAMS.

export default function PredictedTopStrip({ teams, limit = 8 }) {
  const shown = teams.slice(0, limit);

  return (
    <div className="flex">
      {shown.map((team, i) => (
        <div key={team.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <TeamBadge teamId={team.id} name={team.name} size="xs" />
        </div>
      ))}
    </div>
  );
}
