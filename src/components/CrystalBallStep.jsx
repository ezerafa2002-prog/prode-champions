import TeamSelectGrid from "./TeamSelectGrid";

function PlayerInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Nombre del jugador…"
      className="w-full bg-black/20 border border-panelLight rounded px-3 py-2.5 font-sans text-sm text-bone placeholder:text-slate/60 focus:outline-none focus:border-electric"
    />
  );
}

function BooleanToggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {["Sí", "No"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-2.5 font-sans font-semibold text-sm rounded border transition-colors ${
            value === opt
              ? "border-electric text-bone bg-electric/10"
              : "border-panelLight text-slate hover:border-electric/50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function OptionsPills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 font-sans font-semibold text-sm rounded border transition-colors ${
            value === opt
              ? "border-electric text-bone bg-electric/10"
              : "border-panelLight text-slate hover:border-electric/50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function CrystalBallStep({ category, answers, onAnswer, noSurface = false }) {
  const questions = (
    <div className="flex flex-col gap-4">
      {category.questions.map((q, i) => {
        const answered = answers[q.key] !== undefined && answers[q.key] !== null && answers[q.key] !== "";
        return (
          <div
            key={q.key}
            className={`rounded-md border px-4 py-4 transition-colors ${
              answered ? "border-electric/40 bg-electric/[0.04]" : "border-panelLight/50"
            }`}
          >
            <div className="flex items-baseline justify-between mb-3">
              <label className="font-sans text-sm text-bone">
                <span className="text-slate mr-1.5">{i + 1}.</span>
                {q.label}
              </label>
              <span className="font-sans text-[11px] text-slate shrink-0 ml-3">{q.points} pts</span>
            </div>

            {q.type === "team" && (
              <TeamSelectGrid value={answers[q.key]} onChange={(v) => onAnswer(q.key, v)} />
            )}
            {q.type === "player" && (
              <PlayerInput value={answers[q.key]} onChange={(v) => onAnswer(q.key, v)} />
            )}
            {q.type === "boolean" && (
              <BooleanToggle value={answers[q.key]} onChange={(v) => onAnswer(q.key, v)} />
            )}
            {q.type === "options" && (
              <OptionsPills
                options={q.options}
                value={answers[q.key]}
                onChange={(v) => onAnswer(q.key, v)}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  if (noSurface) return questions;

  return (
    <div className="rounded-lg bg-black/[0.12] border border-panelLight/40 px-5 sm:px-8 py-6 sm:py-7">
      <div className="flex items-baseline justify-between mb-6">
        <p className="font-sans font-bold text-sm tracking-[0.15em] uppercase text-bone">
          {category.label}
        </p>
        <p className="font-sans text-xs text-slate">{category.points} pts</p>
      </div>

      {questions}
    </div>
  );
}
