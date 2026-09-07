import RankingRow from "./RankingRow";

export default function RankingList({ participants, onSelect }) {
  return (
    <div className="recede-panel rounded-lg border border-panelLight shadow-card overflow-hidden">
      {participants.map((p, i) => (
        <RankingRow
          key={p.slug}
          position={i + 1}
          participant={p}
          isLast={i === participants.length - 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
