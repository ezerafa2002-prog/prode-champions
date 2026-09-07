function countAnswered(category, answers) {
  const catAnswers = answers[category.key] ?? {};
  return category.questions.filter((q) => {
    const v = catAnswers[q.key];
    return v !== undefined && v !== null && v !== "";
  }).length;
}

export default function CrystalBallMenu({ categories, answers, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {categories.map((cat) => {
        const answered = countAnswered(cat, answers);
        const total = cat.questions.length;
        const complete = answered === total;

        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.key)}
            className={`recede-panel rounded-lg border px-4 py-6 text-center transition-colors ${
              complete ? "border-gold/60" : "border-panelLight hover:border-electric/50"
            }`}
          >
            <p className="font-sans font-bold text-sm tracking-[0.15em] uppercase text-bone">
              {cat.label}
            </p>
            <p className="font-head font-bold text-3xl text-bone mt-2 tabular-nums">
              {cat.points}
            </p>
            <p className="font-sans text-[11px] text-slate mt-1">pts</p>

            <p
              className={`font-sans text-[11px] tracking-wide mt-3 ${
                complete ? "text-gold" : "text-slate"
              }`}
            >
              {answered}/{total} {complete ? "· completo" : "respondidas"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
