const STEP_LABELS = ["Identificación", "Posicionamiento", "Bola de Cristal"];

export default function PlayHeader({ step }) {
  return (
    <div className="flex flex-col items-center text-center pt-8 sm:pt-9 pb-6">
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="hidden sm:block h-px w-10 bg-panelLight" />
        <p className="font-serif italic font-semibold text-2xl sm:text-3xl leading-none tracking-tight text-bone">
          Jugá el Prode <span className="not-italic font-bold text-gold">26/27</span>
        </p>
        <span className="hidden sm:block h-px w-10 bg-panelLight" />
      </div>

      <div className="flex items-center gap-2 mt-5">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-gold" : i < step ? "bg-electric" : "bg-panelLight"}`}
            />
            <span
              className={`font-sans text-[11px] tracking-[0.15em] uppercase ${
                i === step ? "text-bone" : "text-slate"
              }`}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && <span className="h-px w-4 bg-panelLight ml-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
